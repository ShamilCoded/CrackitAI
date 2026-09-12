/**
 * Diagnostic Service
 *
 * Coordinates end-to-end Diagnostic Engine operations:
 * - Test template retrieval and quota-driven question sampling
 * - Attempt lifecycle management (start, answer recording, evaluation)
 * - Configurable scoring and classification via DiagnosticScoringService
 * - AI-powered synthesis of conceptual weaknesses
 * - Instant access to rich demo diagnostic results for evaluation
 */

import type {
  ExamType,
  Question,
  DiagnosticAttempt,
  DiagnosticTest,
  CreateDiagnosticTestInput,
  DiagnosticAnswer,
  DiagnosticScoringConfig,
} from '@/types';
import { aiService } from '@/services/ai/gemini.service';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { diagnosticScoringService } from './diagnostic-scoring.service';
import { SEED_DIAGNOSTICS, SEED_QUESTIONS } from '@/database/seed-data';
import { DEMO_DIAGNOSTIC_ATTEMPT, DEMO_MDCAT_DIAGNOSTIC_ATTEMPT, DEMO_STUDENT_ID } from '@/database/demo-data';
import { masteryService } from '@/services/mastery/mastery.service';

export interface ScoreSubmissionInput {
  examType: ExamType;
  diagnosticId: string;
  studentId: string;
  studentName?: string;
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
    timeSpentSeconds: number;
    confidence?: 'low' | 'medium' | 'high';
  }>;
  scoringConfigOverrides?: Partial<DiagnosticScoringConfig>;
}

export interface ActiveDiagnosticSession {
  attemptId: string;
  diagnosticTestId: string;
  studentId: string;
  studentName: string;
  examType: ExamType;
  startedAt: string;
  questions: Question[];
  answers: Map<string, DiagnosticAnswer>;
}

class DiagnosticService {
  // In-memory sessions and completed attempts for fast runtime access
  private activeSessions = new Map<string, ActiveDiagnosticSession>();
  private completedAttempts = new Map<string, DiagnosticAttempt>();
  private customTests: DiagnosticTest[] = [];

  constructor() {
    // Seed in-memory completed attempts with demo runs
    this.completedAttempts.set(DEMO_DIAGNOSTIC_ATTEMPT.id, DEMO_DIAGNOSTIC_ATTEMPT);
    this.completedAttempts.set(DEMO_MDCAT_DIAGNOSTIC_ATTEMPT.id, DEMO_MDCAT_DIAGNOSTIC_ATTEMPT);
  }

  /**
   * List all available diagnostic test configurations for an exam
   */
  async getDiagnosticTests(examType?: ExamType): Promise<DiagnosticTest[]> {
    const seedTests: DiagnosticTest[] = SEED_DIAGNOSTICS.map((d) => {
      const type: ExamType = d.examId.includes('mdcat') ? 'MDCAT' : 'ECAT';
      return {
        id: d.id,
        examId: d.examId,
        examType: type,
        name: d.name,
        description: d.description,
        totalQuestions: d.totalQuestions,
        timeLimitMinutes: d.timeLimitMinutes,
        testConfiguration: {
          subjectBreakdown: d.subjectBreakdown.map((s) => ({
            subjectId: s.subjectId,
            questionCount: s.questionCount,
          })),
        },
        questionIds: [],
        isActive: d.isActive,
        createdAt: new Date().toISOString(),
      };
    });

    const all = [...seedTests, ...this.customTests];
    if (examType) {
      return all.filter((t) => t.examType === examType && t.isActive);
    }
    return all.filter((t) => t.isActive);
  }

  /**
   * Get diagnostic test by ID
   */
  async getDiagnosticTestById(testId: string): Promise<DiagnosticTest | null> {
    const tests = await this.getDiagnosticTests();
    return tests.find((t) => t.id === testId) || null;
  }

  /**
   * Create a custom diagnostic test configuration
   */
  async createDiagnosticTest(input: CreateDiagnosticTestInput): Promise<DiagnosticTest> {
    const id = input.id || `diag-${input.examType.toLowerCase()}-${Date.now().toString(36)}`;
    const newTest: DiagnosticTest = {
      id,
      examId: input.examId || (input.examType === 'ECAT' ? 'exam-ecat' : 'exam-mdcat'),
      examType: input.examType,
      name: input.name,
      description: input.description,
      totalQuestions: input.totalQuestions || 15,
      timeLimitMinutes: input.timeLimitMinutes || 30,
      testConfiguration: input.testConfiguration || {
        subjectBreakdown: [],
      },
      questionIds: input.questionIds || [],
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
    };

    this.customTests.push(newTest);
    return newTest;
  }

  /**
   * Fetch and assemble diagnostic questions according to syllabus quotas
   */
  async getQuestionsForDiagnostic(testId: string, examType?: ExamType): Promise<Question[]> {
    const test = await this.getDiagnosticTestById(testId);
    const resolvedExamType: ExamType = test?.examType || examType || 'ECAT';

    // 1. If test has explicit questionIds, load them
    if (test && test.questionIds && test.questionIds.length > 0) {
      const explicitQuestions = SEED_QUESTIONS.filter((q) => test.questionIds.includes(q.id));
      if (explicitQuestions.length > 0) return explicitQuestions;
    }

    // 2. Sample questions based on subject quotas
    const allQuestions = await curriculumService.getQuestions({
      examType: resolvedExamType,
    });

    const candidatePool = allQuestions.length > 0 ? allQuestions : SEED_QUESTIONS.filter((q) => q.status === 'approved');

    if (test && test.testConfiguration?.subjectBreakdown && test.testConfiguration.subjectBreakdown.length > 0) {
      const selected: Question[] = [];
      const seenIds = new Set<string>();

      for (const quota of test.testConfiguration.subjectBreakdown) {
        const subjectPool = candidatePool.filter(
          (q) => q.subjectId === quota.subjectId && !seenIds.has(q.id)
        );

        // Take up to quota.questionCount
        const countToTake = Math.min(quota.questionCount, subjectPool.length);
        for (let i = 0; i < countToTake; i++) {
          selected.push(subjectPool[i]);
          seenIds.add(subjectPool[i].id);
        }
      }

      // If we met or came close to requirement, return
      if (selected.length > 0) {
        return selected;
      }
    }

    // 3. Fallback: select representative questions across key subjects
    const filteredByExam = candidatePool.filter((q) => {
      if (q.applicableExams && q.applicableExams.length > 0) {
        return q.applicableExams.includes(resolvedExamType);
      }
      return true;
    });

    return filteredByExam.length > 0 ? filteredByExam.slice(0, 15) : candidatePool.slice(0, 15);
  }

  /**
   * Start a new live diagnostic assessment attempt
   */
  async startDiagnosticAttempt(params: {
    studentId?: string;
    studentName?: string;
    diagnosticTestId: string;
    examType: ExamType;
  }): Promise<{
    attemptId: string;
    test: DiagnosticTest;
    questions: Question[];
    startedAt: string;
  }> {
    const studentId = params.studentId || DEMO_STUDENT_ID;
    const studentName = params.studentName || (params.examType === 'ECAT' ? 'Zubair Ahmed' : 'Ayesha Khan');
    const attemptId = `diag-att-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const startedAt = new Date().toISOString();

    let test = await this.getDiagnosticTestById(params.diagnosticTestId);
    if (!test) {
      const allTests = await this.getDiagnosticTests(params.examType);
      test = allTests[0] || {
        id: params.diagnosticTestId,
        examId: params.examType === 'ECAT' ? 'exam-ecat' : 'exam-mdcat',
        examType: params.examType,
        name: `${params.examType} Baseline Diagnostic`,
        description: `Comprehensive baseline knowledge assessment for ${params.examType}.`,
        totalQuestions: 15,
        timeLimitMinutes: 30,
        testConfiguration: { subjectBreakdown: [] },
        questionIds: [],
        isActive: true,
        createdAt: startedAt,
      };
    }

    const questions = await this.getQuestionsForDiagnostic(test.id, params.examType);

    // Save session in active store
    this.activeSessions.set(attemptId, {
      attemptId,
      diagnosticTestId: test.id,
      studentId,
      studentName,
      examType: params.examType,
      startedAt,
      questions,
      answers: new Map(),
    });

    return {
      attemptId,
      test,
      questions,
      startedAt,
    };
  }

  /**
   * Record a single question answer in an ongoing session
   */
  async recordDiagnosticAnswer(attemptId: string, answer: DiagnosticAnswer): Promise<void> {
    const session = this.activeSessions.get(attemptId);
    if (session) {
      session.answers.set(answer.questionId, {
        ...answer,
        attemptedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Complete and evaluate an ongoing diagnostic session
   */
  async completeDiagnosticAttempt(params: {
    attemptId: string;
    answers?: DiagnosticAnswer[];
    scoringConfigOverrides?: Partial<DiagnosticScoringConfig>;
  }): Promise<DiagnosticAttempt> {
    const session = this.activeSessions.get(params.attemptId);
    const completedAt = new Date().toISOString();

    // Prepare inputs
    let questions: Question[] = [];
    let answers: DiagnosticAnswer[] = [];
    let examType: ExamType = 'ECAT';
    let studentId = DEMO_STUDENT_ID;
    let studentName = 'Student';
    let diagnosticTestId = 'diag-ecat-prelim';
    let startedAt = new Date(Date.now() - 1000 * 60 * 25).toISOString();

    if (session) {
      questions = session.questions;
      examType = session.examType;
      studentId = session.studentId;
      studentName = session.studentName;
      diagnosticTestId = session.diagnosticTestId;
      startedAt = session.startedAt;

      // Merge session answers with final answers passed
      const answerMap = new Map<string, DiagnosticAnswer>(session.answers);
      if (params.answers) {
        for (const a of params.answers) {
          answerMap.set(a.questionId, a);
        }
      }
      answers = Array.from(answerMap.values());
    } else {
      // If session not found, fallback to provided answers or seed questions
      answers = params.answers || [];
      questions = await this.getQuestionsForDiagnostic(diagnosticTestId, examType);
    }

    // Evaluate mathematically using DiagnosticScoringService
    const evaluated = diagnosticScoringService.evaluateAttempt({
      attemptId: params.attemptId,
      diagnosticTestId,
      studentId,
      studentName,
      examType,
      startedAt,
      completedAt,
      questions,
      answers,
      scoringConfigOverrides: params.scoringConfigOverrides,
    });

    // Generate AI Diagnostic Summary asynchronously / with fallback
    try {
      const aiResponse = await aiService.analyzeDiagnosticWeaknesses({
        examType,
        studentName,
        totalScore: evaluated.totalScore,
        maxScore: evaluated.maxScore,
        subjectScores: Object.fromEntries(
          Object.entries(evaluated.subjectBreakdown).map(([k, v]) => [
            k,
            { subjectName: v.subjectName, score: v.score, maxScore: v.maxScore, accuracyPercentage: v.accuracy },
          ])
        ),
        topicBreakdown: Object.values(evaluated.topicBreakdown).map((t) => ({
          topicName: t.topicName,
          subjectName: t.subjectName,
          attempted: t.attempted,
          correct: t.correct,
          accuracyPercentage: t.accuracy,
        })),
      });

      if (aiResponse && aiResponse.overallAssessment) {
        evaluated.aiDiagnosticSummary = aiResponse.overallAssessment;
      }
    } catch {
      // Fallback deterministic summary
      const weakTopicNames = evaluated.weakTopics.map((w) => w.topicName).join(', ');
      evaluated.aiDiagnosticSummary = evaluated.weakTopics.length > 0
        ? `Assessment complete. Primary focus areas identified: ${weakTopicNames}. Prioritize these topics in your personalized study plan to maximize ${examType} score gains.`
        : `Excellent baseline assessment! You have demonstrated solid foundational competence across all tested topics. Proceed to exam-level practice questions.`;
    }

    // Store completed attempt
    this.completedAttempts.set(evaluated.id, evaluated);
    this.activeSessions.delete(params.attemptId);

    // Single source of truth: Update centralized Topic Mastery Engine for all tested topics
    try {
      if (evaluated.topicBreakdown) {
        Object.entries(evaluated.topicBreakdown).forEach(([topicId, topicPerf]) => {
          masteryService.recordDiagnosticAssessment({
            studentId,
            topicId,
            subjectId: topicPerf.subjectId,
            attemptedCount: topicPerf.attempted,
            correctCount: topicPerf.correct,
            accuracy: topicPerf.accuracy,
            completedAt,
          });
        });
      }
    } catch {
      // Non-blocking telemetry
    }

    return evaluated;
  }

  /**
   * Get diagnostic attempt by ID
   */
  async getDiagnosticAttempt(attemptId: string): Promise<DiagnosticAttempt | null> {
    const cached = this.completedAttempts.get(attemptId);
    if (cached) return cached;

    if (attemptId === DEMO_DIAGNOSTIC_ATTEMPT.id) return DEMO_DIAGNOSTIC_ATTEMPT;
    if (attemptId === DEMO_MDCAT_DIAGNOSTIC_ATTEMPT.id) return DEMO_MDCAT_DIAGNOSTIC_ATTEMPT;

    return null;
  }

  /**
   * Get latest diagnostic attempt for a student
   */
  async getLatestAttemptForStudent(studentId: string, examType?: ExamType): Promise<DiagnosticAttempt | null> {
    const attempts = Array.from(this.completedAttempts.values()).filter((a) => {
      const matchStudent = a.studentId === studentId || studentId === DEMO_STUDENT_ID;
      const matchExam = examType ? a.examType === examType : true;
      return matchStudent && matchExam;
    });

    if (attempts.length > 0) {
      // Return most recent completed attempt
      attempts.sort((a, b) => new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime());
      return attempts[0];
    }

    // Default to demo diagnostic attempt
    return this.getDemoDiagnosticAttempt(examType);
  }

  /**
   * Return pre-populated demo diagnostic attempt for immediate inspection
   */
  getDemoDiagnosticAttempt(examType?: ExamType): DiagnosticAttempt {
    if (examType === 'MDCAT') {
      return DEMO_MDCAT_DIAGNOSTIC_ATTEMPT;
    }
    return DEMO_DIAGNOSTIC_ATTEMPT;
  }

  /**
   * Legacy score submission method preserved for backward compatibility
   */
  async evaluateDiagnostic(input: ScoreSubmissionInput): Promise<DiagnosticAttempt> {
    const questions = await this.getQuestionsForDiagnostic(input.diagnosticId, input.examType);
    const convertedAnswers: DiagnosticAnswer[] = input.answers.map((a) => ({
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId,
      timeSpentSeconds: a.timeSpentSeconds,
      confidence: a.confidence,
    }));

    const attemptId = `diag-att-${Date.now().toString(36)}`;
    const startedAt = new Date(Date.now() - 1000 * 60 * 30).toISOString();

    const evaluated = diagnosticScoringService.evaluateAttempt({
      attemptId,
      diagnosticTestId: input.diagnosticId,
      studentId: input.studentId,
      studentName: input.studentName || 'Student',
      examType: input.examType,
      startedAt,
      completedAt: new Date().toISOString(),
      questions,
      answers: convertedAnswers,
      scoringConfigOverrides: input.scoringConfigOverrides,
    });

    try {
      const aiResponse = await aiService.analyzeDiagnosticWeaknesses({
        examType: input.examType,
        studentName: input.studentName || 'Student',
        totalScore: evaluated.totalScore,
        maxScore: evaluated.maxScore,
        subjectScores: Object.fromEntries(
          Object.entries(evaluated.subjectBreakdown).map(([k, v]) => [
            k,
            { subjectName: v.subjectName, score: v.score, maxScore: v.maxScore, accuracyPercentage: v.accuracy },
          ])
        ),
        topicBreakdown: Object.values(evaluated.topicBreakdown).map((t) => ({
          topicName: t.topicName,
          subjectName: t.subjectName,
          attempted: t.attempted,
          correct: t.correct,
          accuracyPercentage: t.accuracy,
        })),
      });

      evaluated.aiDiagnosticSummary = aiResponse.overallAssessment;
    } catch {
      evaluated.aiDiagnosticSummary =
        'Diagnostic evaluated successfully. Critical focus recommended on flagged weak topics.';
    }

    this.completedAttempts.set(evaluated.id, evaluated);

    // Single source of truth: Update centralized Topic Mastery Engine
    try {
      if (evaluated.topicBreakdown) {
        Object.entries(evaluated.topicBreakdown).forEach(([topicId, topicPerf]) => {
          masteryService.recordDiagnosticAssessment({
            studentId: input.studentId,
            topicId,
            subjectId: topicPerf.subjectId,
            attemptedCount: topicPerf.attempted,
            correctCount: topicPerf.correct,
            accuracy: topicPerf.accuracy,
            completedAt: evaluated.completedAt,
          });
        });
      }
    } catch {
      // Non-blocking
    }

    return evaluated;
  }

  public getCompletedAttempts(studentId?: string, examType?: ExamType): DiagnosticAttempt[] {
    const all = Array.from(this.completedAttempts.values());
    return all
      .filter(
        (a) =>
          (!studentId || a.studentId === studentId || studentId === DEMO_STUDENT_ID) &&
          (!examType || a.examType === examType)
      )
      .sort((a, b) => new Date(b.completedAt || b.startedAt || 0).getTime() - new Date(a.completedAt || a.startedAt || 0).getTime());
  }
}

export const diagnosticService = new DiagnosticService();

/**
 * Mock Exam Service
 *
 * Coordinates end-to-end Mock Exam operations for ECAT and MDCAT:
 * - Exam configuration & preset management (Sprint, Mini, Standard, Custom)
 * - Proportional subject-quota question sampling from existing question bank
 * - Active timed session lifecycle (navigation, mark for review, answer recording, auto-submit)
 * - Strict exam scoring (ECAT +4/-1 negative marking, MDCAT +1/0)
 * - Multi-dimensional analytics: Subject breakdown, Topic breakdown, Time & pacing analysis
 * - In-depth mistakes review & AI recommendations
 * - Clean telemetry integration via sourceContext: 'mock_exam' to prevent corruption of diagnostic tests
 */

import type {
  ExamType,
  Question,
  MockExam,
  MockAttempt,
  MockAnswer,
  MockExamQuestion,
  MockSubjectBreakdown,
  MockTopicBreakdown,
  MockTimeAnalysis,
  MockMistakeItem,
  MockRecommendation,
  MockPresetKey,
  GenerateMockExamConfig,
} from '@/types';
import { SEED_QUESTIONS, SEED_EXAMS, SEED_SUBJECTS, SEED_TOPICS } from '@/database/seed-data';
import { DEMO_STUDENT_ID } from '@/database/demo-data';
import { questionService } from '@/services/question/question.service';
import { masteryService } from '@/services/mastery/mastery.service';
import { examConfigService } from '@/services/exam/exam-config.service';
import { createClient } from '@/lib/supabase/client';

export interface ActiveMockSession {
  attemptId: string;
  studentId?: string;
  mockExam: MockExam;
  questions: MockExamQuestion[];
  answers: Map<string, MockAnswer>;
  startedAt: string;
  timeRemainingSeconds: number;
  totalDurationSeconds: number;
  isCompleted: boolean;
}

class MockExamService {
  // In-memory active sessions and completed attempts for fast runtime & preview resilience
  private activeSessions = new Map<string, ActiveMockSession>();
  private completedAttempts = new Map<string, MockAttempt>();

  constructor() {
    this.seedDemoMockAttempts();
  }

  private isSupabaseConfigured(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    );
  }

  // ==========================================================================
  // 1. EXAM CONFIGURATION & QUESTION GENERATION
  // ==========================================================================

  /**
   * Get default subject weight distribution for an exam
   */
  public getSubjectDistributionForExam(examType: ExamType): Array<{
    subjectId: string;
    subjectName: string;
    weightPercentage: number;
  }> {
    const config = examConfigService.getConfig(examType);
    return config.subjects.map((s) => ({
      subjectId: s.id,
      subjectName: s.name,
      weightPercentage: s.weightPercentage,
    }));
  }

  /**
   * Generate or retrieve questions for a mock exam matching official subject quotas
   */
  public generateMockExam(config: GenerateMockExamConfig): {
    mockExam: MockExam;
    questions: MockExamQuestion[];
  } {
    const { examType, questionCount, presetKey } = config;
    const isEcat = examType === 'ECAT';
    const examConfig = examConfigService.getConfig(examType);

    // Official marking parameters from unified config
    const negativeMarking = examConfig.scoring.negativeMarking;
    const negativeMarkingPenalty = examConfig.scoring.negativeMarkingPenalty;
    const passingPercentage = examConfig.scoring.passingPercentage;

    // Time pacing: ECAT ~1 min/question, MDCAT ~1.05 min/question
    const minutesPerQuestion = isEcat ? 1.0 : 1.05;
    const defaultDurationMinutes = Math.max(5, Math.round(questionCount * minutesPerQuestion));
    const durationMinutes = config.durationMinutes || defaultDurationMinutes;

    // Subject quotas
    const distribution = this.getSubjectDistributionForExam(examType);

    // Retrieve active approved candidate questions for this exam
    const candidatePool = SEED_QUESTIONS.filter((q) => {
      if (!q.isActive) return false;
      if (q.status && q.status !== 'approved') return false;
      return q.applicableExams.includes(examType);
    });

    // Sample questions proportional to subject quotas
    const selectedQuestions: Question[] = [];
    const quotas: MockExam['subjectQuotas'] = [];

    // First pass: Allocate desired count per subject
    const desiredPerSubject = distribution.map((dist) => {
      const count = Math.max(1, Math.round((dist.weightPercentage / 100) * questionCount));
      return { ...dist, desiredCount: count };
    });

    // Adjust sum to match exact total question count
    let currentSum = desiredPerSubject.reduce((acc, d) => acc + d.desiredCount, 0);
    while (currentSum > questionCount) {
      // Decrement the largest
      const largest = desiredPerSubject.reduce((prev, curr) =>
        curr.desiredCount > prev.desiredCount ? curr : prev
      );
      if (largest.desiredCount > 1) {
        largest.desiredCount -= 1;
        currentSum -= 1;
      } else {
        break;
      }
    }
    while (currentSum < questionCount) {
      // Increment the subject with highest weight
      desiredPerSubject[0].desiredCount += 1;
      currentSum += 1;
    }

    // Collect questions per subject
    const usedIds = new Set<string>();

    desiredPerSubject.forEach((subj) => {
      const subjectPool = candidatePool.filter(
        (q) => q.subjectId === subj.subjectId && !usedIds.has(q.id)
      );

      // Shuffle subject pool
      const shuffled = [...subjectPool].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, subj.desiredCount);

      chosen.forEach((q) => {
        usedIds.add(q.id);
        selectedQuestions.push(q);
      });

      quotas.push({
        subjectId: subj.subjectId,
        subjectName: subj.subjectName,
        questionCount: chosen.length,
        weightPercentage: subj.weightPercentage,
      });
    });

    // If we still need more questions (in case a subject pool was smaller than desired)
    if (selectedQuestions.length < questionCount) {
      const remainingCandidates = candidatePool
        .filter((q) => !usedIds.has(q.id))
        .sort(() => Math.random() - 0.5);

      const needed = questionCount - selectedQuestions.length;
      const extra = remainingCandidates.slice(0, needed);
      extra.forEach((q) => {
        usedIds.add(q.id);
        selectedQuestions.push(q);
        // Update quota
        const quota = quotas.find((sq) => sq.subjectId === q.subjectId);
        if (quota) {
          quota.questionCount += 1;
        }
      });
    }

    // Format final questions with exam order and subject name
    const subjectNameMap = new Map(SEED_SUBJECTS.map((s) => [s.id, s.name]));
    const topicNameMap = new Map(SEED_TOPICS.map((t) => [t.id, t.name]));

    const formattedQuestions: MockExamQuestion[] = selectedQuestions.map((q, index) => ({
      ...q,
      examOrder: index + 1,
      subjectName: subjectNameMap.get(q.subjectId) || 'General',
      topicName: topicNameMap.get(q.topicId) || 'General Topic',
    }));

    const mockExamId = `mock-${examType.toLowerCase()}-${presetKey || 'custom'}-${Date.now()}`;
    const title =
      config.title ||
      `${examType} ${presetKey === 'sprint_10' ? 'Sprint' : presetKey === 'mini_20' ? 'Mini' : 'Standard'} Mock Exam (${formattedQuestions.length} MCQs)`;

    const mockExam: MockExam = {
      id: mockExamId,
      examId: isEcat ? 'exam-ecat' : 'exam-mdcat',
      examType,
      title,
      description: isEcat
        ? `Official UET ECAT simulation with negative marking (+4 correct, -1 wrong, 0 skipped).`
        : `Official PMDC MDCAT simulation with standard marking (+1 correct, no negative penalty).`,
      year: 2026,
      isOfficialFormat: true,
      totalQuestions: formattedQuestions.length,
      durationMinutes,
      negativeMarking,
      negativeMarkingPenalty,
      passingPercentage,
      presetKey: presetKey || 'custom',
      subjectQuotas: quotas,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    return { mockExam, questions: formattedQuestions };
  }

  // ==========================================================================
  // 2. ACTIVE SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Start a new interactive mock exam session
   */
  public startMockAttempt(
    studentId: string,
    mockExam: MockExam,
    questions: MockExamQuestion[]
  ): ActiveMockSession {
    const attemptId = `mock-attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const answers = new Map<string, MockAnswer>();

    // Initialize blank answers for all questions
    questions.forEach((q) => {
      answers.set(q.id, {
        questionId: q.id,
        selectedOptionId: undefined,
        isMarkedForReview: false,
        timeSpentSeconds: 0,
        visited: false,
      });
    });

    // Mark the first question as visited
    if (questions.length > 0) {
      const first = answers.get(questions[0].id);
      if (first) first.visited = true;
    }

    const session: ActiveMockSession = {
      attemptId,
      studentId,
      mockExam,
      questions,
      answers,
      startedAt: new Date().toISOString(),
      timeRemainingSeconds: mockExam.durationMinutes * 60,
      totalDurationSeconds: mockExam.durationMinutes * 60,
      isCompleted: false,
    };

    this.activeSessions.set(attemptId, session);
    return session;
  }

  /**
   * Get active session by ID
   */
  public getActiveSession(attemptId: string): ActiveMockSession | null {
    return this.activeSessions.get(attemptId) || null;
  }

  /**
   * Update student response, review status, or time spent on a question
   */
  public updateAnswer(
    attemptId: string,
    questionId: string,
    data: {
      selectedOptionId?: string;
      isMarkedForReview?: boolean;
      timeSpentDeltaSeconds?: number;
      visited?: boolean;
    }
  ): MockAnswer | null {
    const session = this.activeSessions.get(attemptId);
    if (!session || session.isCompleted) return null;

    const current = session.answers.get(questionId);
    if (!current) return null;

    if (data.selectedOptionId !== undefined) {
      current.selectedOptionId = data.selectedOptionId || undefined;
      current.answeredAt = new Date().toISOString();
    }

    if (data.isMarkedForReview !== undefined) {
      current.isMarkedForReview = data.isMarkedForReview;
    }

    if (data.timeSpentDeltaSeconds !== undefined && data.timeSpentDeltaSeconds > 0) {
      current.timeSpentSeconds += data.timeSpentDeltaSeconds;
    }

    if (data.visited !== undefined) {
      current.visited = data.visited;
    }

    return current;
  }

  // ==========================================================================
  // 3. SUBMISSION, SCORING & TELEMETRY INTEGRATION
  // ==========================================================================

  /**
   * Complete and evaluate mock exam
   * Connects results to Mastery Engine via sourceContext: 'mock_exam'
   */
  public async submitMockAttempt(
    attemptId: string,
    isAutoSubmitted = false
  ): Promise<MockAttempt> {
    const session = this.activeSessions.get(attemptId);
    if (!session) {
      // Check if already completed
      const existing = this.completedAttempts.get(attemptId);
      if (existing) return existing;
      throw new Error(`Active mock exam session not found for ID: ${attemptId}`);
    }

    session.isCompleted = true;
    const { mockExam, questions, answers, startedAt } = session;
    const completedAt = new Date().toISOString();

    const isEcat = mockExam.examType === 'ECAT';
    const totalQuestions = questions.length;
    let attemptedCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let markedForReviewCount = 0;
    let totalScore = 0;

    const subjectBreakdownMap = new Map<string, MockSubjectBreakdown>();
    const topicBreakdownMap = new Map<string, MockTopicBreakdown>();
    const mistakesList: MockMistakeItem[] = [];

    // Initialize subject breakdown containers
    const subjectNameMap = new Map(SEED_SUBJECTS.map((s) => [s.id, s.name]));
    const topicNameMap = new Map(SEED_TOPICS.map((t) => [t.id, t.name]));

    mockExam.subjectQuotas.forEach((sq) => {
      subjectBreakdownMap.set(sq.subjectId, {
        subjectId: sq.subjectId,
        subjectName: sq.subjectName,
        totalQuestions: 0,
        attemptedCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        unattemptedCount: 0,
        score: 0,
        maxScore: 0,
        accuracyPercentage: 0,
        timeSpentSeconds: 0,
        averageTimePerQuestionSeconds: 0,
      });
    });

    let totalTimeSpentSeconds = 0;
    let timeOnCorrectSeconds = 0;
    let timeOnIncorrectSeconds = 0;
    let timeOnUnattemptedSeconds = 0;

    // Process each question answer
    questions.forEach((q) => {
      const ans = answers.get(q.id) || {
        questionId: q.id,
        isMarkedForReview: false,
        timeSpentSeconds: 0,
        visited: false,
      };

      const hasAnswered = Boolean(ans.selectedOptionId);
      const isCorrect = hasAnswered && ans.selectedOptionId === q.correctOptionId;
      const isUnattempted = !hasAnswered;

      if (ans.isMarkedForReview) {
        markedForReviewCount += 1;
      }

      const qTime = ans.timeSpentSeconds || 15; // baseline minimum
      totalTimeSpentSeconds += qTime;

      // Subject stats
      let subj = subjectBreakdownMap.get(q.subjectId);
      if (!subj) {
        subj = {
          subjectId: q.subjectId,
          subjectName: subjectNameMap.get(q.subjectId) || 'Subject',
          totalQuestions: 0,
          attemptedCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          unattemptedCount: 0,
          score: 0,
          maxScore: 0,
          accuracyPercentage: 0,
          timeSpentSeconds: 0,
          averageTimePerQuestionSeconds: 0,
        };
        subjectBreakdownMap.set(q.subjectId, subj);
      }

      subj.totalQuestions += 1;
      subj.timeSpentSeconds += qTime;

      // Topic stats
      let topic = topicBreakdownMap.get(q.topicId);
      if (!topic) {
        topic = {
          topicId: q.topicId,
          topicName: topicNameMap.get(q.topicId) || q.topicName || 'Topic',
          subjectId: q.subjectId,
          subjectName: subj.subjectName,
          totalQuestions: 0,
          attemptedCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          accuracyPercentage: 0,
          masteryImpact: 'neutral',
        };
        topicBreakdownMap.set(q.topicId, topic);
      }
      topic.totalQuestions += 1;

      // Official scoring logic
      if (hasAnswered) {
        attemptedCount += 1;
        subj.attemptedCount += 1;
        topic.attemptedCount += 1;

        if (isCorrect) {
          correctCount += 1;
          subj.correctCount += 1;
          topic.correctCount += 1;
          timeOnCorrectSeconds += qTime;

          if (isEcat) {
            totalScore += 4;
            subj.score += 4;
          } else {
            totalScore += 1;
            subj.score += 1;
          }
        } else {
          incorrectCount += 1;
          subj.incorrectCount += 1;
          topic.incorrectCount += 1;
          timeOnIncorrectSeconds += qTime;

          if (isEcat) {
            totalScore -= 1; // negative marking penalty
            subj.score -= 1;
          }
        }
      } else {
        subj.unattemptedCount += 1;
        timeOnUnattemptedSeconds += qTime;
      }

      // Max score tracking
      if (isEcat) {
        subj.maxScore += 4;
      } else {
        subj.maxScore += 1;
      }

      // Add to mistakes / question review list
      mistakesList.push({
        questionId: q.id,
        question: q,
        selectedOptionId: ans.selectedOptionId,
        correctOptionId: q.correctOptionId,
        isCorrect,
        isUnattempted,
        isMarkedForReview: ans.isMarkedForReview,
        timeSpentSeconds: qTime,
        subjectId: q.subjectId,
        subjectName: subj.subjectName,
        topicId: q.topicId,
        topicName: topic.topicName,
        explanation: q.comprehensiveExplanation || q.explanation || 'See solution steps above.',
        tipOrShortcut: q.tipOrShortcut,
      });

      // ========================================================================
      // TELEMETRY & MASTERY INTEGRATION (Strictly tagged sourceContext: 'mock_exam')
      // Does not corrupt diagnostic attempts!
      // ========================================================================
      if (hasAnswered) {
        try {
          const resolvedStudentId = session.studentId || DEMO_STUDENT_ID;
          // 1. Record telemetry in question engine
          questionService.recordAttempt({
            studentId: resolvedStudentId,
            questionId: q.id,
            selectedOptionId: ans.selectedOptionId!,
            isCorrect,
            timeSpentSeconds: qTime,
            confidence: isCorrect ? 'high' : 'medium',
            sourceContext: 'mock_exam',
            contextId: attemptId,
          });

          // 2. Feed topic evidence to centralized Topic Mastery Engine
          masteryService.updateTopicMastery({
            studentId: resolvedStudentId,
            topicId: q.topicId,
            subjectId: q.subjectId,
            evidence: {
              questionId: q.id,
              isCorrect,
              difficulty: q.difficulty,
              timeSpentSeconds: qTime,
              confidence: isCorrect ? 'high' : 'medium',
              sourceContext: 'mock_exam',
              attemptedAt: completedAt,
            },
            sourceContext: 'mock_exam',
            note: `Performance from Mock Exam: ${mockExam.title}`,
          });
        } catch {
          // Graceful telemetry resilience
        }
      }
    });

    const unattemptedCount = totalQuestions - attemptedCount;
    const maxScore = isEcat ? totalQuestions * 4 : totalQuestions * 1;
    const percentage = maxScore > 0 ? Math.max(0, Math.round((totalScore / maxScore) * 100)) : 0;
    const isPassed = percentage >= mockExam.passingPercentage;

    // Projected rank percentile calculation
    // Normalized distribution based on historical entrance test distributions
    let projectedRankPercentile = 50;
    if (percentage >= 85) projectedRankPercentile = 98;
    else if (percentage >= 75) projectedRankPercentile = 93;
    else if (percentage >= 65) projectedRankPercentile = 84;
    else if (percentage >= 50) projectedRankPercentile = 70;
    else if (percentage >= 35) projectedRankPercentile = 52;
    else projectedRankPercentile = 30;

    // Finalize subject breakdown accuracy and average time
    const subjectBreakdown: Record<string, MockSubjectBreakdown> = {};
    subjectBreakdownMap.forEach((s, key) => {
      s.accuracyPercentage =
        s.attemptedCount > 0 ? Math.round((s.correctCount / s.attemptedCount) * 100) : 0;
      s.averageTimePerQuestionSeconds =
        s.totalQuestions > 0 ? Math.round(s.timeSpentSeconds / s.totalQuestions) : 0;
      subjectBreakdown[key] = s;
    });

    // Finalize topic breakdown
    const topicBreakdown: Record<string, MockTopicBreakdown> = {};
    topicBreakdownMap.forEach((t, key) => {
      t.accuracyPercentage =
        t.attemptedCount > 0 ? Math.round((t.correctCount / t.attemptedCount) * 100) : 0;
      t.masteryImpact =
        t.accuracyPercentage >= 70 ? 'improved' : t.accuracyPercentage < 40 ? 'declined' : 'neutral';
      topicBreakdown[key] = t;
    });

    // Time & Pacing analysis
    const allocatedTimeSeconds = mockExam.durationMinutes * 60;
    const timeRemainingSeconds = Math.max(0, allocatedTimeSeconds - totalTimeSpentSeconds);
    const avgTimePerQ =
      totalQuestions > 0 ? Math.round(totalTimeSpentSeconds / totalQuestions) : 60;
    const targetSecondsPerQ = Math.round(allocatedTimeSeconds / totalQuestions);

    let pacingEfficiency: 'rushed' | 'optimal' | 'slow' = 'optimal';
    let pacingNotes = 'Your pacing was well balanced and within optimal exam thresholds.';

    if (avgTimePerQ < targetSecondsPerQ * 0.55) {
      pacingEfficiency = 'rushed';
      pacingNotes = 'You finished significantly ahead of time. Review unattempted questions and double-check calculations.';
    } else if (avgTimePerQ > targetSecondsPerQ * 0.95 || isAutoSubmitted) {
      pacingEfficiency = 'slow';
      pacingNotes = 'You experienced time pressure. Practice high-speed elimination techniques for complex problems.';
    }

    const timeAnalysis: MockTimeAnalysis = {
      totalTimeSpentSeconds,
      allocatedTimeSeconds,
      timeRemainingSeconds,
      averageTimePerQuestionSeconds: avgTimePerQ,
      averageTimeCorrectSeconds:
        correctCount > 0 ? Math.round(timeOnCorrectSeconds / correctCount) : 0,
      averageTimeIncorrectSeconds:
        incorrectCount > 0 ? Math.round(timeOnIncorrectSeconds / incorrectCount) : 0,
      averageTimeUnattemptedSeconds:
        unattemptedCount > 0 ? Math.round(timeOnUnattemptedSeconds / unattemptedCount) : 0,
      pacingEfficiency,
      pacingNotes,
    };

    // Generate actionable AI recommendations based on performance
    const recommendations: MockRecommendation[] = this.generateRecommendations({
      examType: mockExam.examType,
      subjectBreakdown,
      topicBreakdown,
      pacingEfficiency,
      mistakes: mistakesList,
    });

    // Serialize answers object
    const answersRecord: Record<string, MockAnswer> = {};
    answers.forEach((val, key) => {
      answersRecord[key] = val;
    });

    const completedAttempt: MockAttempt = {
      id: attemptId,
      mockExamId: mockExam.id,
      studentId: DEMO_STUDENT_ID,
      examType: mockExam.examType,
      examTitle: mockExam.title,
      startedAt,
      completedAt,
      totalDurationSeconds: allocatedTimeSeconds,
      timeSpentSeconds: totalTimeSpentSeconds,
      isAutoSubmitted,
      totalQuestions,
      attemptedCount,
      unattemptedCount,
      correctCount,
      incorrectCount,
      markedForReviewCount,
      score: totalScore,
      maxScore,
      percentage,
      isPassed,
      projectedRankPercentile,
      subjectBreakdown,
      topicBreakdown,
      timeAnalysis,
      mistakes: mistakesList,
      recommendations,
      answers: answersRecord,
    };

    // Save in memory
    this.completedAttempts.set(attemptId, completedAttempt);

    // Save to Supabase if configured
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await (supabase as any).from('mock_attempts').insert({
          id: completedAttempt.id,
          mock_exam_id: completedAttempt.mockExamId,
          student_id: completedAttempt.studentId,
          exam_type: completedAttempt.examType,
          exam_title: completedAttempt.examTitle,
          started_at: completedAttempt.startedAt,
          completed_at: completedAttempt.completedAt,
          total_duration_seconds: completedAttempt.totalDurationSeconds,
          time_spent_seconds: completedAttempt.timeSpentSeconds,
          is_auto_submitted: completedAttempt.isAutoSubmitted,
          total_questions: completedAttempt.totalQuestions,
          attempted_count: completedAttempt.attemptedCount,
          unattempted_count: completedAttempt.unattemptedCount,
          correct_count: completedAttempt.correctCount,
          incorrect_count: completedAttempt.incorrectCount,
          marked_for_review_count: completedAttempt.markedForReviewCount,
          score: completedAttempt.score,
          max_score: completedAttempt.maxScore,
          percentage: completedAttempt.percentage,
          is_passed: completedAttempt.isPassed,
          projected_rank_percentile: completedAttempt.projectedRankPercentile,
          subject_breakdown: completedAttempt.subjectBreakdown,
          topic_breakdown: completedAttempt.topicBreakdown,
          time_analysis: completedAttempt.timeAnalysis,
          mistakes: completedAttempt.mistakes,
          recommendations: completedAttempt.recommendations,
          answers: completedAttempt.answers,
        });
      } catch {
        // Non-blocking
      }
    }

    return completedAttempt;
  }

  /**
   * Synthesize personalized AI recommendations from mock exam performance
   */
  private generateRecommendations(params: {
    examType: ExamType;
    subjectBreakdown: Record<string, MockSubjectBreakdown>;
    topicBreakdown: Record<string, MockTopicBreakdown>;
    pacingEfficiency: 'rushed' | 'optimal' | 'slow';
    mistakes: MockMistakeItem[];
  }): MockRecommendation[] {
    const recommendations: MockRecommendation[] = [];

    // 1. Find weakest subject (< 60% accuracy)
    const subjects = Object.values(params.subjectBreakdown).sort(
      (a, b) => a.accuracyPercentage - b.accuracyPercentage
    );
    if (subjects.length > 0 && subjects[0].accuracyPercentage < 65) {
      const weakest = subjects[0];
      recommendations.push({
        id: `rec-weak-subj-${weakest.subjectId}`,
        title: `Targeted Subject Recovery: ${weakest.subjectName}`,
        description: `Your accuracy in ${weakest.subjectName} was ${weakest.accuracyPercentage}%. Dedicate focused 30-minute practice drills to consolidate core formulas and high-yield concepts.`,
        severity: weakest.accuracyPercentage < 40 ? 'critical' : 'high',
        subjectId: weakest.subjectId,
        subjectName: weakest.subjectName,
        actionType: 'practice_drill',
        actionLabel: `Launch ${weakest.subjectName} Practice Drill`,
      });
    }

    // 2. Find weakest topics with mistakes
    const topics = Object.values(params.topicBreakdown)
      .filter((t) => t.incorrectCount > 0 || t.accuracyPercentage < 60)
      .sort((a, b) => a.accuracyPercentage - b.accuracyPercentage);

    topics.slice(0, 2).forEach((t, i) => {
      recommendations.push({
        id: `rec-weak-topic-${t.topicId}-${i}`,
        title: `Mastery Deficit: ${t.topicName}`,
        description: `You missed ${t.incorrectCount} out of ${t.totalQuestions} questions in this topic. Review the theory and worked shortcuts in the interactive Learning Unit.`,
        severity: t.accuracyPercentage < 40 ? 'critical' : 'medium',
        subjectId: t.subjectId,
        subjectName: t.subjectName,
        topicId: t.topicId,
        topicName: t.topicName,
        actionType: 'learning_unit',
        actionLabel: `Open ${t.topicName} Unit`,
      });
    });

    // 3. Pacing recommendation if applicable
    if (params.pacingEfficiency === 'slow') {
      recommendations.push({
        id: 'rec-pacing-speed',
        title: 'Exam Time Pressure Calibration',
        description: `Average time per question was elevated. Use option-elimination tactics on multi-step calculation questions to preserve at least 10 minutes for final review.`,
        severity: 'medium',
        subjectId: subjects[0]?.subjectId || 'subj-physics',
        subjectName: 'Exam Strategy',
        actionType: 'review_formula',
        actionLabel: 'Review Speed & Elimination Shortcuts',
      });
    }

    return recommendations;
  }

  // ==========================================================================
  // 4. RETRIEVAL & HISTORICAL ATTEMPTS
  // ==========================================================================

  public getMockAttempts(studentId?: string, examType?: ExamType): MockAttempt[] {
    const all = Array.from(this.completedAttempts.values());
    return all
      .filter((a) => (!examType || a.examType === examType))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  public getMockAttemptById(attemptId: string): MockAttempt | null {
    return this.completedAttempts.get(attemptId) || null;
  }

  // ==========================================================================
  // 5. DEMO SEED DATA INITIALIZATION
  // ==========================================================================

  private seedDemoMockAttempts(): void {
    // Seed realistic pre-completed mock attempts for both ECAT and MDCAT
    const ecatQuestions = SEED_QUESTIONS.filter(
      (q) => q.applicableExams.includes('ECAT') && q.status === 'approved'
    ).slice(0, 20);

    const mdcatQuestions = SEED_QUESTIONS.filter(
      (q) => q.applicableExams.includes('MDCAT') && q.status === 'approved'
    ).slice(0, 20);

    // 1. ECAT Demo Attempt (Score 62/80, 78% accuracy, Passed)
    if (ecatQuestions.length >= 10) {
      const ecatAttemptId = 'mock-attempt-demo-ecat-01';
      const totalQ = Math.min(15, ecatQuestions.length);
      const subQuestions = ecatQuestions.slice(0, totalQ);

      const subjectNameMap = new Map(SEED_SUBJECTS.map((s) => [s.id, s.name]));
      const topicNameMap = new Map(SEED_TOPICS.map((t) => [t.id, t.name]));

      const subjBreakdown: Record<string, MockSubjectBreakdown> = {};
      const topicBreakdown: Record<string, MockTopicBreakdown> = {};
      const mistakes: MockMistakeItem[] = [];
      const answers: Record<string, MockAnswer> = {};

      let totalScore = 0;
      let correctCount = 0;
      let incorrectCount = 0;

      subQuestions.forEach((q, idx) => {
        // 75% correct
        const isCorrect = idx % 4 !== 0;
        const selectedOptionId = isCorrect
          ? q.correctOptionId
          : q.options.find((o) => o.id !== q.correctOptionId)?.id || 'opt-b';

        const timeSpent = 45 + (idx % 3) * 15;
        if (isCorrect) {
          correctCount += 1;
          totalScore += 4;
        } else {
          incorrectCount += 1;
          totalScore -= 1;
        }

        answers[q.id] = {
          questionId: q.id,
          selectedOptionId,
          isMarkedForReview: idx === 3 || idx === 7,
          timeSpentSeconds: timeSpent,
          visited: true,
          answeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        };

        // Subject Breakdown
        if (!subjBreakdown[q.subjectId]) {
          subjBreakdown[q.subjectId] = {
            subjectId: q.subjectId,
            subjectName: subjectNameMap.get(q.subjectId) || 'Subject',
            totalQuestions: 0,
            attemptedCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            unattemptedCount: 0,
            score: 0,
            maxScore: 0,
            accuracyPercentage: 0,
            timeSpentSeconds: 0,
            averageTimePerQuestionSeconds: 0,
          };
        }
        const sb = subjBreakdown[q.subjectId];
        sb.totalQuestions += 1;
        sb.attemptedCount += 1;
        sb.maxScore += 4;
        sb.timeSpentSeconds += timeSpent;
        if (isCorrect) {
          sb.correctCount += 1;
          sb.score += 4;
        } else {
          sb.incorrectCount += 1;
          sb.score -= 1;
        }

        // Topic Breakdown
        if (!topicBreakdown[q.topicId]) {
          topicBreakdown[q.topicId] = {
            topicId: q.topicId,
            topicName: topicNameMap.get(q.topicId) || 'Topic',
            subjectId: q.subjectId,
            subjectName: sb.subjectName,
            totalQuestions: 0,
            attemptedCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            accuracyPercentage: 0,
            masteryImpact: 'neutral',
          };
        }
        const tb = topicBreakdown[q.topicId];
        tb.totalQuestions += 1;
        tb.attemptedCount += 1;
        if (isCorrect) tb.correctCount += 1;
        else tb.incorrectCount += 1;

        mistakes.push({
          questionId: q.id,
          question: q,
          selectedOptionId,
          correctOptionId: q.correctOptionId,
          isCorrect,
          isUnattempted: false,
          isMarkedForReview: idx === 3 || idx === 7,
          timeSpentSeconds: timeSpent,
          subjectId: q.subjectId,
          subjectName: sb.subjectName,
          topicId: q.topicId,
          topicName: tb.topicName,
          explanation: q.comprehensiveExplanation || q.explanation || 'Detailed solution explanation.',
          tipOrShortcut: q.tipOrShortcut,
        });
      });

      Object.values(subjBreakdown).forEach((s) => {
        s.accuracyPercentage = Math.round((s.correctCount / s.attemptedCount) * 100);
        s.averageTimePerQuestionSeconds = Math.round(s.timeSpentSeconds / s.totalQuestions);
      });

      Object.values(topicBreakdown).forEach((t) => {
        t.accuracyPercentage = Math.round((t.correctCount / t.attemptedCount) * 100);
        t.masteryImpact = t.accuracyPercentage >= 70 ? 'improved' : 'declined';
      });

      const maxScore = totalQ * 4;
      const pct = Math.round((totalScore / maxScore) * 100);

      this.completedAttempts.set(ecatAttemptId, {
        id: ecatAttemptId,
        mockExamId: 'mock-ecat-standard-01',
        studentId: DEMO_STUDENT_ID,
        examType: 'ECAT',
        examTitle: `ECAT High-Yield Mini Mock Exam (${totalQ} MCQs)`,
        startedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 23.5).toISOString(),
        totalDurationSeconds: 15 * 60,
        timeSpentSeconds: 12 * 60 + 35,
        isAutoSubmitted: false,
        totalQuestions: totalQ,
        attemptedCount: totalQ,
        unattemptedCount: 0,
        correctCount,
        incorrectCount,
        markedForReviewCount: 2,
        score: totalScore,
        maxScore,
        percentage: pct,
        isPassed: pct >= 33,
        projectedRankPercentile: 88,
        subjectBreakdown: subjBreakdown,
        topicBreakdown,
        timeAnalysis: {
          totalTimeSpentSeconds: 12 * 60 + 35,
          allocatedTimeSeconds: 15 * 60,
          timeRemainingSeconds: 2 * 60 + 25,
          averageTimePerQuestionSeconds: 50,
          averageTimeCorrectSeconds: 46,
          averageTimeIncorrectSeconds: 62,
          averageTimeUnattemptedSeconds: 0,
          pacingEfficiency: 'optimal',
          pacingNotes: 'Steady pace maintained throughout all engineering sections.',
        },
        mistakes,
        recommendations: [
          {
            id: 'demo-rec-1',
            title: 'Centripetal Dynamics Velocity Bounds',
            description: 'Strengthen maximum speed formulas for banked roads without friction in Physics.',
            severity: 'high',
            subjectId: 'subj-physics',
            subjectName: 'Physics',
            topicId: 'topic-phy-centripetal-force',
            topicName: 'Centripetal Force & Banking of Roads',
            actionType: 'learning_unit',
            actionLabel: 'Study Banking of Roads Unit',
          },
          {
            id: 'demo-rec-2',
            title: 'High-Yield Math Practice',
            description: 'Practice Vieta formulas for symmetric roots of cubic and quadratic equations.',
            severity: 'medium',
            subjectId: 'subj-mathematics',
            subjectName: 'Mathematics',
            topicId: 'topic-math-quadratic-equations',
            topicName: 'Algebra: Quadratic Equations',
            actionType: 'practice_drill',
            actionLabel: 'Launch Quadratic Equations Drill',
          },
        ],
        answers,
      });
    }

    // 2. MDCAT Demo Attempt (Score 12/15, 80% accuracy, Passed)
    if (mdcatQuestions.length >= 10) {
      const mdcatAttemptId = 'mock-attempt-demo-mdcat-01';
      const totalQ = Math.min(15, mdcatQuestions.length);
      const subQuestions = mdcatQuestions.slice(0, totalQ);

      const subjectNameMap = new Map(SEED_SUBJECTS.map((s) => [s.id, s.name]));
      const topicNameMap = new Map(SEED_TOPICS.map((t) => [t.id, t.name]));

      const subjBreakdown: Record<string, MockSubjectBreakdown> = {};
      const topicBreakdown: Record<string, MockTopicBreakdown> = {};
      const mistakes: MockMistakeItem[] = [];
      const answers: Record<string, MockAnswer> = {};

      let totalScore = 0;
      let correctCount = 0;
      let incorrectCount = 0;

      subQuestions.forEach((q, idx) => {
        const isCorrect = idx % 5 !== 0;
        const selectedOptionId = isCorrect
          ? q.correctOptionId
          : q.options.find((o) => o.id !== q.correctOptionId)?.id || 'opt-b';

        const timeSpent = 40 + (idx % 3) * 12;
        if (isCorrect) {
          correctCount += 1;
          totalScore += 1;
        } else {
          incorrectCount += 1;
        }

        answers[q.id] = {
          questionId: q.id,
          selectedOptionId,
          isMarkedForReview: idx === 2,
          timeSpentSeconds: timeSpent,
          visited: true,
          answeredAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        };

        if (!subjBreakdown[q.subjectId]) {
          subjBreakdown[q.subjectId] = {
            subjectId: q.subjectId,
            subjectName: subjectNameMap.get(q.subjectId) || 'Subject',
            totalQuestions: 0,
            attemptedCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            unattemptedCount: 0,
            score: 0,
            maxScore: 0,
            accuracyPercentage: 0,
            timeSpentSeconds: 0,
            averageTimePerQuestionSeconds: 0,
          };
        }
        const sb = subjBreakdown[q.subjectId];
        sb.totalQuestions += 1;
        sb.attemptedCount += 1;
        sb.maxScore += 1;
        sb.timeSpentSeconds += timeSpent;
        if (isCorrect) {
          sb.correctCount += 1;
          sb.score += 1;
        } else {
          sb.incorrectCount += 1;
        }

        if (!topicBreakdown[q.topicId]) {
          topicBreakdown[q.topicId] = {
            topicId: q.topicId,
            topicName: topicNameMap.get(q.topicId) || 'Topic',
            subjectId: q.subjectId,
            subjectName: sb.subjectName,
            totalQuestions: 0,
            attemptedCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            accuracyPercentage: 0,
            masteryImpact: 'neutral',
          };
        }
        const tb = topicBreakdown[q.topicId];
        tb.totalQuestions += 1;
        tb.attemptedCount += 1;
        if (isCorrect) tb.correctCount += 1;
        else tb.incorrectCount += 1;

        mistakes.push({
          questionId: q.id,
          question: q,
          selectedOptionId,
          correctOptionId: q.correctOptionId,
          isCorrect,
          isUnattempted: false,
          isMarkedForReview: idx === 2,
          timeSpentSeconds: timeSpent,
          subjectId: q.subjectId,
          subjectName: sb.subjectName,
          topicId: q.topicId,
          topicName: tb.topicName,
          explanation: q.comprehensiveExplanation || q.explanation || 'Detailed solution explanation.',
          tipOrShortcut: q.tipOrShortcut,
        });
      });

      Object.values(subjBreakdown).forEach((s) => {
        s.accuracyPercentage = Math.round((s.correctCount / s.attemptedCount) * 100);
        s.averageTimePerQuestionSeconds = Math.round(s.timeSpentSeconds / s.totalQuestions);
      });

      Object.values(topicBreakdown).forEach((t) => {
        t.accuracyPercentage = Math.round((t.correctCount / t.attemptedCount) * 100);
        t.masteryImpact = t.accuracyPercentage >= 70 ? 'improved' : 'declined';
      });

      const maxScore = totalQ;
      const pct = Math.round((totalScore / maxScore) * 100);

      this.completedAttempts.set(mdcatAttemptId, {
        id: mdcatAttemptId,
        mockExamId: 'mock-mdcat-standard-01',
        studentId: DEMO_STUDENT_ID,
        examType: 'MDCAT',
        examTitle: `MDCAT High-Yield Mini Mock Exam (${totalQ} MCQs)`,
        startedAt: new Date(Date.now() - 3600000 * 52).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 51.5).toISOString(),
        totalDurationSeconds: 15 * 60,
        timeSpentSeconds: 11 * 60 + 20,
        isAutoSubmitted: false,
        totalQuestions: totalQ,
        attemptedCount: totalQ,
        unattemptedCount: 0,
        correctCount,
        incorrectCount,
        markedForReviewCount: 1,
        score: totalScore,
        maxScore,
        percentage: pct,
        isPassed: pct >= 55,
        projectedRankPercentile: 91,
        subjectBreakdown: subjBreakdown,
        topicBreakdown,
        timeAnalysis: {
          totalTimeSpentSeconds: 11 * 60 + 20,
          allocatedTimeSeconds: 15 * 60,
          timeRemainingSeconds: 3 * 60 + 40,
          averageTimePerQuestionSeconds: 45,
          averageTimeCorrectSeconds: 42,
          averageTimeIncorrectSeconds: 58,
          averageTimeUnattemptedSeconds: 0,
          pacingEfficiency: 'optimal',
          pacingNotes: 'Excellent pacing across Biology and Chemistry sections.',
        },
        mistakes,
        recommendations: [
          {
            id: 'demo-rec-mdcat-1',
            title: 'Cell Organelle Ultrastructure',
            description: 'Review endomembrane trafficking and rough vs smooth ER synthesis pathways.',
            severity: 'medium',
            subjectId: 'subj-biology',
            subjectName: 'Biology',
            topicId: 'topic-bio-cell-structure',
            topicName: 'Cell Structure & Bioenergetics',
            actionType: 'learning_unit',
            actionLabel: 'Review Cell Structure Unit',
          },
        ],
        answers,
      });
    }
  }
}

export const mockExamService = new MockExamService();

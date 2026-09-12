import type {
  ExamType,
  DifficultyLevel,
  Question,
  TopicMastery,
  TopicMasteryStatus,
} from '@/types';
import type {
  AdaptiveEngineConfig,
  AdaptiveQuestionRecommendation,
  MasteryComparisonResult,
  ActiveAdaptiveSession,
  PedagogicalStage,
} from '@/types/adaptive';
import { questionService } from './question.service';
import { masteryService } from '../mastery/mastery.service';
import { personalizationService } from '../study-plan/personalization.service';
import { SEED_TOPICS, SEED_SUBJECTS } from '@/database/seed-data';

export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveEngineConfig = {
  lowMasteryThreshold: 40,
  highMasteryThreshold: 70,
  consecutiveCorrectForPromotion: 2,
  consecutiveWrongForDemotion: 1,
  minQuestionsBeforeRetest: 3,
  retestQuestionCount: 3,
  allowRepeatsAfterDays: 3,
};

export class AdaptiveQuestionService {
  private config: AdaptiveEngineConfig;
  private activeSessions: Map<string, ActiveAdaptiveSession> = new Map();

  constructor(config: Partial<AdaptiveEngineConfig> = {}) {
    this.config = { ...DEFAULT_ADAPTIVE_CONFIG, ...config };
  }

  /**
   * Update configuration parameters dynamically
   */
  public updateConfig(newConfig: Partial<AdaptiveEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): AdaptiveEngineConfig {
    return { ...this.config };
  }

  /**
   * Determines target difficulty based on student's mastery and current session momentum
   */
  public determineTargetDifficulty(params: {
    masteryScore: number;
    currentStreak: number;
    recentAttemptCorrect?: boolean;
    isRetest?: boolean;
  }): { difficulty: DifficultyLevel; stage: PedagogicalStage; reason: string } {
    const { masteryScore, currentStreak, recentAttemptCorrect, isRetest } = params;

    // Retest mode uses medium-to-hard / exam-level questions to rigorously verify mastery
    if (isRetest) {
      if (masteryScore >= this.config.highMasteryThreshold) {
        return {
          difficulty: 'exam_level',
          stage: 'mastery_verification',
          reason: 'Exam-level benchmark to verify high-tier mastery and speed.',
        };
      }
      return {
        difficulty: 'hard',
        stage: 'mastery_verification',
        reason: 'Rigorous assessment to verify conceptual retention and problem-solving agility.',
      };
    }

    // MASTERY < 40: Foundation stage (Start easier -> establish concept -> gradually increase)
    if (masteryScore < this.config.lowMasteryThreshold) {
      if (currentStreak >= this.config.consecutiveCorrectForPromotion) {
        return {
          difficulty: 'medium',
          stage: 'reinforcement',
          reason: `Consecutive correct streak (${currentStreak}) demonstrated! Stepping up to Medium to build confidence.`,
        };
      }
      return {
        difficulty: 'easy',
        stage: 'foundation',
        reason: `Baseline mastery is ${masteryScore}% (<${this.config.lowMasteryThreshold}%). Starting with foundational Easy questions to solidify core definitions.`,
      };
    }

    // MASTERY 40-70: Reinforcement & Weakness Targeting
    if (masteryScore >= this.config.lowMasteryThreshold && masteryScore < this.config.highMasteryThreshold) {
      if (recentAttemptCorrect === false) {
        return {
          difficulty: 'easy',
          stage: 'mistake_remediation',
          reason: 'Addressing recent mistake with a foundational scaffolding question.',
        };
      }
      if (currentStreak >= this.config.consecutiveCorrectForPromotion) {
        return {
          difficulty: 'hard',
          stage: 'reinforcement',
          reason: `Strong streak (${currentStreak} in a row)! Promoting to Hard question to advance toward mastery.`,
        };
      }
      return {
        difficulty: 'medium',
        stage: 'reinforcement',
        reason: `Developing mastery (${masteryScore}%). Calibrated to Medium difficulty to target key analytical skills.`,
      };
    }

    // MASTERY > 70: Mastery Verification & Exam-Level Polish
    if (currentStreak < 0) {
      return {
        difficulty: 'medium',
        stage: 'reinforcement',
        reason: 'Stabilizing momentum after an incorrect attempt with a balanced Medium question.',
      };
    }
    if (currentStreak >= 2 || masteryScore >= 85) {
      return {
        difficulty: 'exam_level',
        stage: 'mastery_verification',
        reason: `High mastery score (${masteryScore}%). Presenting official Exam-Level challenge to test speed and precision.`,
      };
    }
    return {
      difficulty: 'hard',
      stage: 'mastery_verification',
      reason: `Solid mastery (${masteryScore}%). Challenging with a multi-step Hard question to verify deep understanding.`,
    };
  }

  /**
   * Selects the optimal next adaptive question for a student
   */
  public async getNextAdaptiveQuestion(params: {
    studentId: string;
    topicId: string;
    examType: ExamType;
    currentSessionQuestionIds?: string[];
    currentStreak?: number;
    recentAttemptCorrect?: boolean;
    isRetest?: boolean;
  }): Promise<AdaptiveQuestionRecommendation | null> {
    const {
      studentId,
      topicId,
      examType,
      currentSessionQuestionIds = [],
      currentStreak = 0,
      recentAttemptCorrect,
      isRetest = false,
    } = params;

    // 1. Get student topic mastery
    const masteryRecord = masteryService.getTopicMasteryRecordSync(studentId, topicId);
    const masteryScore = masteryRecord?.masteryScore || 0;

    // 2. Calibrate target difficulty and pedagogical stage
    const calibration = this.determineTargetDifficulty({
      masteryScore,
      currentStreak,
      recentAttemptCorrect,
      isRetest,
    });

    // 3. Retrieve all approved questions for topic & exam
    const allQuestions = await questionService.getQuestionsByTopic(topicId, {
      status: 'approved',
      limit: 100,
    });

    const examFiltered = allQuestions.filter(
      (q) => !q.applicableExams || q.applicableExams.includes(examType)
    );

    if (examFiltered.length === 0) {
      return null;
    }

    // 4. Retrieve student's attempt history to check previous attempts & recent mistakes
    const attempts = questionService.getStudentAttemptsSync(studentId);
    const recentAttemptsForTopic = attempts.filter((a) => {
      const q = examFiltered.find((qItem) => qItem.id === a.questionId);
      return !!q;
    });

    // Question IDs to exclude from this active session
    const excludedIds = new Set(currentSessionQuestionIds);

    // Calculate days since past attempts to avoid repetitive display
    const repeatThresholdMs = this.config.allowRepeatsAfterDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const recentlyAttemptedIds = new Set(
      recentAttemptsForTopic
        .filter((a) => {
          const attemptTime = new Date(a.attemptedAt).getTime();
          return now - attemptTime < repeatThresholdMs;
        })
        .map((a) => a.questionId)
    );

    // Filter candidate pool
    let candidates = examFiltered.filter((q) => !excludedIds.has(q.id));

    // Prefer unseen questions first
    const unseenCandidates = candidates.filter((q) => !recentlyAttemptedIds.has(q.id));
    if (unseenCandidates.length > 0) {
      candidates = unseenCandidates;
    }

    if (candidates.length === 0) {
      // If all questions exhausted, allow repeating oldest attempted question outside current session
      candidates = examFiltered.filter((q) => !excludedIds.has(q.id));
      if (candidates.length === 0) {
        // Absolute fallback: pick any question for the topic
        candidates = examFiltered;
      }
    }

    // 5. Score candidates by difficulty match, skill targeting, and past mistakes
    const difficultyOrder: DifficultyLevel[] = ['easy', 'medium', 'hard', 'exam_level'];
    const targetDiffIdx = difficultyOrder.indexOf(calibration.difficulty);

    const scoredCandidates = candidates.map((q) => {
      let score = 100;
      const qDiffIdx = difficultyOrder.indexOf(q.difficulty);
      const diffDistance = Math.abs(qDiffIdx - targetDiffIdx);

      // Penalize distance from calibrated difficulty
      score -= diffDistance * 30;

      // Bonus if targeting a skill where the student made mistakes
      const pastMistakesOnSkill = recentAttemptsForTopic.filter(
        (a) => !a.isCorrect && q.skillId && a.questionId === q.id
      ).length;
      if (pastMistakesOnSkill > 0) {
        score += 25;
      }

      // Small jitter for freshness
      score += Math.random() * 5;

      return { question: q, score };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);
    const selected = scoredCandidates[0].question;

    return {
      question: selected,
      targetDifficulty: calibration.difficulty,
      reason: calibration.reason,
      pedagogicalStage: calibration.stage,
      currentMasteryScore: masteryScore,
      streakCount: currentStreak,
      isRetestQuestion: isRetest,
    };
  }

  /**
   * Starts a tracked adaptive practice session
   */
  public async startSession(params: {
    studentId: string;
    topicId: string;
    examType: ExamType;
    sessionType?: 'adaptive_practice' | 'mastery_retest';
  }): Promise<{ session: ActiveAdaptiveSession; firstQuestion: AdaptiveQuestionRecommendation | null }> {
    const {
      studentId,
      topicId,
      examType,
      sessionType = 'adaptive_practice',
    } = params;

    const topic = SEED_TOPICS.find((t) => t.id === topicId);
    const subject = SEED_SUBJECTS.find((s) => s.id === topic?.subjectId);

    const initialMastery = masteryService.getTopicMasteryRecordSync(studentId, topicId);
    const baselineScore = initialMastery?.masteryScore || 0;
    const baselineStatus = initialMastery?.status || 'unassessed';

    const sessionId = `adapt-sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const session: ActiveAdaptiveSession = {
      sessionId,
      studentId,
      topicId,
      topicName: topic?.name || 'Topic Practice',
      subjectId: topic?.subjectId || 'subj-physics',
      subjectName: subject?.name || 'Physics',
      examType,
      sessionType,
      baselineMasteryScore: baselineScore,
      baselineStatus,
      questionIdsAttempted: [],
      correctCount: 0,
      currentStreak: 0,
      startedAt: new Date().toISOString(),
    };

    this.activeSessions.set(sessionId, session);

    const firstQuestion = await this.getNextAdaptiveQuestion({
      studentId,
      topicId,
      examType,
      currentSessionQuestionIds: [],
      currentStreak: 0,
      isRetest: sessionType === 'mastery_retest',
    });

    return { session, firstQuestion };
  }

  /**
   * Records an answer within an active adaptive session and retrieves the next adaptive recommendation
   */
  public async recordSessionAnswer(params: {
    sessionId: string;
    questionId: string;
    selectedOptionId: string;
    timeSpentSeconds: number;
    confidence?: 'low' | 'medium' | 'high';
  }): Promise<{
    isCorrect: boolean;
    explanation: string;
    tipOrShortcut?: string;
    updatedMastery: TopicMastery;
    nextQuestion: AdaptiveQuestionRecommendation | null;
    isSessionComplete: boolean;
    comparisonResult?: MasteryComparisonResult;
  }> {
    const { sessionId, questionId, selectedOptionId, timeSpentSeconds, confidence } = params;
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new Error(`Active adaptive session not found: ${sessionId}`);
    }

    // Submit answer through central Question Engine (which updates Mastery Engine)
    const result = await questionService.submitAnswer({
      questionId,
      selectedOptionId,
      studentId: session.studentId,
      timeSpentSeconds,
      confidence,
      sourceContext: 'practice',
    });

    // Update active session metrics
    session.questionIdsAttempted.push(questionId);
    if (result.isCorrect) {
      session.correctCount += 1;
      session.currentStreak = session.currentStreak >= 0 ? session.currentStreak + 1 : 1;
    } else {
      session.currentStreak = session.currentStreak <= 0 ? session.currentStreak - 1 : -1;
    }

    const updatedMastery = masteryService.getTopicMasteryRecordSync(session.studentId, session.topicId)!;

    // Check if session has met completion criteria
    const maxQuestions =
      session.sessionType === 'mastery_retest'
        ? this.config.retestQuestionCount
        : this.config.minQuestionsBeforeRetest + 2;

    const isSessionComplete = session.questionIdsAttempted.length >= maxQuestions;

    let nextQuestion: AdaptiveQuestionRecommendation | null = null;
    let comparisonResult: MasteryComparisonResult | undefined = undefined;

    if (isSessionComplete) {
      comparisonResult = this.calculateComparisonResult(session, updatedMastery);
      session.completedAt = new Date().toISOString();
      session.comparisonResult = comparisonResult;

      // Auto-update student study plan when significant performance milestone reached
      this.syncStudyPlanAfterAdaptivePractice(session.studentId, session.topicId, comparisonResult);
    } else {
      nextQuestion = await this.getNextAdaptiveQuestion({
        studentId: session.studentId,
        topicId: session.topicId,
        examType: session.examType,
        currentSessionQuestionIds: session.questionIdsAttempted,
        currentStreak: session.currentStreak,
        recentAttemptCorrect: result.isCorrect,
        isRetest: session.sessionType === 'mastery_retest',
      });
    }

    return {
      isCorrect: result.isCorrect,
      explanation: result.explanation,
      tipOrShortcut: result.tipOrShortcut,
      updatedMastery,
      nextQuestion,
      isSessionComplete,
      comparisonResult,
    };
  }

  /**
   * Finalize and retrieve before vs after mastery comparison for a session
   */
  public completeSession(sessionId: string): MasteryComparisonResult {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const currentMastery = masteryService.getTopicMasteryRecordSync(session.studentId, session.topicId)!;
    const comparison = this.calculateComparisonResult(session, currentMastery);
    session.completedAt = new Date().toISOString();
    session.comparisonResult = comparison;

    this.syncStudyPlanAfterAdaptivePractice(session.studentId, session.topicId, comparison);
    return comparison;
  }

  /**
   * Generate Before vs After mastery comparison matrix with pedagogical feedback
   */
  public calculateComparisonResult(
    session: ActiveAdaptiveSession,
    afterMastery: TopicMastery
  ): MasteryComparisonResult {
    const beforeScore = session.baselineMasteryScore;
    const afterScore = afterMastery.masteryScore;
    const delta = afterScore - beforeScore;
    const total = session.questionIdsAttempted.length;
    const accuracy = total > 0 ? Math.round((session.correctCount / total) * 100) : 0;

    const isMasteryVerified = afterScore >= this.config.highMasteryThreshold;

    let summaryFeedback = '';
    let recommendedNextStep: MasteryComparisonResult['recommendedNextStep'] = 'proceed_to_next_topic';
    let nextActionUrl = `/student/practice?topicId=${session.topicId}`;

    const strengths: string[] = [];
    const growthAreas: string[] = [];

    if (isMasteryVerified) {
      summaryFeedback = `Outstanding progress! Your mastery in ${session.topicName} rose from ${beforeScore}% to ${afterScore}% (+${delta}%). You demonstrated strong conceptual accuracy under exam-calibrated conditions.`;
      recommendedNextStep = 'proceed_to_next_topic';
      nextActionUrl = '/student';
      strengths.push('High-velocity problem solving under entrance exam conditions');
      strengths.push('Reliable multi-step vector and quantitative derivation');
    } else if (delta > 0) {
      summaryFeedback = `Measurable improvement! Your mastery in ${session.topicName} grew from ${beforeScore}% to ${afterScore}% (+${delta}%). While foundational concepts are solidifying, continued practice is recommended before declaring full exam mastery.`;
      recommendedNextStep = 'repeat_practice';
      nextActionUrl = `/student/practice?topicId=${session.topicId}`;
      strengths.push('Positive score momentum and improved core concept retention');
      growthAreas.push('Speed and consistency on harder exam-level variations');
    } else {
      summaryFeedback = `Mastery remains at ${afterScore}% (Baseline: ${beforeScore}%). We recommend reviewing the dedicated Learning Unit and consulting your AI Tutor to clarify core principles rather than guessing.`;
      recommendedNextStep = 'review_learning_unit';
      nextActionUrl = `/student/learning-unit/${session.topicId}`;
      growthAreas.push('Core definition and formula sign conventions');
      growthAreas.push('Need for Socratic review on tricky distractor patterns');
    }

    return {
      topicId: session.topicId,
      topicName: session.topicName,
      subjectName: session.subjectName,
      examType: session.examType,
      beforeMasteryScore: beforeScore,
      afterMasteryScore: afterScore,
      delta,
      totalAttemptsInSession: total,
      correctCountInSession: session.correctCount,
      sessionAccuracy: accuracy,
      isMasteryVerified,
      statusBefore: session.baselineStatus || 'unassessed',
      statusAfter: afterMastery.status || 'unassessed',
      summaryFeedback,
      strengths,
      growthAreas,
      recommendedNextStep,
      nextActionUrl,
    };
  }

  /**
   * Syncs student study plan when adaptive practice reveals progress or weakness
   */
  private async syncStudyPlanAfterAdaptivePractice(
    studentId: string,
    topicId: string,
    comparison: MasteryComparisonResult
  ): Promise<void> {
    try {
      const activePlanResult = await personalizationService.getActiveStudyPlan(studentId);
      if (!activePlanResult) return;

      const matchingItem = activePlanResult.items.find((item) => item.topicId === topicId);
      if (matchingItem && comparison.isMasteryVerified) {
        await personalizationService.updatePlanItemStatus(matchingItem.id, 'completed');
      }
    } catch {
      // Non-blocking sync
    }
  }
}

export const adaptiveQuestionService = new AdaptiveQuestionService();

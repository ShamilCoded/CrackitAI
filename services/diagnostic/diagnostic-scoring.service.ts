/**
 * Configurable Diagnostic Scoring Service
 *
 * Implements rigorous mathematical evaluation of diagnostic attempts:
 * 1. Overall accuracy, scaled score, and marking scheme application (ECAT negative marking vs MDCAT standard)
 * 2. Multi-tiered topic classification: 'strong', 'developing', 'weak', 'unknown'
 * 3. Granular subject, topic, difficulty, time pacing, and confidence calibration telemetry
 * 4. Deterministic next-step recommendation leading into the topic's Learning Unit
 *
 * THRESHOLD SPECIFICATION (DOCUMENTED & CONFIGURABLE):
 * - Strong:      accuracy >= strongThreshold (default: 75%). High conceptual mastery and exam readiness.
 * - Developing:  developingThreshold <= accuracy < strongThreshold (default: 50% to 74.9%). Partial competence; needs targeted reinforcement.
 * - Weak:        accuracy < developingThreshold (default: < 50%). Significant concept gaps; high priority for remediation.
 * - Unknown:     attempted < minAttemptsForClassification (default: 1 attempt). Insufficient evidence to classify.
 */

import type {
  ExamType,
  Question,
  DifficultyLevel,
  ConfidenceLevel,
} from '@/types/domain';
import type {
  DiagnosticScoringConfig,
  DiagnosticAnswer,
  TopicClassification,
  TopicPerformance,
  SubjectPerformance,
  DifficultyPerformance,
  TimePerformance,
  ConfidencePerformance,
  RecommendedNextStep,
  DiagnosticAttempt,
} from '@/types/diagnostic';
import { DEFAULT_DIAGNOSTIC_SCORING_CONFIG } from '@/types/diagnostic';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { examConfigService } from '@/services/exam/exam-config.service';

export interface EvaluateDiagnosticInput {
  attemptId: string;
  diagnosticTestId: string;
  studentId: string;
  studentName?: string;
  examType: ExamType;
  startedAt: string;
  completedAt?: string;
  questions: Question[];
  answers: DiagnosticAnswer[];
  scoringConfigOverrides?: Partial<DiagnosticScoringConfig>;
}

export class DiagnosticScoringService {
  /**
   * Resolve scoring configuration based on exam type and user-supplied overrides
   */
  public resolveScoringConfig(
    examType: ExamType,
    overrides?: Partial<DiagnosticScoringConfig>
  ): DiagnosticScoringConfig {
    const examConfig = examConfigService.getConfig(examType);

    return {
      strongThreshold: overrides?.strongThreshold ?? examConfig.diagnostic.strongThreshold,
      developingThreshold: overrides?.developingThreshold ?? examConfig.diagnostic.developingThreshold,
      minAttemptsForClassification:
        overrides?.minAttemptsForClassification ?? examConfig.diagnostic.minAttemptsForClassification,
      correctMark: overrides?.correctMark ?? examConfig.diagnostic.correctMark,
      negativeMarkingPenalty: overrides?.negativeMarkingPenalty ?? examConfig.diagnostic.negativeMarkingPenalty,
      negativeMarking: overrides?.negativeMarking ?? examConfig.diagnostic.negativeMarking,
    };
  }

  /**
   * Classify topic performance using the documented, configurable thresholds
   */
  public classifyTopic(
    attempted: number,
    accuracy: number,
    config: DiagnosticScoringConfig
  ): TopicClassification {
    if (attempted < config.minAttemptsForClassification) {
      return 'unknown';
    }
    if (accuracy >= config.strongThreshold) {
      return 'strong';
    }
    if (accuracy >= config.developingThreshold) {
      return 'developing';
    }
    return 'weak';
  }

  /**
   * Full evaluation of a student's diagnostic submission
   */
  public evaluateAttempt(input: EvaluateDiagnosticInput): DiagnosticAttempt {
    const config = this.resolveScoringConfig(input.examType, input.scoringConfigOverrides);
    const completedAt = input.completedAt || new Date().toISOString();
    const questionMap = new Map<string, Question>(input.questions.map((q) => [q.id, q]));
    const answerMap = new Map<string, DiagnosticAnswer>(input.answers.map((a) => [a.questionId, a]));

    let totalScore = 0;
    let correctCount = 0;
    let attemptedCount = 0;
    const totalQuestions = input.questions.length;

    // Intermediate tracking structures
    const subjectBuckets: Record<
      string,
      {
        subjectId: string;
        subjectName: string;
        score: number;
        maxScore: number;
        total: number;
        attempted: number;
        correct: number;
      }
    > = {};

    const topicBuckets: Record<
      string,
      {
        topicId: string;
        topicName: string;
        subjectId: string;
        subjectName: string;
        chapterName: string;
        attempted: number;
        correct: number;
        totalTimes: number[];
        confidences: Record<'low' | 'medium' | 'high' | 'unspecified', number>;
        yieldPriority: number;
      }
    > = {};

    const difficultyBuckets: Record<
      DifficultyLevel,
      { total: number; attempted: number; correct: number }
    > = {
      easy: { total: 0, attempted: 0, correct: 0 },
      medium: { total: 0, attempted: 0, correct: 0 },
      hard: { total: 0, attempted: 0, correct: 0 },
      exam_level: { total: 0, attempted: 0, correct: 0 },
    };

    const recordedAnswers: DiagnosticAttempt['answers'] = [];
    const questionTimes: number[] = [];

    const confidenceStats = {
      high: { count: 0, correct: 0 },
      medium: { count: 0, correct: 0 },
      low: { count: 0, correct: 0 },
      unspecified: 0,
    };

    // Pre-initialize subjects & topics from questions
    for (const q of input.questions) {
      const subjectName = this.formatSubjectName(q.subjectId);
      if (!subjectBuckets[q.subjectId]) {
        subjectBuckets[q.subjectId] = {
          subjectId: q.subjectId,
          subjectName,
          score: 0,
          maxScore: 0,
          total: 0,
          attempted: 0,
          correct: 0,
        };
      }
      subjectBuckets[q.subjectId].total += 1;
      subjectBuckets[q.subjectId].maxScore += config.correctMark;

      if (!topicBuckets[q.topicId]) {
        const topicMeta = curriculumService.getTopicByIdSync(q.topicId);
        const chapterMeta = topicMeta ? curriculumService.getChapterByIdSync(topicMeta.chapterId) : undefined;
        topicBuckets[q.topicId] = {
          topicId: q.topicId,
          topicName: topicMeta?.name || this.formatTopicName(q.topicId),
          subjectId: q.subjectId,
          subjectName,
          chapterName: chapterMeta?.name || 'Core Curriculum',
          attempted: 0,
          correct: 0,
          totalTimes: [],
          confidences: { low: 0, medium: 0, high: 0, unspecified: 0 },
          yieldPriority: topicMeta?.importanceRating || 4,
        };
      }

      difficultyBuckets[q.difficulty].total += 1;
    }

    // Process each question and student answer
    for (const q of input.questions) {
      const ans = answerMap.get(q.id);
      const isAttempted = Boolean(ans && ans.selectedOptionId);

      if (isAttempted && ans) {
        attemptedCount += 1;
        difficultyBuckets[q.difficulty].attempted += 1;
        subjectBuckets[q.subjectId].attempted += 1;
        topicBuckets[q.topicId].attempted += 1;

        const isCorrect = ans.selectedOptionId === q.correctOptionId;
        const timeSpent = Math.max(1, ans.timeSpentSeconds || 0);
        questionTimes.push(timeSpent);
        topicBuckets[q.topicId].totalTimes.push(timeSpent);

        // Confidence tracking
        const conf: ConfidenceLevel | undefined = ans.confidence;
        if (conf === 'high') {
          confidenceStats.high.count += 1;
          if (isCorrect) confidenceStats.high.correct += 1;
          topicBuckets[q.topicId].confidences.high += 1;
        } else if (conf === 'medium') {
          confidenceStats.medium.count += 1;
          if (isCorrect) confidenceStats.medium.correct += 1;
          topicBuckets[q.topicId].confidences.medium += 1;
        } else if (conf === 'low') {
          confidenceStats.low.count += 1;
          if (isCorrect) confidenceStats.low.correct += 1;
          topicBuckets[q.topicId].confidences.low += 1;
        } else {
          confidenceStats.unspecified += 1;
          topicBuckets[q.topicId].confidences.unspecified += 1;
        }

        // Scoring rules
        if (isCorrect) {
          correctCount += 1;
          totalScore += config.correctMark;
          subjectBuckets[q.subjectId].score += config.correctMark;
          subjectBuckets[q.subjectId].correct += 1;
          topicBuckets[q.topicId].correct += 1;
          difficultyBuckets[q.difficulty].correct += 1;
        } else if (config.negativeMarking) {
          totalScore -= config.negativeMarkingPenalty;
          subjectBuckets[q.subjectId].score -= config.negativeMarkingPenalty;
        }

        recordedAnswers.push({
          questionId: q.id,
          selectedOptionId: ans.selectedOptionId,
          isCorrect,
          correctOptionId: q.correctOptionId,
          timeSpentSeconds: timeSpent,
          confidence: conf,
          topicId: q.topicId,
          subjectId: q.subjectId,
          difficulty: q.difficulty,
          attemptedAt: ans.attemptedAt || completedAt,
        });
      }
    }

    const maxScore = totalQuestions * config.correctMark;
    const overallAccuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const percentage = maxScore > 0 ? Math.max(0, Math.round((totalScore / maxScore) * 100)) : 0;

    // Build Topic Performance map
    const topicBreakdown: Record<string, TopicPerformance> = {};
    const weakTopics: TopicPerformance[] = [];
    const strongTopics: TopicPerformance[] = [];
    const developingTopics: TopicPerformance[] = [];
    const unknownTopics: TopicPerformance[] = [];

    for (const [topicId, data] of Object.entries(topicBuckets)) {
      const topicAccuracy = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
      const classification = this.classifyTopic(data.attempted, topicAccuracy, config);
      const avgTime =
        data.totalTimes.length > 0
          ? Math.round(data.totalTimes.reduce((a, b) => a + b, 0) / data.totalTimes.length)
          : 0;

      let severity: TopicPerformance['severity'] = 'none';
      if (classification === 'weak') {
        severity = topicAccuracy < 35 ? 'critical' : 'moderate';
      } else if (classification === 'developing') {
        severity = 'minor';
      }

      const perf: TopicPerformance = {
        topicId,
        topicName: data.topicName,
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        chapterName: data.chapterName,
        attempted: data.attempted,
        correct: data.correct,
        accuracy: topicAccuracy,
        classification,
        averageTimeSeconds: avgTime,
        confidenceDistribution: data.confidences,
        severity,
        yieldPriority: data.yieldPriority,
      };

      topicBreakdown[topicId] = perf;

      if (classification === 'weak') {
        weakTopics.push(perf);
      } else if (classification === 'strong') {
        strongTopics.push(perf);
      } else if (classification === 'developing') {
        developingTopics.push(perf);
      } else {
        unknownTopics.push(perf);
      }
    }

    // Sort weak topics by: critical first, lowest accuracy, highest yield
    weakTopics.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return b.yieldPriority - a.yieldPriority;
    });

    // Sort strong topics by accuracy descending
    strongTopics.sort((a, b) => b.accuracy - a.accuracy);

    // Build Subject Breakdown
    const subjectBreakdown: Record<string, SubjectPerformance> = {};
    const legacySubjectScores: Record<string, { score: number; maxScore: number; accuracyPercentage: number }> = {};

    for (const [subjId, data] of Object.entries(subjectBuckets)) {
      const subjectAccuracy = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
      const subjTopics = Object.values(topicBreakdown).filter((t) => t.subjectId === subjId);

      subjectBreakdown[subjId] = {
        subjectId: subjId,
        subjectName: data.subjectName,
        score: Math.max(0, data.score),
        maxScore: data.maxScore,
        totalQuestions: data.total,
        attemptedQuestions: data.attempted,
        correctCount: data.correct,
        accuracy: subjectAccuracy,
        topics: subjTopics,
      };

      legacySubjectScores[subjId] = {
        score: Math.max(0, data.score),
        maxScore: data.maxScore,
        accuracyPercentage: subjectAccuracy,
      };
    }

    // Build Difficulty Breakdown
    const difficultyBreakdown: Record<DifficultyLevel, DifficultyPerformance> = {
      easy: {
        difficulty: 'easy',
        total: difficultyBuckets.easy.total,
        attempted: difficultyBuckets.easy.attempted,
        correct: difficultyBuckets.easy.correct,
        accuracy:
          difficultyBuckets.easy.attempted > 0
            ? Math.round((difficultyBuckets.easy.correct / difficultyBuckets.easy.attempted) * 100)
            : 0,
      },
      medium: {
        difficulty: 'medium',
        total: difficultyBuckets.medium.total,
        attempted: difficultyBuckets.medium.attempted,
        correct: difficultyBuckets.medium.correct,
        accuracy:
          difficultyBuckets.medium.attempted > 0
            ? Math.round((difficultyBuckets.medium.correct / difficultyBuckets.medium.attempted) * 100)
            : 0,
      },
      hard: {
        difficulty: 'hard',
        total: difficultyBuckets.hard.total,
        attempted: difficultyBuckets.hard.attempted,
        correct: difficultyBuckets.hard.correct,
        accuracy:
          difficultyBuckets.hard.attempted > 0
            ? Math.round((difficultyBuckets.hard.correct / difficultyBuckets.hard.attempted) * 100)
            : 0,
      },
      exam_level: {
        difficulty: 'exam_level',
        total: difficultyBuckets.exam_level.total,
        attempted: difficultyBuckets.exam_level.attempted,
        correct: difficultyBuckets.exam_level.correct,
        accuracy:
          difficultyBuckets.exam_level.attempted > 0
            ? Math.round((difficultyBuckets.exam_level.correct / difficultyBuckets.exam_level.attempted) * 100)
            : 0,
      },
    };

    // Time Performance
    const totalTimeSpentSeconds = questionTimes.reduce((a, b) => a + b, 0);
    const averageTimePerQuestionSeconds =
      questionTimes.length > 0 ? Math.round(totalTimeSpentSeconds / questionTimes.length) : 0;
    const fastestQuestionSeconds = questionTimes.length > 0 ? Math.min(...questionTimes) : 0;
    const slowestQuestionSeconds = questionTimes.length > 0 ? Math.max(...questionTimes) : 0;
    const recommendedPacing = input.examType === 'ECAT' ? 90 : 75;

    let pacingStanding: TimePerformance['pacingStanding'] = 'optimal';
    if (averageTimePerQuestionSeconds > 0 && averageTimePerQuestionSeconds < 35) {
      pacingStanding = 'rushed';
    } else if (averageTimePerQuestionSeconds > recommendedPacing * 1.3) {
      pacingStanding = 'slow';
    }

    const timePerformance: TimePerformance = {
      totalTimeSpentSeconds,
      averageTimePerQuestionSeconds,
      fastestQuestionSeconds,
      slowestQuestionSeconds,
      recommendedPacingSeconds: recommendedPacing,
      pacingStanding,
    };

    // Confidence Breakdown & Calibration
    const highAccuracy =
      confidenceStats.high.count > 0
        ? Math.round((confidenceStats.high.correct / confidenceStats.high.count) * 100)
        : 0;
    const mediumAccuracy =
      confidenceStats.medium.count > 0
        ? Math.round((confidenceStats.medium.correct / confidenceStats.medium.count) * 100)
        : 0;
    const lowAccuracy =
      confidenceStats.low.count > 0
        ? Math.round((confidenceStats.low.correct / confidenceStats.low.count) * 100)
        : 0;

    let calibrationStatus: ConfidencePerformance['calibrationStatus'] = 'well_calibrated';
    let insightText =
      'Your confidence ratings closely mirror your true accuracy. Keep trusting your instincts during speed drills.';

    if (confidenceStats.high.count >= 2 && highAccuracy < 60) {
      calibrationStatus = 'overconfident';
      insightText =
        'Identified overconfidence on high-certainty questions. Watch out for conceptual traps in formulas and negative sign errors.';
    } else if (confidenceStats.low.count >= 2 && lowAccuracy > 70) {
      calibrationStatus = 'underconfident';
      insightText =
        'You scored highly even when expressing low confidence. Trust your conceptual intuition more decisively on exam day.';
    } else if (confidenceStats.high.count + confidenceStats.medium.count + confidenceStats.low.count < 3) {
      calibrationStatus = 'insufficient_data';
      insightText = 'Use the confidence selector on every question to unlock metacognitive calibration insights.';
    }

    const confidenceBreakdown: ConfidencePerformance = {
      highConfidenceCount: confidenceStats.high.count,
      highConfidenceAccuracy: highAccuracy,
      mediumConfidenceCount: confidenceStats.medium.count,
      mediumConfidenceAccuracy: mediumAccuracy,
      lowConfidenceCount: confidenceStats.low.count,
      lowConfidenceAccuracy: lowAccuracy,
      unspecifiedCount: confidenceStats.unspecified,
      calibrationStatus,
      insightText,
    };

    // Formulate Recommended Next Step leading into the Learning Unit
    const recommendedNextStep = this.determineRecommendedNextStep(
      weakTopics,
      developingTopics,
      strongTopics,
      input.examType
    );

    // Legacy detected weaknesses format
    const legacyDetectedWeaknesses = weakTopics.map((w) => ({
      topicId: w.topicId,
      topicName: w.topicName,
      subjectName: w.subjectName,
      severity: w.severity === 'critical' ? ('critical' as const) : ('moderate' as const),
      accuracy: w.accuracy,
    }));

    // Percentile approximation
    const percentileEstimate = Math.min(99, Math.max(15, Math.round(percentage * 0.9 + 10)));

    return {
      id: input.attemptId,
      diagnosticTestId: input.diagnosticTestId,
      diagnosticId: input.diagnosticTestId,
      studentId: input.studentId,
      studentName: input.studentName || 'Student',
      examType: input.examType,
      status: 'completed',
      startedAt: input.startedAt,
      completedAt,
      totalQuestions,
      attemptedQuestions: attemptedCount,
      totalScore: Math.max(0, totalScore),
      maxScore,
      overallAccuracy,
      percentage,
      percentileEstimate,
      subjectBreakdown,
      topicBreakdown,
      difficultyBreakdown,
      timePerformance,
      confidenceBreakdown,
      weakTopics,
      strongTopics,
      developingTopics,
      unknownTopics,
      recommendedNextStep,
      answers: recordedAnswers,
      subjectScores: legacySubjectScores,
      detectedWeaknesses: legacyDetectedWeaknesses,
    };
  }

  /**
   * Determine the highest-yield remediation next step leading into the Learning Unit
   */
  private determineRecommendedNextStep(
    weakTopics: TopicPerformance[],
    developingTopics: TopicPerformance[],
    strongTopics: TopicPerformance[],
    examType: ExamType
  ): RecommendedNextStep {
    // 1. Weak topic with highest yield / critical severity
    if (weakTopics.length > 0) {
      const topWeak = weakTopics[0];
      const potentialGain = examType === 'ECAT' ? '+16 to +24' : '+3 to +5';
      return {
        topicId: topWeak.topicId,
        topicName: topWeak.topicName,
        subjectName: topWeak.subjectName,
        chapterName: topWeak.chapterName,
        learningUnitUrl: `/student/learn/${topWeak.topicId}`,
        reason: `Highest priority gap detected in ${topWeak.topicName} (${topWeak.accuracy}% accuracy). Remediating this unit unlocks up to ${potentialGain} marks on ${examType}.`,
        priority: 1,
        currentAccuracy: topWeak.accuracy,
        estimatedMinutesToMastery: 45,
      };
    }

    // 2. Developing topic
    if (developingTopics.length > 0) {
      const topDev = developingTopics[0];
      return {
        topicId: topDev.topicId,
        topicName: topDev.topicName,
        subjectName: topDev.subjectName,
        chapterName: topDev.chapterName,
        learningUnitUrl: `/student/learn/${topDev.topicId}`,
        reason: `Solid foundation in ${topDev.topicName} (${topDev.accuracy}% accuracy). Reinforce advanced shortcuts to achieve complete mastery.`,
        priority: 2,
        currentAccuracy: topDev.accuracy,
        estimatedMinutesToMastery: 30,
      };
    }

    // 3. Fallback to first strong or default topic
    const fallback = strongTopics[0] || {
      topicId: 'topic-phy-kinematics',
      topicName: 'Kinematics in One & Two Dimensions',
      subjectName: 'Physics',
      chapterName: 'Mechanics',
      accuracy: 80,
    };

    return {
      topicId: fallback.topicId,
      topicName: fallback.topicName,
      subjectName: fallback.subjectName,
      chapterName: fallback.chapterName,
      learningUnitUrl: `/student/learn/${fallback.topicId}`,
      reason: `You have cleared baseline competency! Advance directly into high-yield mastery practice in ${fallback.topicName}.`,
      priority: 3,
      currentAccuracy: fallback.accuracy,
      estimatedMinutesToMastery: 25,
    };
  }

  private formatSubjectName(subjectId: string): string {
    if (subjectId.includes('math')) return 'Mathematics';
    if (subjectId.includes('physics')) return 'Physics';
    if (subjectId.includes('chemistry')) return 'Chemistry';
    if (subjectId.includes('biology')) return 'Biology';
    if (subjectId.includes('english')) return 'English';
    if (subjectId.includes('logic')) return 'Logical Reasoning';
    return subjectId.replace('subj-', '').toUpperCase();
  }

  private formatTopicName(topicId: string): string {
    return topicId
      .replace(/^topic-[a-z]+-/, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}

export const diagnosticScoringService = new DiagnosticScoringService();

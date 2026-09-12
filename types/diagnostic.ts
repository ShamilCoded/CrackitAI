/**
 * Diagnostic Engine Types
 *
 * Provides strict domain contracts for:
 * - Diagnostic Tests & Configurations
 * - Student Diagnostic Attempts
 * - Configurable Scoring & Thresholds
 * - Multi-dimensional Performance Breakdown (Overall, Subject, Topic, Difficulty, Time, Confidence)
 * - Topic Classification (strong, developing, weak, unknown)
 * - Pedagogical Next-Step Recommendations leading into Learning Units
 */

import type {
  ExamType,
  DifficultyLevel,
  ConfidenceLevel,
  DiagnosticStatus,
  Question,
} from './domain';

/**
 * Topic Classification categories as required by pedagogical specification:
 * - 'strong': High mastery, confident accuracy above threshold (e.g. >= 75%)
 * - 'developing': Moderate competence requiring reinforcement (e.g. 50% - 74%)
 * - 'weak': Critical or moderate knowledge gap requiring targeted remediation (< 50%)
 * - 'unknown': Topic has not been evaluated / 0 attempted questions in the diagnostic set
 */
export type TopicClassification = 'strong' | 'developing' | 'weak' | 'unknown';

/**
 * Configurable thresholds for diagnostic scoring.
 * Allows administrators and syllabus planners to fine-tune classification benchmarks
 * without modifying business logic code.
 */
export interface DiagnosticScoringConfig {
  /** Accuracy threshold (in %) at or above which a topic is classified as 'strong' (default: 75) */
  strongThreshold: number;
  /** Accuracy threshold (in %) at or above which a topic is classified as 'developing' (default: 50) */
  developingThreshold: number;
  /** Minimum question attempts required for classification; if fewer, topic is 'unknown' (default: 1) */
  minAttemptsForClassification: number;
  /** Marks awarded for each correct MCQ (default: 4 for ECAT, 1 for MDCAT) */
  correctMark: number;
  /** Penalty marks subtracted for each wrong MCQ (default: 1 for ECAT, 0 for MDCAT) */
  negativeMarkingPenalty: number;
  /** Whether negative marking is active for the evaluation */
  negativeMarking: boolean;
}

export const DEFAULT_DIAGNOSTIC_SCORING_CONFIG: DiagnosticScoringConfig = {
  strongThreshold: 75,
  developingThreshold: 50,
  minAttemptsForClassification: 1,
  correctMark: 4,
  negativeMarkingPenalty: 1,
  negativeMarking: true,
};

/**
 * Subject Breakdown rule inside a Diagnostic Test configuration
 */
export interface DiagnosticSubjectQuota {
  subjectId: string;
  subjectName?: string;
  questionCount: number;
}

/**
 * Test configuration object stored with each diagnostic test
 */
export interface DiagnosticTestConfiguration {
  subjectBreakdown: DiagnosticSubjectQuota[];
  difficultyDistribution?: {
    easy?: number;
    medium?: number;
    hard?: number;
    exam_level?: number;
  };
  passingPercentage?: number;
  targetAudience?: string;
  scoringConfig?: Partial<DiagnosticScoringConfig>;
}

/**
 * Diagnostic Test Definition (Database entity: diagnostic_tests)
 */
export interface DiagnosticTest {
  id: string;
  examId: string;
  examType: ExamType;
  name: string;
  description: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  testConfiguration: DiagnosticTestConfiguration;
  questionIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Input for creating a new Diagnostic Test
 */
export interface CreateDiagnosticTestInput {
  id?: string;
  examType: ExamType;
  examId?: string;
  name: string;
  description: string;
  totalQuestions?: number;
  timeLimitMinutes?: number;
  testConfiguration?: DiagnosticTestConfiguration;
  questionIds?: string[];
  isActive?: boolean;
}

/**
 * A single answer submitted during a diagnostic attempt
 */
export interface DiagnosticAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect?: boolean;
  correctOptionId?: string;
  timeSpentSeconds: number;
  confidence?: ConfidenceLevel;
  attemptedAt?: string;
}

/**
 * Granular topic-level diagnostic performance
 */
export interface TopicPerformance {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  chapterName?: string;
  attempted: number;
  correct: number;
  accuracy: number; // 0 - 100
  classification: TopicClassification; // 'strong' | 'developing' | 'weak' | 'unknown'
  averageTimeSeconds: number;
  confidenceDistribution: {
    low: number;
    medium: number;
    high: number;
    unspecified: number;
  };
  severity: 'critical' | 'moderate' | 'minor' | 'none';
  yieldPriority: number; // 1 (highest yield/importance) to 5
}

/**
 * Granular subject-level diagnostic performance
 */
export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctCount: number;
  accuracy: number; // 0 - 100
  topics: TopicPerformance[];
}

/**
 * Performance categorized by question difficulty
 */
export interface DifficultyPerformance {
  difficulty: DifficultyLevel;
  total: number;
  attempted: number;
  correct: number;
  accuracy: number; // 0 - 100
}

/**
 * Telemetry and pacing metrics across the diagnostic
 */
export interface TimePerformance {
  totalTimeSpentSeconds: number;
  averageTimePerQuestionSeconds: number;
  fastestQuestionSeconds: number;
  slowestQuestionSeconds: number;
  recommendedPacingSeconds: number;
  pacingStanding: 'optimal' | 'rushed' | 'slow';
}

/**
 * Confidence calibration metrics
 */
export interface ConfidencePerformance {
  highConfidenceCount: number;
  highConfidenceAccuracy: number;
  mediumConfidenceCount: number;
  mediumConfidenceAccuracy: number;
  lowConfidenceCount: number;
  lowConfidenceAccuracy: number;
  unspecifiedCount: number;
  calibrationStatus: 'well_calibrated' | 'overconfident' | 'underconfident' | 'insufficient_data';
  insightText: string;
}

/**
 * Recommended Next Step leading into the Learning Unit for the weakest/highest-priority topic
 */
export interface RecommendedNextStep {
  topicId: string;
  topicName: string;
  subjectName: string;
  chapterName?: string;
  learningUnitUrl: string; // e.g. `/student/learn/topic-phy-centripetal-force`
  reason: string;
  priority: number;
  currentAccuracy: number;
  estimatedMinutesToMastery: number;
}

/**
 * Complete Diagnostic Attempt entity (Database entity: diagnostic_attempts)
 */
export interface DiagnosticAttempt {
  id: string;
  diagnosticTestId: string;
  diagnosticId: string; // alias for diagnosticTestId for backward-compatibility
  studentId: string;
  studentName?: string;
  examType: ExamType;
  status: DiagnosticStatus;
  startedAt: string;
  completedAt?: string;
  
  // Scoring & Accuracy
  totalQuestions: number;
  attemptedQuestions: number;
  totalScore: number;
  maxScore: number;
  overallAccuracy: number; // 0 - 100
  percentage: number; // alias for overallAccuracy
  percentileEstimate?: number;

  // Multi-dimensional Breakdowns
  subjectBreakdown: Record<string, SubjectPerformance>;
  topicBreakdown: Record<string, TopicPerformance>;
  difficultyBreakdown: Record<DifficultyLevel, DifficultyPerformance>;
  timePerformance: TimePerformance;
  confidenceBreakdown: ConfidencePerformance;

  // Grouped Classifications
  weakTopics: TopicPerformance[];
  strongTopics: TopicPerformance[];
  developingTopics: TopicPerformance[];
  unknownTopics: TopicPerformance[];

  // Actionable Recommendation
  recommendedNextStep: RecommendedNextStep;

  // Recorded question attempts
  answers: Array<DiagnosticAnswer & {
    isCorrect: boolean;
    correctOptionId: string;
    topicId: string;
    subjectId: string;
    difficulty: DifficultyLevel;
  }>;

  // Backward-compatible fields
  subjectScores: Record<string, {
    score: number;
    maxScore: number;
    accuracyPercentage: number;
  }>;
  detectedWeaknesses: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
    severity: 'critical' | 'moderate' | 'minor';
    accuracy: number;
  }>;

  // AI Diagnostic synthesis
  aiDiagnosticSummary?: string;
}

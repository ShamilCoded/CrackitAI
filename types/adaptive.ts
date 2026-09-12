import type { ExamType, DifficultyLevel, Question } from './domain';
import type { TopicMasteryStatus } from './mastery';

export interface AdaptiveEngineConfig {
  lowMasteryThreshold: number; // e.g. 40
  highMasteryThreshold: number; // e.g. 70
  consecutiveCorrectForPromotion: number; // e.g. 2
  consecutiveWrongForDemotion: number; // e.g. 1
  minQuestionsBeforeRetest: number; // e.g. 3
  retestQuestionCount: number; // e.g. 3
  allowRepeatsAfterDays: number; // e.g. 3
}

export type PedagogicalStage =
  | 'foundation'
  | 'reinforcement'
  | 'mastery_verification'
  | 'mistake_remediation'
  | 'spaced_revision';

export interface AdaptiveQuestionRecommendation {
  question: Question;
  targetDifficulty: DifficultyLevel;
  reason: string;
  pedagogicalStage: PedagogicalStage;
  currentMasteryScore: number;
  streakCount: number;
  isRetestQuestion?: boolean;
}

export interface MasteryComparisonResult {
  topicId: string;
  topicName: string;
  subjectName: string;
  examType: ExamType;
  beforeMasteryScore: number;
  afterMasteryScore: number;
  delta: number;
  totalAttemptsInSession: number;
  correctCountInSession: number;
  sessionAccuracy: number;
  isMasteryVerified: boolean;
  statusBefore: TopicMasteryStatus;
  statusAfter: TopicMasteryStatus;
  summaryFeedback: string;
  strengths: string[];
  growthAreas: string[];
  recommendedNextStep: 'proceed_to_next_topic' | 'review_learning_unit' | 'consult_ai_tutor' | 'repeat_practice';
  nextActionUrl: string;
}

export interface ActiveAdaptiveSession {
  sessionId: string;
  studentId: string;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  examType: ExamType;
  sessionType: 'adaptive_practice' | 'mastery_retest';
  baselineMasteryScore: number;
  baselineStatus: TopicMasteryStatus;
  questionIdsAttempted: string[];
  correctCount: number;
  currentStreak: number;
  startedAt: string;
  completedAt?: string;
  comparisonResult?: MasteryComparisonResult;
}

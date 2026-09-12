import type { ExamType, Question, DifficultyLevel } from './domain';

export type MockPresetKey = 'sprint_10' | 'mini_20' | 'standard_30' | 'custom';

export interface MockExamSubjectQuota {
  subjectId: string;
  subjectName: string;
  questionCount: number;
  weightPercentage: number;
}

export interface MockExam {
  id: string;
  examId: string; // 'exam-ecat' | 'exam-mdcat'
  examType: ExamType;
  title: string;
  description: string;
  year?: number;
  isOfficialFormat: boolean;
  totalQuestions: number;
  durationMinutes: number;
  negativeMarking: boolean;
  negativeMarkingPenalty: number; // e.g. 1.0 for ECAT, 0 for MDCAT
  passingPercentage: number;
  presetKey?: MockPresetKey;
  subjectQuotas: MockExamSubjectQuota[];
  isActive: boolean;
  createdAt: string;
}

export interface MockExamQuestion extends Question {
  examOrder: number;
  subjectName: string;
  topicName?: string;
}

export interface MockAnswer {
  questionId: string;
  selectedOptionId?: string;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
  visited: boolean;
  answeredAt?: string;
}

export interface MockSubjectBreakdown {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  score: number;
  maxScore: number;
  accuracyPercentage: number;
  timeSpentSeconds: number;
  averageTimePerQuestionSeconds: number;
}

export interface MockTopicBreakdown {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
  masteryImpact: 'improved' | 'declined' | 'neutral';
}

export interface MockTimeAnalysis {
  totalTimeSpentSeconds: number;
  allocatedTimeSeconds: number;
  timeRemainingSeconds: number;
  averageTimePerQuestionSeconds: number;
  averageTimeCorrectSeconds: number;
  averageTimeIncorrectSeconds: number;
  averageTimeUnattemptedSeconds: number;
  pacingEfficiency: 'rushed' | 'optimal' | 'slow';
  pacingNotes: string;
}

export interface MockMistakeItem {
  questionId: string;
  question: Question;
  selectedOptionId?: string;
  correctOptionId: string;
  isCorrect: boolean;
  isUnattempted: boolean;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  explanation: string;
  tipOrShortcut?: string;
}

export interface MockRecommendation {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  actionType: 'learning_unit' | 'practice_drill' | 'review_formula';
  actionLabel: string;
}

export interface MockAttempt {
  id: string;
  mockExamId: string;
  studentId: string;
  examType: ExamType;
  examTitle: string;
  startedAt: string;
  completedAt: string;
  totalDurationSeconds: number;
  timeSpentSeconds: number;
  isAutoSubmitted: boolean;
  totalQuestions: number;
  attemptedCount: number;
  unattemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  markedForReviewCount: number;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  projectedRankPercentile: number;
  subjectBreakdown: Record<string, MockSubjectBreakdown>;
  topicBreakdown: Record<string, MockTopicBreakdown>;
  timeAnalysis: MockTimeAnalysis;
  mistakes: MockMistakeItem[];
  recommendations: MockRecommendation[];
  answers: Record<string, MockAnswer>;
}

export interface GenerateMockExamConfig {
  examType: ExamType;
  presetKey?: MockPresetKey;
  questionCount: number;
  durationMinutes?: number;
  title?: string;
}

import type { ExamType, DifficultyLevel, StudyPlan, StudyPlanItem, Question } from './domain';

export type RecommendedActivityType =
  | 'concept_review'
  | 'practice_drill'
  | 'learning_unit'
  | 'spaced_repetition'
  | 'mastery_test'
  | 'formula_drill';

export interface WhyExplanation {
  topicId: string;
  topicName: string;
  subjectName: string;
  primaryReason: string;
  masteryScore: number;
  masteryStatus: string;
  examWeightPercentage?: number;
  importanceRating: number;
  recentAccuracy?: number;
  totalAttempts?: number;
  retentionAlert?: string;
  pedagogicalObjective: string;
  aiCoachTip?: string;
  prerequisiteNotes?: string;
}

export interface TopicRecommendation {
  topicId: string;
  topicName: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  priorityScore: number; // 0-100 normalized priority ranking
  priorityRank: number; // 1, 2, 3...
  recommendedActivity: RecommendedActivityType;
  estimatedMinutes: number;
  masteryScore: number;
  masteryStatus: string;
  importanceRating: number;
  reason: string;
  whyExplanation: WhyExplanation;
}

export interface NextBestActivity {
  topicId: string;
  topicName: string;
  subjectName: string;
  activityType: RecommendedActivityType;
  title: string;
  description: string;
  estimatedMinutes: number;
  actionUrl: string;
  priorityScore: number;
  priorityReason: string;
  whyExplanation: WhyExplanation;
}

export interface AdaptivePracticeOptions {
  studentId?: string;
  subjectId?: string;
  examType?: ExamType;
  targetQuestionCount?: number; // default 5-10
  focusTopicIds?: string[];
}

export interface AdaptivePracticeSetResult {
  sessionId: string;
  studentId: string;
  examType: ExamType;
  totalQuestions: number;
  estimatedMinutes: number;
  targetTopics: Array<{
    topicId: string;
    topicName: string;
    masteryScore: number;
  }>;
  difficultyBreakdown: Record<DifficultyLevel, number>;
  questions: Question[];
  rationale: string;
}

export interface StudyPlanGenerationOptions {
  examType?: ExamType;
  goalExamDate?: string;
  targetScore?: number;
  dailyAvailableMinutes?: number; // e.g. 60 min default
  subjectFocus?: string;
  includeAiCoaching?: boolean;
}

export interface StudyPlanItemDetailed extends StudyPlanItem {
  topicName?: string;
  chapterName?: string;
  subjectId?: string;
  subjectName?: string;
  recommendedActivity?: RecommendedActivityType;
  whyExplanation?: WhyExplanation;
  masteryScore?: number;
}

export interface PersonalizedStudyPlanResult {
  plan: StudyPlan & {
    coachingMessage?: string;
    dailyAvailableMinutes?: number;
    targetExam?: ExamType;
    overallProgressPercentage?: number;
  };
  items: StudyPlanItemDetailed[];
  nextBestActivity: NextBestActivity;
  topWeakTopics: TopicRecommendation[];
  coachingAdvice?: string;
}

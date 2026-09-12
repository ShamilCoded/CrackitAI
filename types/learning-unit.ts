import type {
  Topic,
  Subject,
  Chapter,
  LearningUnit,
  LearningObjective,
  Skill,
  Question,
  DifficultyLevel,
  ExamType,
} from './domain';

/**
 * Key Definition entity for the Learn section
 */
export interface ImportantDefinition {
  id: string;
  term: string;
  definition: string;
  symbolOrUnit?: string;
  examNote?: string;
}

/**
 * Step-by-step Worked Example for the Examples section
 */
export interface WorkedExampleStep {
  stepNumber: number;
  title: string;
  explanation: string;
  mathExpression?: string;
}

export interface WorkedExample {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  targetExam?: ExamType;
  problemStatement: string;
  givenData?: Record<string, string>;
  steps: WorkedExampleStep[];
  finalAnswer: string;
  examShortcutTip?: string;
  relatedSkillCode?: string;
}

/**
 * Common Pitfall / Trap detail
 */
export interface TopicCommonPitfall {
  trap: string;
  whyItHappens: string;
  howToAvoid: string;
}

/**
 * Weak Concept identified for student revision
 */
export interface TopicWeakConcept {
  concept: string;
  severity: 'critical' | 'moderate' | 'minor';
  remedy: string;
  relevantObjectiveStatement?: string;
}

/**
 * Previous Mistake recorded in student question attempts
 */
export interface TopicPreviousMistake {
  questionId: string;
  questionContent: string;
  studentSelectedOption: string;
  correctOption: string;
  misconceptionAnalysis: string;
  timestamp?: string;
}

/**
 * Revision Review Item / Flashcard
 */
export interface TopicReviewItem {
  id: string;
  title: string;
  detail: string;
  category: 'formula' | 'concept' | 'shortcut';
}

/**
 * Aggregated Revision Data for a Topic
 */
export interface TopicRevisionData {
  topicId: string;
  weakConcepts: TopicWeakConcept[];
  previousMistakes: TopicPreviousMistake[];
  recommendedQuestionIds: string[];
  recommendedQuestions: Question[];
  reviewItems: TopicReviewItem[];
}

/**
 * Full, Hydrated Learning Unit used by the reusable UI
 */
export interface FullLearningUnit {
  topic: Topic;
  subject: Subject;
  chapter: Chapter;
  unit: LearningUnit;
  overview: string;
  learningObjectives: LearningObjective[];
  skills: Skill[];
  definitions: ImportantDefinition[];
  workedExamples: WorkedExample[];
  commonPitfalls: TopicCommonPitfall[];
  practiceQuestions: Question[];
  revisionData: TopicRevisionData;
  masteryTestQuestions: Question[];
  currentMasteryScore: number;
  currentMasteryLevel: 'novice' | 'developing' | 'proficient' | 'mastered';
}

/**
 * Canonical 6 Sections of a Learning Unit
 */
export type LearningUnitSection =
  | 'learn'
  | 'examples'
  | 'practice'
  | 'ai-tutor'
  | 'revision'
  | 'mastery-test';

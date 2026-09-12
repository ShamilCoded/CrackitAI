/**
 * Core Domain Entities for the AI Exam Tutor Platform (ECAT & MDCAT)
 * Strict TypeScript models enforcing separation of concerns and data-driven curriculum.
 */

export type ExamType = 'ECAT' | 'MDCAT';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'exam_level';

export type QuestionStatus = 'draft' | 'review' | 'approved' | 'archived';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'numerical' | 'assertion_reason';

export type MasteryLevel = 'novice' | 'developing' | 'proficient' | 'mastered';

export type StudyPlanItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export type DiagnosticStatus = 'not_started' | 'in_progress' | 'completed';

export type TutorRole = 'student' | 'tutor' | 'system';

/**
 * Student Profile representation (linked to Supabase auth.users)
 */
export interface StudentProfile {
  id: string; // matches auth.users UUID
  email: string;
  fullName: string;
  targetExam: ExamType;
  examYear: number;
  targetScore?: number;
  baselineScore?: number;
  currentScoreEstimate?: number;
  streakDays: number;
  lastActiveAt?: string;
  avatarUrl?: string;
  isDemo?: boolean;
  role?: 'student' | 'admin' | 'parent';
  createdAt: string;
  updatedAt: string;
}

/**
 * Exam definition (ECAT, MDCAT, etc.)
 */
export interface Exam {
  id: string;
  code: ExamType;
  name: string;
  description: string;
  totalMarks: number;
  durationMinutes: number;
  negativeMarking: boolean;
  negativeMarkingPenalty?: number; // e.g., 0.25 or 1 for certain tests
  negativeMarksPerQuestion?: number; // Alias for negativeMarkingPenalty
  passingPercentage: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * Association table interface allowing subjects (Physics, Chemistry, English)
 * to be shared across multiple exams with exam-specific question count/weights.
 */
export interface ExamSubjectMapping {
  id: string;
  examId: string;
  subjectId: string;
  weightPercentage: number;
  questionCount: number;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Subject entity (Physics, Chemistry, English, Mathematics, Biology, etc.)
 * Shared across exams without hard-coded exam logic.
 */
export interface Subject {
  id: string;
  code: string; // e.g., 'PHY', 'CHEM', 'ENG', 'MATH', 'BIO'
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  createdAt: string;
}

/**
 * Chapter entity under a Subject (e.g. 'Vectors & Equilibrium', 'Electrostatics')
 */
export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  code: string;
  sequenceOrder: number;
  description?: string;
  createdAt: string;
}

/**
 * Topic entity within a Chapter
 */
export interface Topic {
  id: string;
  chapterId: string;
  subjectId: string;
  name: string;
  code: string;
  sequenceOrder: number;
  estimatedStudyMinutes: number;
  importanceRating: number; // 1-5 scale for high-yield exam weight
  isHighYield?: boolean;
  createdAt: string;
}

/**
 * Subtopic for granular diagnostic evaluation
 */
export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  sequenceOrder: number;
  createdAt: string;
}

/**
 * Bloom Taxonomy Cognitive Levels
 */
export type BloomTaxonomyLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

/**
 * Fine-grained Learning Objective
 */
export interface LearningObjective {
  id: string;
  topicId: string;
  subtopicId?: string;
  statement: string;
  description?: string; // Alias for statement
  bloomTaxonomyLevel?: BloomTaxonomyLevel;
  cognitiveLevel?: BloomTaxonomyLevel; // Alias for bloomTaxonomyLevel
  createdAt: string;
}

/**
 * Pedagogical Skill (e.g., 'Formula Application', 'Dimensional Analysis', 'Graph Interpretation')
 */
export interface Skill {
  id: string;
  subjectId: string;
  code: string;
  name: string;
  title?: string; // Alias for name
  description?: string;
  createdAt: string;
}

/**
 * Reusable Learning Unit model for every topic
 */
export interface LearningUnit {
  id: string;
  topicId: string;
  title: string;
  summary: string;
  keyConcepts: string[];
  keyFormulas: string[];
  commonPitfalls: string[];
  estimatedMinutes: number;
  recommendedPracticeQuestionIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Question Model (MCQs for ECAT / MDCAT)
 */
export interface QuestionOption {
  id: string;
  text: string;
  optionKey?: string; // 'A', 'B', 'C', 'D' or option id
  optionText?: string; // Alias for text
  isCorrect: boolean;
  explanation?: string;
  displayOrder?: number;
}

export interface Question {
  id: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  subtopicId?: string;
  skillId?: string;
  learningObjectiveId?: string;
  type: QuestionType;
  questionType?: QuestionType; // Alias for type
  difficulty: DifficultyLevel;
  content: string; // Question statement with LaTeX/Markdown support
  questionText?: string; // Alias for content
  options: QuestionOption[];
  correctOptionId: string;
  correctAnswer?: string; // Alias for correctOptionId
  comprehensiveExplanation: string;
  explanation?: string; // Alias for comprehensiveExplanation
  tipOrShortcut?: string;
  applicableExams: ExamType[]; // Can be ['ECAT', 'MDCAT'] or exam-specific
  pastPaperSource?: string; // e.g. 'ECAT 2022', 'UHS MDCAT 2021'
  source?: string; // Alias for pastPaperSource
  status?: QuestionStatus; // draft, review, approved, archived (defaults to approved)
  estimatedTimeSeconds?: number; // Estimated time in seconds (e.g., 90)
  estimatedTime?: number; // Alias for estimatedTimeSeconds
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Question Attempt record for student tracking & telemetry
 */
export interface QuestionAttempt {
  id: string;
  studentId: string;
  questionId: string;
  question?: Question;
  selectedOptionId?: string;
  selectedAnswer?: string; // Alias for selectedOptionId
  isCorrect: boolean;
  correctness?: boolean; // Alias for isCorrect
  timeSpentSeconds: number;
  timeTaken?: number; // Alias for timeSpentSeconds
  confidence?: ConfidenceLevel; // 'low' | 'medium' | 'high'
  sourceContext: 'diagnostic' | 'practice' | 'mock_exam' | 'learning_unit';
  contextId?: string; // e.g. diagnosticAttemptId or mockAttemptId
  notes?: string;
  clientToken?: string; // For idempotency and accidental duplicate prevention
  attemptedAt: string;
  attemptTimestamp?: string; // Alias for attemptedAt
}

/**
 * Input for recording a question attempt
 */
export interface CreateQuestionAttemptInput {
  studentId: string;
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  confidence?: ConfidenceLevel;
  sourceContext?: 'diagnostic' | 'practice' | 'mock_exam' | 'learning_unit';
  contextId?: string;
  notes?: string;
  clientToken?: string;
}

/**
 * Input for submitting an answer to the Question Engine
 */
export interface SubmitAnswerInput {
  studentId: string;
  questionId: string;
  selectedOptionId: string;
  timeSpentSeconds: number;
  confidence?: ConfidenceLevel;
  sourceContext?: 'diagnostic' | 'practice' | 'mock_exam' | 'learning_unit';
  contextId?: string;
  clientToken?: string; // Idempotency token to prevent accidental duplicate submission
}

/**
 * Result returned after submitting an answer
 */
export interface SubmitAnswerResult {
  attemptId: string;
  questionId: string;
  studentId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string;
  tipOrShortcut?: string;
  timeSpentSeconds: number;
  confidence?: ConfidenceLevel;
  attemptedAt: string;
  isDuplicate: boolean; // True if an attempt with this clientToken already existed
}

/**
 * Query options for filtering questions
 */
export interface QuestionQueryOptions {
  difficulty?: DifficultyLevel;
  skillId?: string;
  topicId?: string;
  examType?: ExamType;
  status?: QuestionStatus;
  limit?: number;
  offset?: number;
}

export type {
  TopicClassification,
  DiagnosticScoringConfig,
  DiagnosticSubjectQuota,
  DiagnosticTestConfiguration,
  DiagnosticTest,
  CreateDiagnosticTestInput,
  DiagnosticAnswer,
  TopicPerformance,
  SubjectPerformance,
  DifficultyPerformance,
  TimePerformance,
  ConfidencePerformance,
  RecommendedNextStep,
  DiagnosticAttempt,
} from './diagnostic';
export { DEFAULT_DIAGNOSTIC_SCORING_CONFIG } from './diagnostic';

// Backward compatibility alias: Diagnostic is DiagnosticTest
export type Diagnostic = import('./diagnostic').DiagnosticTest;

export type {
  TopicMasteryStatus,
  TopicMasteryHistoryEntry,
  MasteryScoringConfig,
  MasteryScoreComponents,
  TopicMastery,
  TopicAttemptEvidence,
  StudentMasteryFilterOptions,
  StudentMasterySummary,
} from './mastery';
export { DEFAULT_MASTERY_SCORING_CONFIG } from './mastery';

/**
 * Personalized Study Plan generated after diagnostic / updated continuously
 */
export interface StudyPlan {
  id: string;
  studentId: string;
  examId: string;
  title: string;
  goalExamDate?: string;
  totalEstimatedHours: number;
  status: 'active' | 'completed' | 'archived';
  overallProgressPercentage?: number;
  coachingMessage?: string;
  dailyAvailableMinutes?: number;
  targetExam?: ExamType;
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual task or unit in a student's Study Plan
 */
export interface StudyPlanItem {
  id: string;
  studyPlanId: string;
  studentId: string;
  topicId: string;
  learningUnitId?: string;
  priorityOrder: number;
  status: StudyPlanItemStatus;
  targetDate?: string;
  completedAt?: string;
  priorityReason: string; // e.g., 'Identified as critical weakness in Diagnostic (25% accuracy)'
  estimatedMinutes: number;
}

/**
 * AI Tutor Interactive Session
 */
export interface TutorMessage {
  id: string;
  role: TutorRole;
  content: string;
  mode?: 'simple' | 'step_by_step' | 'analogy' | 'exam_focused' | 'hint';
  verificationQuestion?: {
    question: string;
    conceptTested: string;
    suggestedAnswerOrHint: string;
  };
  followUpQuestions?: string[];
  suggestedAction?: 'try_question' | 'review_formula' | 'proceed_next';
  contextQuestionId?: string;
  timestamp: string;
}

export interface TutorSession {
  id: string;
  studentId: string;
  topicId: string;
  topicName?: string;
  subjectName?: string;
  chapterName?: string;
  examType?: ExamType;
  questionId?: string;
  questionStatement?: string;
  title?: string;
  messages: TutorMessage[];
  summary?: string;
  status?: 'active' | 'ended';
  createdAt: string;
  updatedAt: string;
}

export type { MockExam, MockAttempt } from './mock-exam';

/**
 * Detailed Topic Representation with full curriculum drilldown
 */
export interface TopicDetail extends Topic {
  chapterName: string;
  subjectName: string;
  subjectCode: string;
  subtopics: Subtopic[];
  learningObjectives: LearningObjective[];
  skills: Skill[];
  applicableExams: ExamType[];
  examWeights: Record<string, { weightPercentage: number; questionCount: number }>;
  learningUnit?: LearningUnit | null;
  questionCount: number;
}

/**
 * Subtopic with associated Learning Objectives
 */
export interface SubtopicHierarchy extends Subtopic {
  learningObjectives: LearningObjective[];
}

/**
 * Topic node in the full data-driven hierarchy
 */
export interface TopicHierarchy extends Topic {
  subtopics: SubtopicHierarchy[];
  learningObjectives: LearningObjective[];
  skills: Skill[];
  hasLearningUnit: boolean;
  questionCount: number;
}

/**
 * Chapter node in the full data-driven hierarchy
 */
export interface ChapterHierarchy extends Chapter {
  topics: TopicHierarchy[];
}

/**
 * Subject node in the full data-driven hierarchy with exam-specific and shared metadata
 */
export interface SubjectHierarchy extends Subject {
  weightPercentage: number;
  questionCount: number;
  isShared: boolean;
  allExams: ExamType[];
  chapters: ChapterHierarchy[];
}

/**
 * Root Exam Curriculum Hierarchy representing:
 * Exam → Subject → Chapter → Topic → Subtopic → Learning Objective → Skill
 */
export interface ExamCurriculumHierarchy {
  exam: Exam;
  totalQuestions: number;
  totalChapters: number;
  totalTopics: number;
  totalSubtopics: number;
  totalLearningObjectives: number;
  totalSkills: number;
  subjects: SubjectHierarchy[];
}

export * from './personalization';

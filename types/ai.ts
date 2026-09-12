import type { ExamType, DifficultyLevel, TutorMessage } from './domain';

/**
 * AI Service Request/Response Contracts
 */

export interface AiWeaknessAnalysisRequest {
  examType: ExamType;
  studentName: string;
  totalScore: number;
  maxScore: number;
  subjectScores: Record<string, {
    subjectName: string;
    score: number;
    maxScore: number;
    accuracyPercentage: number;
  }>;
  topicBreakdown: Array<{
    topicName: string;
    subjectName: string;
    attempted: number;
    correct: number;
    accuracyPercentage: number;
  }>;
}

export interface AiWeaknessAnalysisResult {
  overallAssessment: string;
  criticalWeaknesses: Array<{
    topicName: string;
    subjectName: string;
    gapAnalysis: string;
    recommendedAction: string;
    priority: 1 | 2 | 3;
  }>;
  strengths: string[];
  estimatedScorePotential: {
    current: number;
    potentialWithPlan: number;
  };
  coachNote: string;
}

export interface AiStudyPlanRequest {
  examType: ExamType;
  targetExamDate?: string;
  targetScore?: number;
  weeklyAvailableHours: number;
  criticalWeaknesses: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
  }>;
}

export interface AiStudyPlanResult {
  planTitle: string;
  overviewSummary: string;
  totalWeeks: number;
  items: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
    priorityOrder: number;
    estimatedHours: number;
    suggestedFocus: string;
    reason: string;
  }>;
}

export type ExplanationMode =
  | 'simple'
  | 'step_by_step'
  | 'analogy'
  | 'exam_focused'
  | 'hint';

export interface TutorContextPayload {
  examType: ExamType;
  subjectId?: string;
  subjectName: string;
  chapterId?: string;
  chapterName?: string;
  topicId: string;
  topicName: string;
  learningObjectives?: string[];
  skills?: string[];
  keyConcepts?: string[];
  keyFormulas?: string[];
  commonPitfalls?: string[];
  relevantContent?: string;
  studentMasteryScore?: number;
  studentMasteryStatus?: string;
  currentQuestion?: {
    id?: string;
    statement: string;
    options: Array<{ id: string; text: string; isCorrect?: boolean }>;
    selectedOptionId?: string;
    selectedOptionText?: string;
    correctOptionId?: string;
    correctOptionText?: string;
    isCorrect?: boolean;
    explanation?: string;
    difficulty?: DifficultyLevel;
  };
}

export interface VerificationQuestion {
  question: string;
  conceptTested: string;
  suggestedAnswerOrHint: string;
}

export interface AiTutorChatRequest {
  studentId?: string;
  studentQuery: string;
  mode?: ExplanationMode;
  context: TutorContextPayload;
  conversationHistory: TutorMessage[];
  quickAction?: 'explain_simply' | 'give_hint' | 'show_example' | 'test_me';
  // Legacy / convenience fields
  examType?: ExamType;
  topicName?: string;
  subjectName?: string;
  currentQuestion?: {
    statement: string;
    options: string[];
    selectedOption?: string;
    correctOption?: string;
    explanation?: string;
  };
  pedagogicalStyle?: 'socratic' | 'direct_explanation' | 'formula_breakdown';
}

export interface AiTutorChatResponse {
  message: string;
  modeUsed: ExplanationMode;
  conceptIdentified: string;
  analogyUsed?: string;
  hint?: string;
  verificationQuestion?: VerificationQuestion;
  followUpQuestions?: string[];
  suggestedAction?: 'try_question' | 'review_formula' | 'proceed_next';
  suggestedFormulaOrFact?: string;
  encouragementNote?: string;
}

export type TutorSessionMessage = TutorMessage;

export interface AiQuestionExplanationRequest {
  examType: ExamType;
  questionContent: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  studentSelectedOptionId?: string;
  studentNotes?: string;
}

export interface AiQuestionExplanationResult {
  isCorrect: boolean;
  stepByStepSolution: string[];
  commonMisconception: string;
  examShortcutOrTip: string;
  coreConcept: string;
}

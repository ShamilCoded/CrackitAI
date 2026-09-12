import type { ExamType, DifficultyLevel } from './domain';

export interface ExamSubjectConfig {
  id: string;
  code: string;
  name: string;
  weightPercentage: number;
  questionCount: number;
  icon: string;
  color: string;
  isShared: boolean;
  description: string;
  subjectId?: string;
  subjectName?: string;
}

export interface ExamScoringConfig {
  correctMark: number;
  negativeMarking: boolean;
  negativeMarkingPenalty: number;
  totalMarks: number;
  passingPercentage: number;
  passingMarks: number;
}

export interface ExamDiagnosticSubjectBreakdown {
  subjectId: string;
  subjectName: string;
  questionCount: number;
}

export interface ExamDiagnosticConfig {
  defaultTestId: string;
  name: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  correctMark: number;
  negativeMarking: boolean;
  negativeMarkingPenalty: number;
  maxScore: number;
  passingPercentage: number;
  strongThreshold: number;
  developingThreshold: number;
  minAttemptsForClassification: number;
  subjectDistribution: ExamDiagnosticSubjectBreakdown[];
}

export interface ExamDifficultyDistribution {
  easy: number; // percentage
  medium: number; // percentage
  hard: number; // percentage
  exam_level: number; // percentage
}

export interface ExamAppConfig {
  code: ExamType;
  id: string;
  name: string;
  shortName: string;
  fullName: string;
  authority: string;
  description: string;
  totalMarks?: number;
  durationMinutes: number;
  totalQuestions: number;
  targetScoreDefault: number;
  baselineScoreDefault: number;
  subjects: ExamSubjectConfig[];
  subjectIds: string[];
  scoring: ExamScoringConfig;
  diagnostic: ExamDiagnosticConfig;
  difficultyDistribution: ExamDifficultyDistribution;
}

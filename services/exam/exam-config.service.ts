import type { ExamType, ExamAppConfig } from '@/types';

/**
 * Centralized Application-Level Configuration for ECAT
 */
export const ECAT_CONFIG: ExamAppConfig = {
  code: 'ECAT',
  id: 'exam-ecat',
  name: 'Engineering College Admission Test (UET ECAT)',
  shortName: 'UET ECAT',
  fullName: 'UET Engineering College Admission Test',
  authority: 'University of Engineering and Technology (UET) Lahore',
  description:
    'Standardized entrance test conducted by UET Lahore for admission into engineering and technology degree programs across Punjab.',
  totalMarks: 400,
  totalQuestions: 100,
  durationMinutes: 100,
  targetScoreDefault: 360,
  baselineScoreDefault: 240,
  subjects: [
    {
      id: 'subj-mathematics',
      code: 'MATH',
      name: 'Mathematics',
      weightPercentage: 30.0,
      questionCount: 30,
      icon: 'Binary',
      color: '#f59e0b',
      isShared: false,
      description: 'Calculus, Analytic Geometry, Trigonometry, Vectors, and Algebra (ECAT core).',
    },
    {
      id: 'subj-physics',
      code: 'PHY',
      name: 'Physics',
      weightPercentage: 30.0,
      questionCount: 30,
      icon: 'Atom',
      color: '#3b82f6',
      isShared: true,
      description: 'Mechanics, Electromagnetism, Modern Physics, and Thermal Dynamics.',
    },
    {
      id: 'subj-chemistry',
      code: 'CHEM',
      name: 'Chemistry',
      weightPercentage: 30.0,
      questionCount: 30,
      icon: 'FlaskConical',
      color: '#10b981',
      isShared: true,
      description: 'Physical, Inorganic, and Organic Chemistry with emphasis on reaction mechanisms.',
    },
    {
      id: 'subj-english',
      code: 'ENG',
      name: 'English',
      weightPercentage: 10.0,
      questionCount: 10,
      icon: 'BookOpen',
      color: '#8b5cf6',
      isShared: true,
      description: 'Grammar, Syntax, Vocabulary, Sentence Completion, and Reading Comprehension.',
    },
  ],
  subjectIds: ['subj-mathematics', 'subj-physics', 'subj-chemistry', 'subj-english'],
  scoring: {
    correctMark: 4,
    negativeMarking: true,
    negativeMarkingPenalty: 1.0,
    totalMarks: 400,
    passingPercentage: 33,
    passingMarks: 132,
  },
  diagnostic: {
    defaultTestId: 'diag-ecat-prelim',
    name: 'ECAT Baseline Adaptive Diagnostic (30 MCQs)',
    totalQuestions: 30,
    timeLimitMinutes: 45,
    correctMark: 4,
    negativeMarking: true,
    negativeMarkingPenalty: 1.0,
    maxScore: 120,
    passingPercentage: 33,
    strongThreshold: 75,
    developingThreshold: 50,
    minAttemptsForClassification: 1,
    subjectDistribution: [
      { subjectId: 'subj-mathematics', subjectName: 'Mathematics', questionCount: 10 },
      { subjectId: 'subj-physics', subjectName: 'Physics', questionCount: 10 },
      { subjectId: 'subj-chemistry', subjectName: 'Chemistry', questionCount: 7 },
      { subjectId: 'subj-english', subjectName: 'English', questionCount: 3 },
    ],
  },
  difficultyDistribution: {
    easy: 30,
    medium: 50,
    hard: 15,
    exam_level: 5,
  },
};

/**
 * Centralized Application-Level Configuration for MDCAT
 */
export const MDCAT_CONFIG: ExamAppConfig = {
  code: 'MDCAT',
  id: 'exam-mdcat',
  name: 'Medical & Dental College Admission Test (PMDC MDCAT)',
  shortName: 'PMDC MDCAT',
  fullName: 'PMDC Medical & Dental College Admission Test',
  authority: 'Pakistan Medical & Dental Council (PMDC)',
  description:
    'Standardized entrance exam conducted by PMDC for admission into public and private medical (MBBS) and dental (BDS) colleges across Pakistan.',
  totalMarks: 200,
  totalQuestions: 200,
  durationMinutes: 210,
  targetScoreDefault: 180,
  baselineScoreDefault: 120,
  subjects: [
    {
      id: 'subj-biology',
      code: 'BIO',
      name: 'Biology',
      weightPercentage: 34.0,
      questionCount: 68,
      icon: 'Dna',
      color: '#ec4899',
      isShared: false,
      description: 'Cell Biology, Genetics, Human Physiology, Biotechnology, and Evolution (MDCAT core).',
    },
    {
      id: 'subj-chemistry',
      code: 'CHEM',
      name: 'Chemistry',
      weightPercentage: 27.0,
      questionCount: 54,
      icon: 'FlaskConical',
      color: '#10b981',
      isShared: true,
      description: 'Physical, Inorganic, and Organic Chemistry with emphasis on reaction mechanisms.',
    },
    {
      id: 'subj-physics',
      code: 'PHY',
      name: 'Physics',
      weightPercentage: 27.0,
      questionCount: 54,
      icon: 'Atom',
      color: '#3b82f6',
      isShared: true,
      description: 'Mechanics, Electromagnetism, Modern Physics, and Thermal Dynamics.',
    },
    {
      id: 'subj-english',
      code: 'ENG',
      name: 'English',
      weightPercentage: 9.0,
      questionCount: 18,
      icon: 'BookOpen',
      color: '#8b5cf6',
      isShared: true,
      description: 'Grammar, Syntax, Vocabulary, Sentence Completion, and Reading Comprehension.',
    },
    {
      id: 'subj-logical-reasoning',
      code: 'LOGIC',
      name: 'Logical Reasoning',
      weightPercentage: 3.0,
      questionCount: 6,
      icon: 'BrainCircuit',
      color: '#06b6d4',
      isShared: false,
      description: 'Critical thinking, deduction, symbolic reasoning, and analytical logic (MDCAT).',
    },
  ],
  subjectIds: [
    'subj-biology',
    'subj-chemistry',
    'subj-physics',
    'subj-english',
    'subj-logical-reasoning',
  ],
  scoring: {
    correctMark: 1,
    negativeMarking: false,
    negativeMarkingPenalty: 0.0,
    totalMarks: 200,
    passingPercentage: 55,
    passingMarks: 110,
  },
  diagnostic: {
    defaultTestId: 'diag-mdcat-prelim',
    name: 'MDCAT Baseline Adaptive Diagnostic (30 MCQs)',
    totalQuestions: 30,
    timeLimitMinutes: 45,
    correctMark: 1,
    negativeMarking: false,
    negativeMarkingPenalty: 0.0,
    maxScore: 30,
    passingPercentage: 55,
    strongThreshold: 75,
    developingThreshold: 50,
    minAttemptsForClassification: 1,
    subjectDistribution: [
      { subjectId: 'subj-biology', subjectName: 'Biology', questionCount: 12 },
      { subjectId: 'subj-chemistry', subjectName: 'Chemistry', questionCount: 9 },
      { subjectId: 'subj-physics', subjectName: 'Physics', questionCount: 6 },
      { subjectId: 'subj-english', subjectName: 'English', questionCount: 3 },
    ],
  },
  difficultyDistribution: {
    easy: 30,
    medium: 50,
    hard: 15,
    exam_level: 5,
  },
};

/**
 * Registry of all available Exam configurations
 */
export const EXAM_CONFIGS: Record<ExamType, ExamAppConfig> = {
  ECAT: ECAT_CONFIG,
  MDCAT: MDCAT_CONFIG,
};

export class ExamConfigService {
  /**
   * Get the complete configuration for an exam
   */
  public getConfig(exam: ExamType): ExamAppConfig {
    return EXAM_CONFIGS[exam] || ECAT_CONFIG;
  }

  /**
   * Check if a subject ID is valid for the given exam
   */
  public isSubjectAllowed(subjectId: string, exam: ExamType): boolean {
    const config = this.getConfig(exam);
    return config.subjectIds.includes(subjectId);
  }

  /**
   * Get all allowed subject IDs for an exam
   */
  public getAllowedSubjectIds(exam: ExamType): string[] {
    return this.getConfig(exam).subjectIds;
  }

  /**
   * Get all allowed subject descriptors for an exam
   */
  public getAllowedSubjects(exam: ExamType) {
    return this.getConfig(exam).subjects.map((s) => ({
      subjectId: s.id,
      id: s.id,
      name: s.name,
      code: s.code,
      weightPercentage: s.weightPercentage,
    }));
  }

  /**
   * Get subject configuration by subject ID and exam
   */
  public getSubjectConfig(subjectId: string, exam: ExamType) {
    const config = this.getConfig(exam);
    return config.subjects.find((s) => s.id === subjectId);
  }

  /**
   * Get default scoring parameters for an exam
   */
  public getScoringConfig(exam: ExamType) {
    return this.getConfig(exam).scoring;
  }

  /**
   * Get diagnostic parameters for an exam
   */
  public getDiagnosticConfig(exam: ExamType) {
    return this.getConfig(exam).diagnostic;
  }
}

export const examConfigService = new ExamConfigService();

/**
 * Functional shorthand helper
 */
export function getExamConfig(exam: ExamType): ExamAppConfig {
  return examConfigService.getConfig(exam);
}

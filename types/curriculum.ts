import type { ExamType, Subject, Chapter, Topic, Skill, DifficultyLevel } from './domain';

/**
 * Syllabus configuration per Exam.
 * Allows subjects to be shared across ECAT and MDCAT with independent weighting and questions.
 */
export interface ExamSyllabusConfig {
  examCode: ExamType;
  examName: string;
  totalQuestions: number;
  durationMinutes: number;
  markingScheme: {
    correctMark: number;
    negativeMark: number;
    unattemptedMark: number;
  };
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    questionCount: number;
    weightPercentage: number;
    isSharedAcrossExams: boolean;
  }>;
}

/**
 * Hierarchical Curriculum Tree used by navigation and progress tracking
 */
export interface CurriculumTreeTopic extends Topic {
  skills: Skill[];
  hasLearningUnit: boolean;
  questionCount: number;
}

export interface CurriculumTreeChapter extends Chapter {
  topics: CurriculumTreeTopic[];
}

export interface CurriculumTreeSubject extends Subject {
  chapters: CurriculumTreeChapter[];
  applicableExams: ExamType[];
}

/**
 * Filter criteria for selecting questions dynamically from the question bank
 */
export interface QuestionFilterCriteria {
  examType?: ExamType;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  skillId?: string;
  difficulty?: DifficultyLevel;
  excludeQuestionIds?: string[];
  limit?: number;
}

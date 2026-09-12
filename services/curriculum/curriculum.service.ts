import type {
  Exam,
  Subject,
  Chapter,
  Topic,
  Subtopic,
  LearningObjective,
  Skill,
  LearningUnit,
  Question,
  ExamType,
  ExamSyllabusConfig,
  CurriculumTreeSubject,
  QuestionFilterCriteria,
  TopicDetail,
  ExamCurriculumHierarchy,
  SubjectHierarchy,
  ChapterHierarchy,
  TopicHierarchy,
  SubtopicHierarchy,
} from '@/types';
import {
  SEED_EXAMS,
  SEED_SUBJECTS,
  SEED_EXAM_SUBJECT_MAPPINGS,
  SEED_CHAPTERS,
  SEED_TOPICS,
  SEED_SUBTOPICS,
  SEED_LEARNING_OBJECTIVES,
  SEED_SKILLS,
  SEED_LEARNING_UNITS,
  SEED_QUESTIONS,
} from '@/database/seed-data';
import { createClient } from '@/lib/supabase/client';
import { examConfigService } from '@/services/exam/exam-config.service';

/**
 * Data-driven Curriculum Service.
 * Implements the full hierarchy:
 * Exam → Subject → Chapter → Topic → Subtopic → Learning Objective → Skill
 *
 * Ensures subjects (Physics, Chemistry, English) can be shared across ECAT and MDCAT seamlessly.
 * Separates curriculum business logic from presentation components.
 * Supports both asynchronous Supabase fetching (with fallback) and synchronous instant rendering.
 */
class CurriculumService {
  private isSupabaseConfigured(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    );
  }

  /**
   * Get all registered exams
   */
  async getExams(): Promise<Exam[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (!error && data && data.length > 0) {
          return (data as any[]).map((e) => ({
            id: e.id,
            code: e.code as ExamType,
            name: e.name,
            description: e.description || '',
            totalMarks: e.total_marks ?? 100,
            durationMinutes: e.duration_minutes,
            negativeMarking: e.negative_marking,
            negativeMarkingPenalty: e.negative_marking_penalty,
            passingPercentage: e.passing_percentage,
            isActive: e.is_active,
            createdAt: e.created_at,
          }));
        }
      } catch (err) {
        console.warn('Falling back to seed exams:', err);
      }
    }
    return this.getExamsSync();
  }

  getExamsSync(): Exam[] {
    return SEED_EXAMS;
  }

  /**
   * Get exam by code (ECAT or MDCAT)
   */
  async getExamByCode(code: ExamType): Promise<Exam | undefined> {
    const exams = await this.getExams();
    return exams.find((e) => e.code === code);
  }

  getExamByCodeSync(code: ExamType): Exam | undefined {
    return SEED_EXAMS.find((e) => e.code === code);
  }

  /**
   * Get subjects configured for a specific exam
   * Physics, Chemistry, English are shared across ECAT and MDCAT
   */
  async getSubjectsForExam(examCode: ExamType): Promise<Subject[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: examData } = await supabase
          .from('exams')
          .select('id')
          .eq('code', examCode)
          .single();

        if (examData) {
          const { data, error } = await supabase
            .from('exam_subjects')
            .select(`
              subject_id,
              display_order,
              subjects (*)
            `)
            .eq('exam_id', (examData as any).id)
            .eq('is_active', true)
            .order('display_order');

          if (!error && data && data.length > 0) {
            return data
              .filter((item) => (item as any).subjects)
              .map((item) => {
                const s = (item as any).subjects;
                return {
                  id: s.id,
                  code: s.code,
                  name: s.name,
                  icon: s.icon,
                  color: s.color,
                  description: s.description || '',
                  createdAt: s.created_at,
                };
              });
          }
        }
      } catch (err) {
        console.warn('Falling back to seed subjects:', err);
      }
    }
    return this.getSubjectsForExamSync(examCode);
  }

  getSubjectsForExamSync(examCode: ExamType): Subject[] {
    const exam = this.getExamByCodeSync(examCode);
    if (!exam) return [];

    const mappings = SEED_EXAM_SUBJECT_MAPPINGS.filter(
      (m) => m.examId === exam.id && m.isActive
    ).sort((a, b) => a.displayOrder - b.displayOrder);

    const subjectIds = new Set(mappings.map((m) => m.subjectId));
    return SEED_SUBJECTS.filter((s) => subjectIds.has(s.id));
  }

  isSubjectAllowedForExam(subjectId: string, examCode: ExamType): boolean {
    return examConfigService.isSubjectAllowed(subjectId, examCode);
  }

  getTopicsForExamSync(examCode: ExamType): Topic[] {
    const subjects = this.getSubjectsForExamSync(examCode);
    const subjectIds = new Set(subjects.map((s) => s.id));
    return SEED_TOPICS.filter((t) => subjectIds.has(t.subjectId));
  }

  getChaptersForExamSync(examCode: ExamType): Chapter[] {
    const subjects = this.getSubjectsForExamSync(examCode);
    const subjectIds = new Set(subjects.map((s) => s.id));
    return SEED_CHAPTERS.filter((c) => subjectIds.has(c.subjectId));
  }

  getSubjectByIdSync(subjectId: string): Subject | undefined {
    return SEED_SUBJECTS.find((s) => s.id === subjectId);
  }

  /**
   * Get chapters for a subject
   */
  async getChapters(subjectId: string): Promise<Chapter[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('subject_id', subjectId)
          .order('sequence_order');

        if (!error && data && data.length > 0) {
          return (data as any[]).map((c) => ({
            id: c.id,
            subjectId: c.subject_id,
            name: c.name,
            code: c.code,
            sequenceOrder: c.sequence_order,
            description: c.description || undefined,
            createdAt: c.created_at,
          }));
        }
      } catch (err) {
        console.warn('Falling back to seed chapters:', err);
      }
    }
    return this.getChaptersSync(subjectId);
  }

  getChaptersSync(subjectId: string): Chapter[] {
    return SEED_CHAPTERS.filter((c) => c.subjectId === subjectId).sort(
      (a, b) => a.sequenceOrder - b.sequenceOrder
    );
  }

  getChapterByIdSync(chapterId: string): Chapter | undefined {
    return SEED_CHAPTERS.find((c) => c.id === chapterId);
  }

  // Alias for backward compatibility
  async getChaptersBySubject(subjectId: string): Promise<Chapter[]> {
    return this.getChapters(subjectId);
  }

  /**
   * Get topics for a chapter
   */
  async getTopics(chapterId: string): Promise<Topic[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('chapter_id', chapterId)
          .order('sequence_order');

        if (!error && data && data.length > 0) {
          return (data as any[]).map((t) => ({
            id: t.id,
            chapterId: t.chapter_id,
            subjectId: t.subject_id,
            name: t.name,
            code: t.code,
            sequenceOrder: t.sequence_order,
            estimatedStudyMinutes: t.estimated_study_minutes,
            importanceRating: t.importance_rating,
            createdAt: t.created_at,
          }));
        }
      } catch (err) {
        console.warn('Falling back to seed topics:', err);
      }
    }
    return this.getTopicsSync(chapterId);
  }

  getTopicsSync(chapterId: string): Topic[] {
    return SEED_TOPICS.filter((t) => t.chapterId === chapterId).sort(
      (a, b) => a.sequenceOrder - b.sequenceOrder
    );
  }

  // Alias for backward compatibility
  async getTopicsByChapter(chapterId: string): Promise<Topic[]> {
    return this.getTopics(chapterId);
  }

  /**
   * Get topic by ID
   */
  async getTopicById(topicId: string): Promise<Topic | undefined> {
    return this.getTopicByIdSync(topicId);
  }

  getTopicByIdSync(topicId: string): Topic | undefined {
    return SEED_TOPICS.find((t) => t.id === topicId);
  }

  /**
   * Get all registered topics synchronously
   */
  getAllTopics(): Topic[] {
    return [...SEED_TOPICS];
  }

  getAllTopicsSync(): Topic[] {
    return [...SEED_TOPICS];
  }

  /**
   * Get all topics belonging to a subject synchronously
   */
  getTopicsForSubject(subjectId: string): Topic[] {
    return SEED_TOPICS.filter((t) => t.subjectId === subjectId);
  }

  /**
   * Get all skills across the curriculum synchronously
   */
  getAllSkills(): Skill[] {
    return [...SEED_SKILLS];
  }

  /**
   * Get skills for a specific topic's subject
   */
  getSkillsForTopic(topicId: string): Skill[] {
    const topic = SEED_TOPICS.find((t) => t.id === topicId);
    if (!topic) return [];
    return SEED_SKILLS.filter((s) => s.subjectId === topic.subjectId);
  }

  /**
   * Get skills for a subject synchronously
   */
  getSkillsForSubject(subjectId: string): Skill[] {
    return SEED_SKILLS.filter((s) => s.subjectId === subjectId);
  }

  /**
   * Get subtopics for a topic
   */
  async getSubtopics(topicId: string): Promise<Subtopic[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('subtopics')
          .select('*')
          .eq('topic_id', topicId)
          .order('sequence_order');

        if (!error && data && data.length > 0) {
          return (data as any[]).map((st) => ({
            id: st.id,
            topicId: st.topic_id,
            name: st.name,
            sequenceOrder: st.sequence_order,
            createdAt: st.created_at,
          }));
        }
      } catch (err) {
        console.warn('Falling back to seed subtopics:', err);
      }
    }
    return this.getSubtopicsSync(topicId);
  }

  getSubtopicsSync(topicId: string): Subtopic[] {
    return SEED_SUBTOPICS.filter((st) => st.topicId === topicId).sort(
      (a, b) => a.sequenceOrder - b.sequenceOrder
    );
  }

  /**
   * Get fine-grained learning objectives for a topic (optionally narrowed by subtopic)
   */
  async getLearningObjectives(topicId: string, subtopicId?: string): Promise<LearningObjective[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase
          .from('learning_objectives')
          .select('*')
          .eq('topic_id', topicId);

        if (subtopicId) {
          query = query.eq('subtopic_id', subtopicId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return (data as any[]).map((lo) => ({
            id: lo.id,
            topicId: lo.topic_id,
            subtopicId: lo.subtopic_id || undefined,
            statement: lo.statement,
            bloomTaxonomyLevel: lo.bloom_taxonomy_level as any,
            createdAt: lo.created_at,
          }));
        }
      } catch (err) {
        console.warn('Falling back to seed learning objectives:', err);
      }
    }
    return this.getLearningObjectivesSync(topicId, subtopicId);
  }

  getLearningObjectivesSync(topicId: string, subtopicId?: string): LearningObjective[] {
    return SEED_LEARNING_OBJECTIVES.filter((lo) => {
      if (lo.topicId !== topicId) return false;
      if (subtopicId && lo.subtopicId !== subtopicId) return false;
      return true;
    });
  }

  /**
   * Get pedagogical skills for a subject (and optionally specific topic)
   */
  async getSkills(subjectId: string, topicId?: string): Promise<Skill[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('skills')
          .select('*')
          .eq('subject_id', subjectId)
          .order('code');

        if (!error && data && data.length > 0) {
          return (data as any[]).map((sk) => ({
            id: sk.id,
            subjectId: sk.subject_id,
            code: sk.code,
            name: sk.name,
            description: sk.description || undefined,
            createdAt: sk.created_at,
          }));
        }
      } catch (err) {
        console.warn('Falling back to seed skills:', err);
      }
    }
    return this.getSkillsSync(subjectId, topicId);
  }

  getSkillsSync(subjectId: string, _topicId?: string): Skill[] {
    return SEED_SKILLS.filter((sk) => sk.subjectId === subjectId);
  }

  /**
   * Get comprehensive Topic Details with all child entities:
   * Subtopics, Learning Objectives, Pedagogical Skills, Applicable Exams, Weights, and Learning Unit.
   */
  async getTopicDetails(topicId: string): Promise<TopicDetail | null> {
    return this.getTopicDetailsSync(topicId);
  }

  getTopicDetailsSync(topicId: string): TopicDetail | null {
    const topic = SEED_TOPICS.find((t) => t.id === topicId);
    if (!topic) return null;

    const chapter = SEED_CHAPTERS.find((c) => c.id === topic.chapterId);
    const subject = SEED_SUBJECTS.find((s) => s.id === topic.subjectId);

    const subtopics = this.getSubtopicsSync(topicId);
    const learningObjectives = this.getLearningObjectivesSync(topicId);
    const skills = this.getSkillsSync(topic.subjectId, topicId);
    const learningUnit = this.getLearningUnitByTopicId(topicId);
    const questions = this.getQuestionsForTopic(topicId);

    // Determine applicable exams and exam weights based on subject mappings
    const mappings = SEED_EXAM_SUBJECT_MAPPINGS.filter((m) => m.subjectId === topic.subjectId && m.isActive);
    const applicableExams: ExamType[] = [];
    const examWeights: Record<string, { weightPercentage: number; questionCount: number }> = {};

    for (const m of mappings) {
      const exam = SEED_EXAMS.find((e) => e.id === m.examId);
      if (exam) {
        applicableExams.push(exam.code as ExamType);
        examWeights[exam.code] = {
          weightPercentage: m.weightPercentage,
          questionCount: m.questionCount,
        };
      }
    }

    return {
      ...topic,
      chapterName: chapter?.name || 'Unknown Chapter',
      subjectName: subject?.name || 'Unknown Subject',
      subjectCode: subject?.code || 'GEN',
      subtopics,
      learningObjectives,
      skills,
      applicableExams,
      examWeights,
      learningUnit,
      questionCount: questions.length,
    };
  }

  /**
   * Full data-driven curriculum hierarchy for an exam:
   * Exam → Subject → Chapter → Topic → Subtopic → Learning Objective → Skill
   */
  async getCurriculumHierarchy(examCode: ExamType): Promise<ExamCurriculumHierarchy> {
    return this.getCurriculumHierarchySync(examCode);
  }

  getCurriculumHierarchySync(examCode: ExamType): ExamCurriculumHierarchy {
    const exam = this.getExamByCodeSync(examCode) || SEED_EXAMS[0];
    const mappings = SEED_EXAM_SUBJECT_MAPPINGS.filter(
      (m) => m.examId === exam.id && m.isActive
    ).sort((a, b) => a.displayOrder - b.displayOrder);

    let totalQuestions = 0;
    let totalChapters = 0;
    let totalTopics = 0;
    let totalSubtopics = 0;
    let totalLearningObjectives = 0;
    let totalSkills = 0;

    const subjects: SubjectHierarchy[] = mappings.map((mapping) => {
      const subj = SEED_SUBJECTS.find((s) => s.id === mapping.subjectId);
      
      // Determine all exams that share this subject
      const allSubjectMappings = SEED_EXAM_SUBJECT_MAPPINGS.filter((m) => m.subjectId === mapping.subjectId && m.isActive);
      const allExams: ExamType[] = allSubjectMappings.map((m) => {
        const e = SEED_EXAMS.find((item) => item.id === m.examId);
        return (e?.code || 'ECAT') as ExamType;
      });
      const isShared = allExams.length > 1;

      const chaptersRaw = this.getChaptersSync(mapping.subjectId);
      totalChapters += chaptersRaw.length;

      const chapters: ChapterHierarchy[] = chaptersRaw.map((chap) => {
        const topicsRaw = this.getTopicsSync(chap.id);
        totalTopics += topicsRaw.length;

        const topics: TopicHierarchy[] = topicsRaw.map((top) => {
          const subtopicsRaw = this.getSubtopicsSync(top.id);
          const learningObjectives = this.getLearningObjectivesSync(top.id);
          const skills = this.getSkillsSync(mapping.subjectId, top.id);
          const questions = this.getQuestionsForTopic(top.id);
          const hasUnit = SEED_LEARNING_UNITS.some((u) => u.topicId === top.id);

          totalSubtopics += subtopicsRaw.length;
          totalLearningObjectives += learningObjectives.length;
          totalSkills += skills.length;
          totalQuestions += questions.length;

          const subtopics: SubtopicHierarchy[] = subtopicsRaw.map((sub) => ({
            ...sub,
            learningObjectives: learningObjectives.filter((lo) => lo.subtopicId === sub.id),
          }));

          return {
            ...top,
            subtopics,
            learningObjectives,
            skills,
            hasLearningUnit: hasUnit,
            questionCount: questions.length,
          };
        });

        return {
          ...chap,
          topics,
        };
      });

      return {
        ...(subj || {
          id: mapping.subjectId,
          code: 'GEN',
          name: 'Subject',
          description: '',
          icon: 'BookOpen',
          color: 'blue',
          createdAt: new Date().toISOString(),
        }),
        weightPercentage: mapping.weightPercentage,
        questionCount: mapping.questionCount,
        isShared,
        allExams,
        chapters,
      };
    });

    return {
      exam,
      totalQuestions,
      totalChapters,
      totalTopics,
      totalSubtopics,
      totalLearningObjectives,
      totalSkills,
      subjects,
    };
  }

  /**
   * Returns syllabus configuration for an exam including weighting and question distribution
   */
  async getSyllabusConfig(examCode: ExamType): Promise<ExamSyllabusConfig | null> {
    const exam = await this.getExamByCode(examCode);
    if (!exam) return null;

    const mappings = SEED_EXAM_SUBJECT_MAPPINGS.filter(
      (m) => m.examId === exam.id && m.isActive
    ).sort((a, b) => a.displayOrder - b.displayOrder);

    const subjectConfigs = mappings.map((mapping) => {
      const subj = SEED_SUBJECTS.find((s) => s.id === mapping.subjectId);
      const otherExamShares = SEED_EXAM_SUBJECT_MAPPINGS.filter(
        (m) => m.subjectId === mapping.subjectId && m.examId !== exam.id
      );

      return {
        subjectCode: subj?.code || '',
        subjectName: subj?.name || '',
        questionCount: mapping.questionCount,
        weightPercentage: mapping.weightPercentage,
        isSharedAcrossExams: otherExamShares.length > 0,
      };
    });

    return {
      examCode,
      examName: exam.name,
      totalQuestions: mappings.reduce((acc, m) => acc + m.questionCount, 0),
      durationMinutes: exam.durationMinutes,
      markingScheme: {
        correctMark: exam.code === 'ECAT' ? 4 : 1,
        negativeMark: exam.code === 'ECAT' ? 1 : 0,
        unattemptedMark: 0,
      },
      subjects: subjectConfigs,
    };
  }

  /**
   * Reusable Learning Unit for ANY topic
   */
  async getLearningUnitForTopic(topicId: string): Promise<LearningUnit | null> {
    return this.getLearningUnitByTopicId(topicId);
  }

  /**
   * Get learning unit by topic ID synchronously
   */
  getLearningUnitByTopicId(topicId: string): LearningUnit | null {
    const existing = SEED_LEARNING_UNITS.find((u) => u.topicId === topicId);
    if (existing) return existing;

    const topic = SEED_TOPICS.find((t) => t.id === topicId);
    if (!topic) return null;

    return {
      id: `unit-${topic.id}`,
      topicId: topic.id,
      title: `${topic.name} Mastery Module`,
      summary: `Essential principles, derivations, and exam shortcuts for ${topic.name}.`,
      keyConcepts: [
        `Core theoretical foundations for ${topic.name}.`,
        'Key definitions, units, and dimensional analysis.',
        'High-yield past paper patterns.',
      ],
      keyFormulas: [
        'Standard formula representation',
        'Direct and inverse proportionality relationships',
      ],
      commonPitfalls: [
        'Overlooking unit conversions under timed conditions.',
        'Assuming standard state conditions when not specified.',
      ],
      estimatedMinutes: topic.estimatedStudyMinutes || 30,
      recommendedPracticeQuestionIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Filter questions based on dynamic criteria (Topic, Exam, Difficulty)
   */
  async getQuestions(criteria: QuestionFilterCriteria): Promise<Question[]> {
    return SEED_QUESTIONS.filter((q) => {
      if (criteria.examType && !q.applicableExams.includes(criteria.examType)) {
        return false;
      }
      if (criteria.subjectId && q.subjectId !== criteria.subjectId) {
        return false;
      }
      if (criteria.chapterId && q.chapterId !== criteria.chapterId) {
        return false;
      }
      if (criteria.topicId && q.topicId !== criteria.topicId) {
        return false;
      }
      if (criteria.difficulty && q.difficulty !== criteria.difficulty) {
        return false;
      }
      if (criteria.excludeQuestionIds && criteria.excludeQuestionIds.includes(q.id)) {
        return false;
      }
      return true;
    }).slice(0, criteria.limit || 50);
  }

  /**
   * Get questions for a specific topic synchronously
   */
  getQuestionsForTopic(topicId: string): Question[] {
    return SEED_QUESTIONS.filter((q) => q.topicId === topicId);
  }

  /**
   * Synchronous hierarchical tree for fast UI rendering (backward compatibility)
   */
  getExamCurriculumTree(examCode: ExamType): {
    examCode: ExamType;
    examName: string;
    totalQuestions: number;
    subjects: Array<CurriculumTreeSubject & { weightPercentage: number }>;
  } {
    const hierarchy = this.getCurriculumHierarchySync(examCode);
    return {
      examCode: hierarchy.exam.code as ExamType,
      examName: hierarchy.exam.name,
      totalQuestions: hierarchy.totalQuestions,
      subjects: hierarchy.subjects.map((s) => ({
        ...s,
        applicableExams: s.allExams,
        chapters: s.chapters.map((c) => ({
          ...c,
          topics: c.topics.map((t) => ({
            ...t,
            skills: t.skills,
          })),
        })),
      })),
    };
  }
}

export const curriculumService = new CurriculumService();

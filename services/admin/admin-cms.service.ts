import type {
  Exam,
  Subject,
  Chapter,
  Topic,
  LearningObjective,
  Skill,
  Question,
  QuestionOption,
  QuestionStatus,
  DifficultyLevel,
  ExamType,
  QuestionType,
} from '@/types';
import {
  SEED_EXAMS,
  SEED_SUBJECTS,
  SEED_CHAPTERS,
  SEED_TOPICS,
  SEED_LEARNING_OBJECTIVES,
  SEED_SKILLS,
  SEED_QUESTIONS,
} from '@/database/seed-data';
import { createClient } from '@/lib/supabase/client';

export interface CreateQuestionInput {
  subjectId: string;
  chapterId: string;
  topicId: string;
  subtopicId?: string;
  skillId?: string;
  learningObjectiveId?: string;
  questionText: string;
  type?: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  estimatedTimeSeconds?: number;
  options: Array<{
    optionKey: string;
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  explanation: string;
  comprehensiveExplanation?: string;
  tipOrShortcut?: string;
  applicableExams: ExamType[];
  source?: string;
}

export interface UpdateQuestionInput extends Partial<CreateQuestionInput> {
  id: string;
  isActive?: boolean;
}

export interface QuestionBankFilter {
  subjectId?: string;
  topicId?: string;
  difficulty?: DifficultyLevel | 'all';
  status?: QuestionStatus | 'all';
  search?: string;
  examType?: ExamType | 'all';
}

class AdminCmsService {
  // In-memory references to support immediate reactivity during sessions
  private questions: Question[] = SEED_QUESTIONS;
  private exams: Exam[] = SEED_EXAMS;
  private subjects: Subject[] = SEED_SUBJECTS;
  private chapters: Chapter[] = SEED_CHAPTERS;
  private topics: Topic[] = SEED_TOPICS;
  private learningObjectives: LearningObjective[] = SEED_LEARNING_OBJECTIVES;
  private skills: Skill[] = SEED_SKILLS;

  private isSupabaseConfigured(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    );
  }

  // ==========================================================================
  // 1. QUESTION BANK WORKFLOW & CRUD
  // ==========================================================================

  /**
   * Retrieve all questions for Admin CMS with comprehensive filtering
   */
  public async getQuestions(filter?: QuestionBankFilter): Promise<Question[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase
          .from('questions')
          .select(`
            *,
            question_options (*)
          `)
          .order('created_at', { ascending: false });

        if (filter?.subjectId && filter.subjectId !== 'all') {
          query = query.eq('subject_id', filter.subjectId);
        }
        if (filter?.topicId && filter.topicId !== 'all') {
          query = query.eq('topic_id', filter.topicId);
        }
        if (filter?.difficulty && filter.difficulty !== 'all') {
          query = query.eq('difficulty', filter.difficulty);
        }
        if (filter?.status && filter.status !== 'all') {
          query = query.eq('status', filter.status);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return (data as any[]).map((row) => ({
            id: row.id,
            subjectId: row.subject_id,
            chapterId: row.chapter_id,
            topicId: row.topic_id,
            subtopicId: row.subtopic_id,
            skillId: row.skill_id,
            learningObjectiveId: row.learning_objective_id,
            type: row.type || 'single_choice',
            questionType: row.question_type || 'single_choice',
            difficulty: row.difficulty,
            status: row.status as QuestionStatus,
            estimatedTimeSeconds: row.estimated_time_seconds || 90,
            content: row.content || row.question_text || '',
            questionText: row.question_text || row.content || '',
            options: (row.question_options || []).map((o: any) => ({
              id: o.id,
              optionKey: o.option_key,
              text: o.option_text,
              optionText: o.option_text,
              isCorrect: o.is_correct,
              explanation: o.explanation,
            })),
            correctOptionId:
              row.correct_option_id ||
              (row.question_options || []).find((o: any) => o.is_correct)?.id ||
              'opt-a',
            correctAnswer:
              row.correct_answer ||
              (row.question_options || []).find((o: any) => o.is_correct)?.id ||
              'opt-a',
            comprehensiveExplanation: row.comprehensive_explanation || '',
            explanation: row.explanation || '',
            tipOrShortcut: row.tip_or_shortcut,
            applicableExams: row.applicable_exams || ['ECAT'],
            source: row.source || row.past_paper_source,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Admin CMS falling back to in-memory question bank:', err);
      }
    }

    return this.getQuestionsSync(filter);
  }

  public getQuestionsSync(filter?: QuestionBankFilter): Question[] {
    return this.questions.filter((q) => {
      if (filter?.subjectId && filter.subjectId !== 'all' && q.subjectId !== filter.subjectId) {
        return false;
      }
      if (filter?.topicId && filter.topicId !== 'all' && q.topicId !== filter.topicId) {
        return false;
      }
      if (filter?.difficulty && filter.difficulty !== 'all' && q.difficulty !== filter.difficulty) {
        return false;
      }
      if (filter?.status && filter.status !== 'all') {
        if ((q.status || 'approved') !== filter.status) return false;
      }
      if (filter?.examType && filter.examType !== 'all') {
        if (!q.applicableExams.includes(filter.examType)) return false;
      }
      if (filter?.search) {
        const query = filter.search.toLowerCase().trim();
        const text = (q.content || q.questionText || '').toLowerCase();
        const explanation = (q.explanation || q.comprehensiveExplanation || '').toLowerCase();
        const id = q.id.toLowerCase();
        if (!text.includes(query) && !explanation.includes(query) && !id.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Get single question by ID
   */
  public async getQuestionById(id: string): Promise<Question | null> {
    const question = this.questions.find((q) => q.id === id);
    return question ? { ...question } : null;
  }

  /**
   * Create Question in Question Bank
   */
  public async createQuestion(input: CreateQuestionInput): Promise<Question> {
    const newId = `q-${input.subjectId.replace('subj-', '')}-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const options: QuestionOption[] = input.options.map((opt, idx) => ({
      id: `opt-${newId}-${idx}`,
      optionKey: opt.optionKey || String.fromCharCode(65 + idx),
      text: opt.text,
      optionText: opt.text,
      isCorrect: opt.isCorrect,
      explanation: opt.explanation,
    }));

    const correctOption = options.find((o) => o.isCorrect) || options[0];

    const newQuestion: Question = {
      id: newId,
      subjectId: input.subjectId,
      chapterId: input.chapterId,
      topicId: input.topicId,
      subtopicId: input.subtopicId,
      skillId: input.skillId,
      learningObjectiveId: input.learningObjectiveId,
      type: input.type || 'single_choice',
      questionType: input.type || 'single_choice',
      difficulty: input.difficulty,
      status: input.status,
      estimatedTimeSeconds: input.estimatedTimeSeconds || 90,
      content: input.questionText,
      questionText: input.questionText,
      options,
      correctOptionId: correctOption.id,
      correctAnswer: correctOption.id,
      explanation: input.explanation,
      comprehensiveExplanation: input.comprehensiveExplanation || input.explanation,
      tipOrShortcut: input.tipOrShortcut,
      applicableExams: input.applicableExams.length > 0 ? input.applicableExams : ['ECAT'],
      source: input.source || 'Admin CMS Authoring',
      isActive: input.status === 'approved',
      createdAt: now,
      updatedAt: now,
    };

    // Prepend to in-memory question store
    this.questions.unshift(newQuestion);

    // Persist to Supabase if connected
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await (supabase.from('questions') as any).insert({
          id: newQuestion.id,
          subject_id: newQuestion.subjectId,
          chapter_id: newQuestion.chapterId,
          topic_id: newQuestion.topicId,
          subtopic_id: newQuestion.subtopicId || null,
          skill_id: newQuestion.skillId || null,
          learning_objective_id: newQuestion.learningObjectiveId || null,
          content: newQuestion.content,
          question_text: newQuestion.questionText,
          difficulty: newQuestion.difficulty,
          status: newQuestion.status,
          estimated_time_seconds: newQuestion.estimatedTimeSeconds,
          correct_option_id: newQuestion.correctOptionId,
          explanation: newQuestion.explanation,
          comprehensive_explanation: newQuestion.comprehensiveExplanation,
          tip_or_shortcut: newQuestion.tipOrShortcut,
          applicable_exams: newQuestion.applicableExams,
          source: newQuestion.source,
          is_active: newQuestion.isActive,
        });

        // Insert options
        const optionsPayload = options.map((o, idx) => ({
          id: o.id,
          question_id: newQuestion.id,
          option_key: o.optionKey,
          option_text: o.text,
          is_correct: o.isCorrect,
          explanation: o.explanation || null,
          display_order: idx + 1,
        }));
        await (supabase.from('question_options') as any).insert(optionsPayload);
      } catch (err) {
        console.warn('Supabase create question sync failed:', err);
      }
    }

    return newQuestion;
  }

  /**
   * Update existing question
   */
  public async updateQuestion(input: UpdateQuestionInput): Promise<Question | null> {
    const idx = this.questions.findIndex((q) => q.id === input.id);
    if (idx === -1) return null;

    const existing = this.questions[idx];
    const now = new Date().toISOString();

    let updatedOptions = existing.options;
    if (input.options) {
      updatedOptions = input.options.map((opt, i) => ({
        id: existing.options[i]?.id || `opt-${input.id}-${i}`,
        optionKey: opt.optionKey || String.fromCharCode(65 + i),
        text: opt.text,
        optionText: opt.text,
        isCorrect: opt.isCorrect,
        explanation: opt.explanation,
      }));
    }

    const correctOption = updatedOptions.find((o) => o.isCorrect) || updatedOptions[0];

    const updated: Question = {
      ...existing,
      subjectId: input.subjectId ?? existing.subjectId,
      chapterId: input.chapterId ?? existing.chapterId,
      topicId: input.topicId ?? existing.topicId,
      subtopicId: input.subtopicId !== undefined ? input.subtopicId : existing.subtopicId,
      skillId: input.skillId !== undefined ? input.skillId : existing.skillId,
      learningObjectiveId:
        input.learningObjectiveId !== undefined
          ? input.learningObjectiveId
          : existing.learningObjectiveId,
      difficulty: input.difficulty ?? existing.difficulty,
      status: input.status ?? existing.status,
      content: input.questionText ?? existing.content,
      questionText: input.questionText ?? existing.questionText,
      options: updatedOptions,
      correctOptionId: correctOption.id,
      correctAnswer: correctOption.id,
      explanation: input.explanation ?? existing.explanation,
      comprehensiveExplanation:
        input.comprehensiveExplanation ?? existing.comprehensiveExplanation,
      tipOrShortcut: input.tipOrShortcut ?? existing.tipOrShortcut,
      applicableExams: input.applicableExams ?? existing.applicableExams,
      source: input.source ?? existing.source,
      isActive: input.isActive ?? (input.status ? input.status === 'approved' : existing.isActive),
      updatedAt: now,
    };

    this.questions[idx] = updated;

    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await (supabase.from('questions') as any)
          .update({
            subject_id: updated.subjectId,
            chapter_id: updated.chapterId,
            topic_id: updated.topicId,
            content: updated.content,
            question_text: updated.questionText,
            difficulty: updated.difficulty,
            status: updated.status,
            correct_option_id: updated.correctOptionId,
            explanation: updated.explanation,
            comprehensive_explanation: updated.comprehensiveExplanation,
            tip_or_shortcut: updated.tipOrShortcut,
            applicable_exams: updated.applicableExams,
            source: updated.source,
            is_active: updated.isActive,
            updated_at: now,
          })
          .eq('id', updated.id);
      } catch (err) {
        console.warn('Supabase update question sync failed:', err);
      }
    }

    return updated;
  }

  /**
   * Transition Question Status: draft -> review -> approved -> archived
   */
  public async updateQuestionStatus(id: string, status: QuestionStatus): Promise<Question | null> {
    const idx = this.questions.findIndex((q) => q.id === id);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    const existing = this.questions[idx];

    // Only approved questions should be active for student practice
    const isActive = status === 'approved';

    const updated: Question = {
      ...existing,
      status,
      isActive,
      updatedAt: now,
    };

    this.questions[idx] = updated;

    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await (supabase.from('questions') as any)
          .update({
            status,
            is_active: isActive,
            updated_at: now,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase status update failed:', err);
      }
    }

    return updated;
  }

  /**
   * Delete or archive question
   */
  public async deleteQuestion(id: string): Promise<boolean> {
    const idx = this.questions.findIndex((q) => q.id === id);
    if (idx === -1) return false;

    this.questions.splice(idx, 1);

    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('questions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete question failed:', err);
      }
    }

    return true;
  }

  /**
   * Get Question Bank Status Breakdown
   */
  public getQuestionCountsByStatus(): {
    total: number;
    draft: number;
    review: number;
    approved: number;
    archived: number;
  } {
    let draft = 0;
    let review = 0;
    let approved = 0;
    let archived = 0;

    this.questions.forEach((q) => {
      const st = q.status || 'approved';
      if (st === 'draft') draft++;
      else if (st === 'review') review++;
      else if (st === 'approved') approved++;
      else if (st === 'archived') archived++;
    });

    return {
      total: this.questions.length,
      draft,
      review,
      approved,
      archived,
    };
  }

  // ==========================================================================
  // 2. CURRICULUM MANAGEMENT (Exams, Subjects, Chapters, Topics, LOs, Skills)
  // ==========================================================================

  public getCurriculumOverviewCounts() {
    return {
      examsCount: this.exams.length,
      subjectsCount: this.subjects.length,
      chaptersCount: this.chapters.length,
      topicsCount: this.topics.length,
      learningObjectivesCount: this.learningObjectives.length,
      skillsCount: this.skills.length,
      totalQuestions: this.questions.length,
    };
  }

  // EXAMS
  public getExams(): Exam[] {
    return [...this.exams];
  }

  public async updateExam(id: string, updates: Partial<Exam>): Promise<Exam | null> {
    const idx = this.exams.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    this.exams[idx] = { ...this.exams[idx], ...updates };
    return { ...this.exams[idx] };
  }

  public async createExam(input: Omit<Exam, 'id' | 'createdAt'>): Promise<Exam> {
    const newExam: Exam = {
      ...input,
      id: `exam-${input.code.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    this.exams.push(newExam);
    return newExam;
  }

  // SUBJECTS
  public getSubjects(): Subject[] {
    return [...this.subjects];
  }

  public async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject | null> {
    const idx = this.subjects.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    this.subjects[idx] = { ...this.subjects[idx], ...updates };
    return { ...this.subjects[idx] };
  }

  public async createSubject(input: Omit<Subject, 'id' | 'createdAt'>): Promise<Subject> {
    const newSubject: Subject = {
      ...input,
      id: `subj-${input.code.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    this.subjects.push(newSubject);
    return newSubject;
  }

  // CHAPTERS
  public getChapters(subjectId?: string): Chapter[] {
    if (!subjectId || subjectId === 'all') return [...this.chapters];
    return this.chapters.filter((c) => c.subjectId === subjectId);
  }

  public async updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | null> {
    const idx = this.chapters.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    this.chapters[idx] = { ...this.chapters[idx], ...updates };
    return { ...this.chapters[idx] };
  }

  public async createChapter(input: Omit<Chapter, 'id' | 'createdAt'>): Promise<Chapter> {
    const newChapter: Chapter = {
      ...input,
      id: `chap-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.chapters.push(newChapter);
    return newChapter;
  }

  // TOPICS
  public getTopics(chapterId?: string): Topic[] {
    if (!chapterId || chapterId === 'all') return [...this.topics];
    return this.topics.filter((t) => t.chapterId === chapterId);
  }

  public async updateTopic(id: string, updates: Partial<Topic>): Promise<Topic | null> {
    const idx = this.topics.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    this.topics[idx] = { ...this.topics[idx], ...updates };
    return { ...this.topics[idx] };
  }

  public async createTopic(input: Omit<Topic, 'id' | 'createdAt'>): Promise<Topic> {
    const newTopic: Topic = {
      ...input,
      id: `topic-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.topics.push(newTopic);
    return newTopic;
  }

  // LEARNING OBJECTIVES
  public getLearningObjectives(topicId?: string): LearningObjective[] {
    if (!topicId || topicId === 'all') return [...this.learningObjectives];
    return this.learningObjectives.filter((lo) => lo.topicId === topicId);
  }

  public async updateLearningObjective(
    id: string,
    updates: Partial<LearningObjective>
  ): Promise<LearningObjective | null> {
    const idx = this.learningObjectives.findIndex((lo) => lo.id === id);
    if (idx === -1) return null;

    this.learningObjectives[idx] = { ...this.learningObjectives[idx], ...updates };
    return { ...this.learningObjectives[idx] };
  }

  public async createLearningObjective(
    input: Omit<LearningObjective, 'id' | 'createdAt'>
  ): Promise<LearningObjective> {
    const newLo: LearningObjective = {
      ...input,
      id: `lo-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.learningObjectives.push(newLo);
    return newLo;
  }

  // SKILLS
  public getSkills(subjectId?: string): Skill[] {
    if (!subjectId || subjectId === 'all') return [...this.skills];
    return this.skills.filter((s) => s.subjectId === subjectId);
  }

  public async updateSkill(id: string, updates: Partial<Skill>): Promise<Skill | null> {
    const idx = this.skills.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    this.skills[idx] = { ...this.skills[idx], ...updates };
    return { ...this.skills[idx] };
  }

  public async createSkill(input: Omit<Skill, 'id' | 'createdAt'>): Promise<Skill> {
    const newSkill: Skill = {
      ...input,
      id: `skill-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.skills.push(newSkill);
    return newSkill;
  }
}

export const adminCmsService = new AdminCmsService();

import type {
  Question,
  QuestionOption,
  QuestionAttempt,
  QuestionQueryOptions,
  CreateQuestionAttemptInput,
  SubmitAnswerInput,
  SubmitAnswerResult,
  DifficultyLevel,
  QuestionFilterCriteria,
  ExamType,
} from '@/types';
import { SEED_QUESTIONS, SEED_QUESTION_ATTEMPTS } from '@/database/seed-data';
import { createClient } from '@/lib/supabase/client';
import { masteryService } from '@/services/mastery/mastery.service';

const LIVE_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://exam-ai-backend-liart.vercel.app';

class QuestionService {
  private inMemoryAttempts: QuestionAttempt[] = [...SEED_QUESTION_ATTEMPTS];

  private isSupabaseConfigured(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    );
  }

  public async fetchLiveQuizQuestions(topic: string): Promise<Question[]> {
    try {
      const res = await fetch(`${LIVE_BACKEND_URL}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) return [];

      const data = await res.json();
      const quizItems = data.quiz || [];

      return quizItems.map((item: any, idx: number) => {
        const qId = `live-q-${Date.now()}-${idx}`;
        const options: QuestionOption[] = (item.options || []).map((optText: string, oIdx: number) => ({
          id: `${qId}-opt-${oIdx}`,
          optionKey: String.fromCharCode(65 + oIdx),
          text: optText,
          optionText: optText,
          isCorrect: optText === item.correct_answer,
          explanation: optText === item.correct_answer ? (item.explanation || 'Correct Option') : undefined,
          displayOrder: oIdx,
        }));

        const correctOpt = options.find((o) => o.isCorrect) || options[0];

        return {
          id: qId,
          subjectId: 'general-science',
          chapterId: 'live-quiz',
          topicId: topic.toLowerCase().replace(/\s+/g, '-'),
          type: 'single_choice',
          questionType: 'single_choice',
          difficulty: 'medium',
          status: 'approved',
          content: item.question,
          questionText: item.question,
          options,
          correctOptionId: correctOpt.id,
          correctAnswer: correctOpt.id,
          comprehensiveExplanation: item.explanation || 'Explanatory notes verified by Exam Engine.',
          explanation: item.explanation,
          applicableExams: ['ECAT', 'MDCAT'],
          estimatedTimeSeconds: 60,
          estimatedTime: 60,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Question;
      });
    } catch {
      return [];
    }
  }

  public async getQuestionById(questionId: string): Promise<Question | null> {
    if (!this.isSupabaseConfigured()) {
      return this.getQuestionByIdSync(questionId);
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          question_options (*)
        `)
        .eq('id', questionId)
        .single();

      if (error || !data) {
        return this.getQuestionByIdSync(questionId);
      }

      return this.mapDatabaseRowToQuestion(data);
    } catch {
      return this.getQuestionByIdSync(questionId);
    }
  }

  public getQuestionByIdSync(questionId: string): Question | null {
    return SEED_QUESTIONS.find((q) => q.id === questionId) || null;
  }

  public async getQuestionsByTopic(
    topicId: string,
    options?: QuestionQueryOptions
  ): Promise<Question[]> {
    const liveQuestions = await this.fetchLiveQuizQuestions(topicId);
    if (liveQuestions.length > 0) {
      return options?.limit ? liveQuestions.slice(0, options.limit) : liveQuestions;
    }

    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase
          .from('questions')
          .select(`
            *,
            question_options (*)
          `)
          .eq('topic_id', topicId)
          .eq('is_active', true);

        if (options?.difficulty) query = query.eq('difficulty', options.difficulty);
        if (options?.skillId) query = query.eq('skill_id', options.skillId);
        query = query.eq('status', options?.status || 'approved');
        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return (data as any[]).map((row) => this.mapDatabaseRowToQuestion(row));
        }
      } catch {
      }
    }

    return this.getQuestionsByTopicSync(topicId, options);
  }

  public getQuestionsByTopicSync(
    topicId: string,
    options?: QuestionQueryOptions
  ): Question[] {
    let filtered = SEED_QUESTIONS.filter((q) => q.topicId === topicId && q.isActive);

    if (options?.difficulty) filtered = filtered.filter((q) => q.difficulty === options.difficulty);
    if (options?.skillId) filtered = filtered.filter((q) => q.skillId === options.skillId);
    filtered = filtered.filter((q) => (q.status || 'approved') === (options?.status || 'approved'));
    if (options?.limit) filtered = filtered.slice(0, options.limit);

    return filtered;
  }

  public async getQuestionsByDifficulty(
    difficulty: DifficultyLevel,
    options?: QuestionQueryOptions
  ): Promise<Question[]> {
    if (!this.isSupabaseConfigured()) {
      return this.getQuestionsByDifficultySync(difficulty, options);
    }

    try {
      const supabase = createClient();
      let query = supabase
        .from('questions')
        .select(`
          *,
          question_options (*)
        `)
        .eq('difficulty', difficulty)
        .eq('is_active', true);

      if (options?.topicId) query = query.eq('topic_id', options.topicId);
      if (options?.skillId) query = query.eq('skill_id', options.skillId);
      query = query.eq('status', options?.status || 'approved');
      if (options?.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return (data as any[]).map((row) => this.mapDatabaseRowToQuestion(row));
      }
    } catch {
    }

    return this.getQuestionsByDifficultySync(difficulty, options);
  }

  public getQuestionsByDifficultySync(
    difficulty: DifficultyLevel,
    options?: QuestionQueryOptions
  ): Question[] {
    let filtered = SEED_QUESTIONS.filter(
      (q) => q.difficulty === difficulty && q.isActive
    );

    if (options?.topicId) filtered = filtered.filter((q) => q.topicId === options.topicId);
    if (options?.skillId) filtered = filtered.filter((q) => q.skillId === options.skillId);
    filtered = filtered.filter((q) => (q.status || 'approved') === (options?.status || 'approved'));
    if (options?.limit) filtered = filtered.slice(0, options.limit);

    return filtered;
  }

  public async getQuestionsBySkill(
    skillId: string,
    options?: QuestionQueryOptions
  ): Promise<Question[]> {
    if (!this.isSupabaseConfigured()) {
      return this.getQuestionsBySkillSync(skillId, options);
    }

    try {
      const supabase = createClient();
      let query = supabase
        .from('questions')
        .select(`
          *,
          question_options (*)
        `)
        .eq('skill_id', skillId)
        .eq('is_active', true);

      if (options?.difficulty) query = query.eq('difficulty', options.difficulty);
      query = query.eq('status', options?.status || 'approved');
      if (options?.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return (data as any[]).map((row) => this.mapDatabaseRowToQuestion(row));
      }
    } catch {
    }

    return this.getQuestionsBySkillSync(skillId, options);
  }

  public getQuestionsBySkillSync(
    skillId: string,
    options?: QuestionQueryOptions
  ): Question[] {
    let filtered = SEED_QUESTIONS.filter(
      (q) => q.skillId === skillId && q.isActive
    );

    if (options?.difficulty) filtered = filtered.filter((q) => q.difficulty === options.difficulty);
    filtered = filtered.filter((q) => (q.status || 'approved') === (options?.status || 'approved'));
    if (options?.limit) filtered = filtered.slice(0, options.limit);

    return filtered;
  }

  public async getRandomPracticeQuestions(
    filter?: QuestionFilterCriteria
  ): Promise<Question[]> {
    if (filter?.topicId) {
      const live = await this.fetchLiveQuizQuestions(filter.topicId);
      if (live.length > 0) {
        return this.shuffleArray(live).slice(0, filter?.limit || 10);
      }
    }

    const candidateQuestions = this.getQuestionsByFilterCriteria(filter);
    return this.shuffleArray(candidateQuestions).slice(0, filter?.limit || 10);
  }

  public getRandomPracticeQuestionsSync(
    filter?: QuestionFilterCriteria
  ): Question[] {
    const candidateQuestions = this.getQuestionsByFilterCriteria(filter);
    return this.shuffleArray(candidateQuestions).slice(0, filter?.limit || 10);
  }

  public getQuestionsByFilterCriteria(filter?: QuestionFilterCriteria): Question[] {
    return SEED_QUESTIONS.filter((q) => {
      if (!q.isActive) return false;
      if ((q.status || 'approved') !== 'approved') return false;

      if (filter?.examType && !q.applicableExams.includes(filter.examType)) return false;
      if (filter?.subjectId && q.subjectId !== filter.subjectId) return false;
      if (filter?.chapterId && q.chapterId !== filter.chapterId) return false;
      if (filter?.topicId && q.topicId !== filter.topicId) return false;
      if (filter?.skillId && q.skillId !== filter.skillId) return false;
      if (filter?.difficulty && q.difficulty !== filter.difficulty) return false;
      if (filter?.excludeQuestionIds && filter.excludeQuestionIds.includes(q.id)) return false;

      return true;
    });
  }

  public async isDuplicateSubmission(clientToken: string): Promise<boolean> {
    if (!clientToken) return false;

    const existsInMemory = this.inMemoryAttempts.some(
      (a) => a.clientToken === clientToken
    );
    if (existsInMemory) return true;

    if (!this.isSupabaseConfigured()) return false;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('question_attempts')
        .select('id')
        .eq('client_token', clientToken)
        .maybeSingle();

      return Boolean(!error && data);
    } catch {
      return false;
    }
  }

  public async recordAttempt(
    input: CreateQuestionAttemptInput
  ): Promise<QuestionAttempt> {
    const newAttempt: QuestionAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      studentId: input.studentId,
      questionId: input.questionId,
      selectedOptionId: input.selectedOptionId,
      selectedAnswer: input.selectedOptionId,
      isCorrect: input.isCorrect,
      correctness: input.isCorrect,
      timeSpentSeconds: input.timeSpentSeconds,
      timeTaken: input.timeSpentSeconds,
      confidence: input.confidence,
      sourceContext: input.sourceContext || 'practice',
      contextId: input.contextId,
      notes: input.notes,
      clientToken: input.clientToken,
      attemptedAt: new Date().toISOString(),
      attemptTimestamp: new Date().toISOString(),
    };

    this.inMemoryAttempts.unshift(newAttempt);

    try {
      const q = this.getQuestionByIdSync(input.questionId);
      if (q) {
        masteryService.recordPracticeAttempt({
          studentId: input.studentId,
          topicId: q.topicId,
          subjectId: q.subjectId,
          isCorrect: input.isCorrect,
          difficulty: q.difficulty,
          timeSpentSeconds: input.timeSpentSeconds,
          confidence: input.confidence,
          sourceContext: input.sourceContext || 'practice',
          questionId: q.id,
          attemptedAt: newAttempt.attemptedAt,
        });
      }
    } catch {
    }

    if (!this.isSupabaseConfigured()) {
      return newAttempt;
    }

    try {
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .from('question_attempts')
        .insert({
          student_id: input.studentId,
          question_id: input.questionId,
          selected_option_id: input.selectedOptionId,
          selected_answer: input.selectedOptionId,
          is_correct: input.isCorrect,
          time_spent_seconds: input.timeSpentSeconds,
          time_taken_seconds: input.timeSpentSeconds,
          confidence: input.confidence || null,
          source_context: input.sourceContext || 'practice',
          context_id: input.contextId || null,
          notes: input.notes || null,
          client_token: input.clientToken || null,
        })
        .select()
        .single();

      if (!error && data) {
        newAttempt.id = data.id;
        newAttempt.attemptedAt = data.attemptedAt || data.attempted_at;
      }
    } catch {
    }

    return newAttempt;
  }

  public async getStudentAttempts(
    studentId: string,
    options?: { limit?: number; questionId?: string }
  ): Promise<QuestionAttempt[]> {
    if (!this.isSupabaseConfigured()) {
      return this.getStudentAttemptsSync(studentId, options);
    }

    try {
      const supabase = createClient();
      let query = supabase
        .from('question_attempts')
        .select('*')
        .eq('student_id', studentId)
        .order('attempted_at', { ascending: false });

      if (options?.questionId) query = query.eq('question_id', options.questionId);
      if (options?.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.getStudentAttemptsSync(studentId, options);
      }

      return (data as any[]).map((row) => ({
        id: row.id,
        studentId: row.student_id,
        questionId: row.question_id,
        selectedOptionId: row.selected_option_id || row.selected_answer,
        selectedAnswer: row.selected_answer || row.selected_option_id,
        isCorrect: row.is_correct,
        correctness: row.is_correct,
        timeSpentSeconds: row.time_spent_seconds || row.time_taken_seconds || 0,
        timeTaken: row.time_taken_seconds || row.time_spent_seconds || 0,
        confidence: row.confidence,
        sourceContext: row.source_context as any,
        contextId: row.context_id,
        notes: row.notes,
        clientToken: row.client_token,
        attemptedAt: row.attempted_at,
        attemptTimestamp: row.attempted_at,
      }));
    } catch {
      return this.getStudentAttemptsSync(studentId, options);
    }
  }

  public getStudentAttemptsSync(
    studentId: string,
    options?: { limit?: number; questionId?: string }
  ): QuestionAttempt[] {
    let attempts = this.inMemoryAttempts.filter(
      (a) =>
        a.studentId === studentId ||
        studentId === 'demo-student-id' ||
        studentId === '00000000-0000-0000-0000-000000000001'
    );

    if (options?.questionId) attempts = attempts.filter((a) => a.questionId === options.questionId);
    if (options?.limit) attempts = attempts.slice(0, options.limit);

    return attempts;
  }

  public async getQuestionAttempts(
    questionId: string,
    studentId?: string
  ): Promise<QuestionAttempt[]> {
    if (studentId) {
      return this.getStudentAttempts(studentId, { questionId });
    }
    return this.inMemoryAttempts.filter((a) => a.questionId === questionId);
  }

  public async submitAnswer(submission: SubmitAnswerInput): Promise<SubmitAnswerResult> {
    const question = await this.getQuestionById(submission.questionId);
    if (!question) {
      throw new Error(`Question with ID ${submission.questionId} not found`);
    }

    if (submission.clientToken) {
      const isDup = await this.isDuplicateSubmission(submission.clientToken);
      if (isDup) {
        const existing = this.inMemoryAttempts.find((a) => a.clientToken === submission.clientToken);
        return {
          attemptId: existing?.id || 'unknown',
          questionId: question.id,
          studentId: submission.studentId,
          selectedOptionId: existing?.selectedOptionId || submission.selectedOptionId,
          isCorrect: existing ? existing.isCorrect : submission.selectedOptionId === question.correctOptionId,
          correctOptionId: question.correctOptionId,
          explanation: question.comprehensiveExplanation,
          tipOrShortcut: question.tipOrShortcut,
          timeSpentSeconds: existing?.timeSpentSeconds || submission.timeSpentSeconds,
          confidence: existing?.confidence || submission.confidence,
          attemptedAt: existing?.attemptedAt || new Date().toISOString(),
          isDuplicate: true,
        };
      }
    }

    const isCorrect = submission.selectedOptionId === question.correctOptionId;

    const attempt = await this.recordAttempt({
      studentId: submission.studentId,
      questionId: submission.questionId,
      selectedOptionId: submission.selectedOptionId,
      isCorrect,
      timeSpentSeconds: submission.timeSpentSeconds,
      confidence: submission.confidence,
      sourceContext: submission.sourceContext || 'practice',
      contextId: submission.contextId,
      clientToken: submission.clientToken,
    });

    return {
      attemptId: attempt.id,
      questionId: question.id,
      studentId: submission.studentId,
      selectedOptionId: submission.selectedOptionId,
      isCorrect,
      correctOptionId: question.correctOptionId,
      explanation: question.comprehensiveExplanation,
      tipOrShortcut: question.tipOrShortcut,
      timeSpentSeconds: submission.timeSpentSeconds,
      confidence: submission.confidence,
      attemptedAt: attempt.attemptedAt,
      isDuplicate: false,
    };
  }

  public submitAnswerSync(submission: SubmitAnswerInput): SubmitAnswerResult {
    const question = this.getQuestionByIdSync(submission.questionId);
    if (!question) {
      throw new Error(`Question with ID ${submission.questionId} not found`);
    }

    if (submission.clientToken) {
      const existingAttempt = this.inMemoryAttempts.find(
        (a) => a.clientToken === submission.clientToken
      );
      if (existingAttempt) {
        return {
          attemptId: existingAttempt.id,
          questionId: question.id,
          studentId: submission.studentId,
          selectedOptionId: existingAttempt.selectedOptionId || submission.selectedOptionId,
          isCorrect: existingAttempt.isCorrect,
          correctOptionId: question.correctOptionId,
          explanation: question.comprehensiveExplanation,
          tipOrShortcut: question.tipOrShortcut,
          timeSpentSeconds: existingAttempt.timeSpentSeconds,
          confidence: existingAttempt.confidence,
          attemptedAt: existingAttempt.attemptedAt,
          isDuplicate: true,
        };
      }
    }

    const isCorrect = submission.selectedOptionId === question.correctOptionId;

    const newAttempt: QuestionAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      studentId: submission.studentId,
      questionId: submission.questionId,
      selectedOptionId: submission.selectedOptionId,
      selectedAnswer: submission.selectedOptionId,
      isCorrect,
      correctness: isCorrect,
      timeSpentSeconds: submission.timeSpentSeconds,
      timeTaken: submission.timeSpentSeconds,
      confidence: submission.confidence,
      sourceContext: submission.sourceContext || 'practice',
      contextId: submission.contextId,
      clientToken: submission.clientToken,
      attemptedAt: new Date().toISOString(),
      attemptTimestamp: new Date().toISOString(),
    };

    this.inMemoryAttempts.unshift(newAttempt);

    return {
      attemptId: newAttempt.id,
      questionId: question.id,
      studentId: submission.studentId,
      selectedOptionId: submission.selectedOptionId,
      isCorrect,
      correctOptionId: question.correctOptionId,
      explanation: question.comprehensiveExplanation,
      tipOrShortcut: question.tipOrShortcut,
      timeSpentSeconds: submission.timeSpentSeconds,
      confidence: submission.confidence,
      attemptedAt: newAttempt.attemptedAt,
      isDuplicate: false,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private mapDatabaseRowToQuestion(row: any): Question {
    let options: QuestionOption[] = [];
    if (Array.isArray(row.question_options) && row.question_options.length > 0) {
      options = row.question_options
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        .map((opt: any) => ({
          id: opt.id,
          optionKey: opt.option_key,
          text: opt.option_text,
          optionText: opt.option_text,
          isCorrect: opt.is_correct,
          explanation: opt.explanation,
          displayOrder: opt.display_order,
        }));
    } else if (Array.isArray(row.options)) {
      options = row.options;
    }

    return {
      id: row.id,
      subjectId: row.subject_id,
      chapterId: row.chapter_id,
      topicId: row.topic_id,
      subtopicId: row.subtopic_id,
      skillId: row.skill_id,
      learningObjectiveId: row.learning_objective_id,
      type: (row.question_type || row.type || 'single_choice') as any,
      questionType: (row.question_type || row.type || 'single_choice') as any,
      difficulty: (row.difficulty || 'medium') as any,
      status: (row.status || 'approved') as any,
      content: row.question_text || row.content,
      questionText: row.question_text || row.content,
      options,
      correctOptionId: row.correct_option_id,
      correctAnswer: row.correct_option_id,
      comprehensiveExplanation: row.comprehensive_explanation,
      explanation: row.comprehensive_explanation,
      tipOrShortcut: row.tip_or_shortcut,
      applicableExams: (row.applicable_exams || ['ECAT', 'MDCAT']) as ExamType[],
      pastPaperSource: row.source || row.past_paper_source,
      source: row.source || row.past_paper_source,
      estimatedTimeSeconds: row.estimated_time_seconds || 90,
      estimatedTime: row.estimated_time_seconds || 90,
      isActive: row.is_active ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const questionService = new QuestionService();

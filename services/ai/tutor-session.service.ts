import { curriculumService } from '@/services/curriculum/curriculum.service';
import { learningUnitService } from '@/services/learning-unit/learning-unit.service';
import { questionService } from '@/services/question/question.service';
import { masteryService } from '@/services/mastery/mastery.service';
import type {
  ExamType,
  TutorSession,
  TutorSessionMessage,
  TutorContextPayload,
  ExplanationMode,
  VerificationQuestion,
  AiTutorChatResponse,
  AiTutorChatRequest,
} from '@/types';

const STORAGE_KEY = 'ai_exam_tutor_sessions_v1';

export class TutorSessionService {
  private inMemorySessions: Map<string, TutorSession> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: TutorSession[] = JSON.parse(raw);
        for (const session of parsed) {
          this.inMemorySessions.set(session.id, session);
        }
      }
    } catch (e) {
      console.warn('Failed to load tutor sessions from storage', e);
    }
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const all = Array.from(this.inMemorySessions.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Failed to persist tutor sessions', e);
    }
  }

  /**
   * Builds rich, ground-truth context directly from Curriculum, Learning Unit, and Mastery engines
   */
  buildFullTutorContext(params: {
    topicId: string;
    examType: ExamType;
    questionId?: string;
    studentId?: string;
    selectedOptionId?: string;
  }): TutorContextPayload {
    const { topicId, examType, questionId, studentId, selectedOptionId } = params;

    // 1. Topic & Subject & Chapter metadata
    const topicMeta = curriculumService.getTopicByIdSync(topicId);
    const topicName = topicMeta?.name || topicId.replace('topic-', '').replace(/-/g, ' ');
    const subjectId = topicMeta?.subjectId || 'subj-physics';
    const subjectMeta = curriculumService.getSubjectByIdSync(subjectId);
    const subjectName = subjectMeta?.name || 'Physics';

    // 2. Learning unit definitions, formulas, and pitfalls
    const fullUnit = learningUnitService.getFullLearningUnitSync(topicId, studentId);
    const keyFormulas = fullUnit?.unit?.keyFormulas || [];
    const commonPitfalls =
      fullUnit?.commonPitfalls?.map((p) => `${p.trap} (Correction: ${p.howToAvoid})`) ||
      fullUnit?.unit?.commonPitfalls ||
      [];
    const learningObjectives = fullUnit?.learningObjectives?.map((lo) => lo.statement) || [];
    const skills = fullUnit?.skills?.map((s) => `${s.code}: ${s.name}`) || [];
    const keyConcepts =
      fullUnit?.definitions?.map((d) => `${d.term}: ${d.definition}`) ||
      fullUnit?.unit?.keyConcepts ||
      [];

    // 3. Question context (if active)
    let currentQuestionPayload: TutorContextPayload['currentQuestion'] = undefined;
    if (questionId) {
      const q = questionService.getQuestionByIdSync(questionId);
      if (q) {
        const selectedOpt = q.options.find((o) => o.id === selectedOptionId);
        const correctOpt = q.options.find((o) => o.id === q.correctOptionId || o.isCorrect);
        currentQuestionPayload = {
          id: q.id,
          statement: q.content,
          options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
          selectedOptionId,
          selectedOptionText: selectedOpt?.text,
          correctOptionId: q.correctOptionId || correctOpt?.id,
          correctOptionText: correctOpt?.text,
          isCorrect: selectedOptionId ? selectedOptionId === (q.correctOptionId || correctOpt?.id) : undefined,
          explanation: q.comprehensiveExplanation,
          difficulty: q.difficulty,
        };
      }
    }

    // 4. Student Mastery Level
    let studentMasteryScore: number | undefined;
    let studentMasteryStatus: string | undefined;
    if (studentId) {
      const studentMastery = masteryService.getStudentMastery(studentId);
      const tm = studentMastery.topics.find((t) => t.topicId === topicId);
      if (tm) {
        studentMasteryScore = tm.masteryScore;
        studentMasteryStatus = tm.status;
      }
    }

    return {
      examType,
      subjectId,
      subjectName,
      chapterName: topicMeta?.chapterId?.replace('chap-', '').replace(/-/g, ' ') || 'Core Chapter',
      topicId,
      topicName,
      learningObjectives,
      skills,
      keyConcepts,
      keyFormulas,
      commonPitfalls,
      relevantContent: fullUnit?.overview || fullUnit?.unit?.summary,
      studentMasteryScore,
      studentMasteryStatus,
      currentQuestion: currentQuestionPayload,
    };
  }

  /**
   * Retrieves an existing session or creates a new one for a student & topic
   */
  getOrCreateSession(params: {
    studentId: string;
    topicId: string;
    examType: ExamType;
    questionId?: string;
    questionStatement?: string;
  }): TutorSession {
    const { studentId, topicId, examType, questionId, questionStatement } = params;
    const topicMeta = curriculumService.getTopicByIdSync(topicId);
    const topicName = topicMeta?.name || topicId.replace('topic-', '').replace(/-/g, ' ');
    const subjectId = topicMeta?.subjectId || 'subj-physics';
    const subjectMeta = curriculumService.getSubjectByIdSync(subjectId);
    const subjectName = subjectMeta?.name || 'Physics';

    // Look for existing active session for this student and topic
    const existing = Array.from(this.inMemorySessions.values()).find(
      (s) =>
        s.studentId === studentId &&
        s.topicId === topicId &&
        (questionId ? s.questionId === questionId : !s.questionId)
    );

    if (existing) {
      return existing;
    }

    // Create a new session
    const sessionId = `session-${studentId.slice(0, 8)}-${topicId}-${Date.now()}`;
    const newSession: TutorSession = {
      id: sessionId,
      studentId,
      topicId,
      topicName,
      subjectName,
      chapterName: topicMeta?.chapterId?.replace('chap-', '').replace(/-/g, ' '),
      examType,
      questionId,
      questionStatement,
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          role: 'tutor',
          content: `Salam! I am your CrackIt.ai Tutor for **${topicName}** (${subjectName} for ${examType}). Ask me to explain the concept simply, break down derivations step-by-step, give an intuitive analogy, or provide high-yield exam tips!`,
          mode: 'simple',
          followUpQuestions: [
            `Explain ${topicName} simply`,
            `Show me step-by-step formulas for ${topicName}`,
            `Give me a real-world analogy for ${topicName}`,
            `What is the #1 exam trap in ${topicName}?`,
          ],
          suggestedAction: 'review_formula',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemorySessions.set(sessionId, newSession);
    this.persistToStorage();
    return newSession;
  }

  /**
   * Appends a message to a session
   */
  addMessage(sessionId: string, message: TutorSessionMessage): TutorSession | null {
    const session = this.inMemorySessions.get(sessionId);
    if (!session) return null;

    session.messages.push(message);
    session.updatedAt = new Date().toISOString();
    this.persistToStorage();
    return session;
  }

  /**
   * Retrieves all sessions for a student
   */
  getSessionsForStudent(studentId: string): TutorSession[] {
    return Array.from(this.inMemorySessions.values())
      .filter((s) => s.studentId === studentId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Retrieves a single session by ID
   */
  getSessionById(sessionId: string): TutorSession | null {
    return this.inMemorySessions.get(sessionId) || null;
  }

  /**
   * Clears messages for a session or resets it
   */
  clearSession(sessionId: string): void {
    const session = this.inMemorySessions.get(sessionId);
    if (session) {
      session.messages = [];
      session.updatedAt = new Date().toISOString();
      this.persistToStorage();
    }
  }

  /**
   * Delete session completely
   */
  deleteSession(sessionId: string): void {
    this.inMemorySessions.delete(sessionId);
    this.persistToStorage();
  }
}

export const tutorSessionService = new TutorSessionService();

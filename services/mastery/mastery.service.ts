/**
 * Centralized Topic Mastery Engine
 *
 * SINGLE SOURCE OF TRUTH for calculating, updating, and querying student topic mastery
 * across Diagnostics, Practice Arena, Learning Units, and AI Study Plans.
 *
 * Core Entity: topic_mastery
 * Associates:
 * - student
 * - topic
 * - mastery_score (0 - 100 bounded)
 * - status ('unassessed' | 'weak' | 'developing' | 'strong' | 'mastered')
 * - last_assessed_at
 * - last_practiced_at
 * - updated_at
 */

import type { DifficultyLevel, ConfidenceLevel, ExamType } from '@/types';
import type {
  TopicMastery,
  TopicMasteryStatus,
  TopicMasteryHistoryEntry,
  MasteryScoringConfig,
  MasteryScoreComponents,
  TopicAttemptEvidence,
  StudentMasteryFilterOptions,
  StudentMasterySummary,
} from '@/types/mastery';
import { topicMasteryScoringEngine } from './topic-mastery.scoring';
import { DEMO_STUDENT_ID, DEMO_TOPIC_MASTERIES } from '@/database/demo-data';
import { SEED_TOPICS } from '@/database/seed-data';
import { createClient } from '@/lib/supabase/client';
import { examConfigService } from '@/services/exam/exam-config.service';

// Backward compatibility interfaces
export interface MasteryAssessmentAttempt {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  difficulty: DifficultyLevel;
}

export interface MasteryAssessmentInput {
  studentId: string;
  topicId: string;
  testScore: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  attempts: MasteryAssessmentAttempt[];
}

export interface MasteryResult {
  topicId: string;
  studentId: string;
  previousMasteryScore: number;
  updatedMasteryScore: number;
  masteryLevel: 'novice' | 'developing' | 'proficient' | 'mastered';
  accuracyPercentage: number;
  timeSpentSeconds: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  passed: boolean;
  completedAt: string;
}

export interface IMasteryService {
  calculateTopicMastery(params: {
    attempts: TopicAttemptEvidence[];
    previousScore?: number;
    configOverrides?: Partial<MasteryScoringConfig>;
  }): MasteryScoreComponents;

  updateTopicMastery(params: {
    studentId: string;
    topicId: string;
    subjectId?: string;
    evidence?: TopicAttemptEvidence;
    attempts?: TopicAttemptEvidence[];
    previousScore?: number;
    sourceContext?: 'diagnostic' | 'practice' | 'mastery_test' | 'mock_exam';
    note?: string;
  }): Promise<TopicMastery>;

  getStudentMastery(
    studentId: string,
    options?: StudentMasteryFilterOptions
  ): StudentMasterySummary;

  getWeakTopics(
    studentId: string,
    options?: { limit?: number; subjectId?: string; examType?: ExamType }
  ): TopicMastery[];

  getStrongTopics(
    studentId: string,
    options?: { limit?: number; subjectId?: string; examType?: ExamType }
  ): TopicMastery[];

  // Backward compatibility
  evaluateTopicMastery(input: MasteryAssessmentInput): Promise<MasteryResult>;
  getTopicMastery(studentId: string, topicId: string): Promise<MasteryResult | null>;
  getTopicMasterySync(studentId: string, topicId: string): MasteryResult;
}

class MasteryService implements IMasteryService {
  // In-memory single-source-of-truth stores
  private masteryStore: Map<string, TopicMastery> = new Map();
  private attemptEvidenceStore: Map<string, TopicAttemptEvidence[]> = new Map();
  private historyStore: Map<string, TopicMasteryHistoryEntry[]> = new Map();

  constructor() {
    this.seedInitialState();
  }

  private isSupabaseConfigured(): boolean {
    return Boolean(
      typeof window === 'undefined' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    );
  }

  private getStorageKey(studentId: string, topicId: string): string {
    return `${studentId}:${topicId}`;
  }

  /**
   * Seed initial baseline masteries from demo records and curriculum
   */
  private seedInitialState(): void {
    const demoStudentId = DEMO_STUDENT_ID;

    // 1. Seed demo student masteries
    DEMO_TOPIC_MASTERIES.forEach((seedMastery) => {
      const key = this.getStorageKey(demoStudentId, seedMastery.topicId);
      const initialScore = seedMastery.masteryScore;
      const status: TopicMasteryStatus =
        initialScore >= 85
          ? 'mastered'
          : initialScore >= 70
          ? 'strong'
          : initialScore >= 45
          ? 'developing'
          : 'weak';

      const initialHistory: TopicMasteryHistoryEntry[] = [
        {
          id: `hist-seed-${seedMastery.topicId}`,
          studentId: demoStudentId,
          topicId: seedMastery.topicId,
          previousScore: Math.max(0, initialScore - 12),
          newScore: initialScore,
          delta: 12,
          sourceContext: 'diagnostic',
          attemptCount: seedMastery.totalAttempted,
          accuracy: seedMastery.totalAttempted > 0
            ? Math.round((seedMastery.correctCount / seedMastery.totalAttempted) * 100)
            : 0,
          timestamp: seedMastery.lastTestedAt || '2026-09-08T10:00:00.000Z',
          note: 'Initial Diagnostic Baseline Assessment',
        },
      ];

      const record: TopicMastery = {
        id: seedMastery.id,
        studentId: demoStudentId,
        student: demoStudentId,
        topicId: seedMastery.topicId,
        topic: seedMastery.topicId,
        subjectId: seedMastery.subjectId,
        masteryScore: initialScore,
        mastery_score: initialScore,
        status,
        masteryLevel: topicMasteryScoringEngine.mapStatusToLegacyLevel(status),
        lastAssessedAt: seedMastery.lastTestedAt || '2026-09-08T10:00:00.000Z',
        last_assessed_at: seedMastery.lastTestedAt || '2026-09-08T10:00:00.000Z',
        lastPracticedAt: seedMastery.lastTestedAt || '2026-09-08T10:00:00.000Z',
        last_practiced_at: seedMastery.lastTestedAt || '2026-09-08T10:00:00.000Z',
        updatedAt: seedMastery.updatedAt,
        updated_at: seedMastery.updatedAt,
        totalAttempted: seedMastery.totalAttempted,
        totalAttempts: seedMastery.totalAttempted,
        correctCount: seedMastery.correctCount,
        correctAttempts: seedMastery.correctCount,
        accuracyPercentage:
          seedMastery.totalAttempted > 0
            ? Math.round((seedMastery.correctCount / seedMastery.totalAttempted) * 100)
            : 0,
        streakCount: seedMastery.streakCount,
        needsReview: seedMastery.needsReview,
        history: initialHistory,
      };

      this.masteryStore.set(key, record);
      this.historyStore.set(key, initialHistory);

      // Seed synthetic attempts matching the counts
      const syntheticAttempts: TopicAttemptEvidence[] = [];
      for (let i = 0; i < seedMastery.totalAttempted; i++) {
        const isCorrect = i < seedMastery.correctCount;
        syntheticAttempts.push({
          questionId: `seed-q-${seedMastery.topicId}-${i}`,
          isCorrect,
          difficulty: i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy',
          timeSpentSeconds: 55,
          confidence: isCorrect ? 'high' : 'medium',
          sourceContext: 'practice',
          attemptedAt: new Date(Date.now() - (seedMastery.totalAttempted - i) * 3600000).toISOString(),
        });
      }
      this.attemptEvidenceStore.set(key, syntheticAttempts);
    });

    // 2. Ensure all other curriculum topics exist as 'unassessed'
    SEED_TOPICS.forEach((topic) => {
      const key = this.getStorageKey(demoStudentId, topic.id);
      if (!this.masteryStore.has(key)) {
        const unassessedRecord: TopicMastery = {
          id: `mastery-init-${topic.id}`,
          studentId: demoStudentId,
          student: demoStudentId,
          topicId: topic.id,
          topic: topic.id,
          subjectId: topic.subjectId,
          masteryScore: 0,
          mastery_score: 0,
          status: 'unassessed',
          masteryLevel: 'novice',
          lastAssessedAt: null,
          last_assessed_at: null,
          lastPracticedAt: null,
          last_practiced_at: null,
          updatedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          totalAttempted: 0,
          totalAttempts: 0,
          correctCount: 0,
          correctAttempts: 0,
          accuracyPercentage: 0,
          streakCount: 0,
          needsReview: false,
          history: [],
        };
        this.masteryStore.set(key, unassessedRecord);
        this.historyStore.set(key, []);
        this.attemptEvidenceStore.set(key, []);
      }
    });
  }

  // ============================================================================
  // 1. CALCULATE TOPIC MASTERY (Central Calculation Model)
  // ============================================================================

  /**
   * Deterministic calculation function for estimating topic mastery from evidence.
   * Single source of truth.
   */
  public calculateTopicMastery(params: {
    attempts: TopicAttemptEvidence[];
    previousScore?: number;
    configOverrides?: Partial<MasteryScoringConfig>;
  }): MasteryScoreComponents {
    return topicMasteryScoringEngine.calculateScoreFromEvidence(params);
  }

  // ============================================================================
  // 2. UPDATE TOPIC MASTERY (State Mutation with History Tracking)
  // ============================================================================

  /**
   * Updates topic mastery for a student given new or updated evidence.
   * Central entrypoint for practice submissions, diagnostic scoring, and mastery tests.
   */
  public async updateTopicMastery(params: {
    studentId: string;
    topicId: string;
    subjectId?: string;
    evidence?: TopicAttemptEvidence;
    attempts?: TopicAttemptEvidence[];
    previousScore?: number;
    sourceContext?: 'diagnostic' | 'practice' | 'mastery_test' | 'mock_exam' | 'learning_unit';
    note?: string;
  }): Promise<TopicMastery> {
    return this.updateTopicMasterySync(params);
  }

  /**
   * Synchronous update for instant responsive telemetry in UI
   */
  public updateTopicMasterySync(params: {
    studentId: string;
    topicId: string;
    subjectId?: string;
    evidence?: TopicAttemptEvidence;
    attempts?: TopicAttemptEvidence[];
    previousScore?: number;
    sourceContext?: 'diagnostic' | 'practice' | 'mastery_test' | 'mock_exam' | 'learning_unit';
    note?: string;
  }): TopicMastery {
    const { studentId, topicId } = params;
    const key = this.getStorageKey(studentId, topicId);
    const existing = this.masteryStore.get(key);

    // Resolve subject ID
    const subjectId =
      params.subjectId ||
      existing?.subjectId ||
      SEED_TOPICS.find((t) => t.id === topicId)?.subjectId ||
      'subj-physics';

    // Accumulate attempts
    let currentAttempts = this.attemptEvidenceStore.get(key) || [];
    if (params.attempts) {
      currentAttempts = [...params.attempts];
    } else if (params.evidence) {
      currentAttempts = [...currentAttempts, params.evidence];
    }
    this.attemptEvidenceStore.set(key, currentAttempts);

    // Prior score
    const previousScore =
      params.previousScore !== undefined
        ? params.previousScore
        : existing
        ? existing.masteryScore
        : 0;

    // Calculate score using central engine
    const components = this.calculateTopicMastery({
      attempts: currentAttempts,
      previousScore,
    });

    const totalAttempted = currentAttempts.length;
    const correctCount = currentAttempts.filter((a) => a.isCorrect).length;
    const accuracyPercentage =
      totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

    // Calculate streak
    let streakCount = 0;
    for (let i = currentAttempts.length - 1; i >= 0; i--) {
      if (currentAttempts[i].isCorrect) {
        streakCount += 1;
      } else {
        break;
      }
    }

    const status = topicMasteryScoringEngine.determineStatus(
      components.finalScore,
      totalAttempted
    );
    const legacyLevel = topicMasteryScoringEngine.mapStatusToLegacyLevel(status);
    const now = new Date().toISOString();

    const isAssessed = params.sourceContext === 'diagnostic' || params.sourceContext === 'mastery_test';
    const lastAssessedAt = isAssessed ? now : existing?.lastAssessedAt || null;
    const lastPracticedAt = now;

    const delta = components.finalScore - previousScore;

    // Record history entry for timeline visualization
    const historyEntry: TopicMasteryHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentId,
      topicId,
      previousScore,
      newScore: components.finalScore,
      delta,
      sourceContext: params.sourceContext || 'practice',
      attemptCount: totalAttempted,
      accuracy: accuracyPercentage,
      timestamp: now,
      note: params.note,
    };

    const currentHistory = this.historyStore.get(key) || [];
    const updatedHistory = [historyEntry, ...currentHistory];
    this.historyStore.set(key, updatedHistory);

    const updatedRecord: TopicMastery = {
      id: existing?.id || `mastery-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      student: studentId,
      topicId,
      topic: topicId,
      subjectId,
      masteryScore: components.finalScore,
      mastery_score: components.finalScore,
      status,
      masteryLevel: legacyLevel,
      lastAssessedAt,
      last_assessed_at: lastAssessedAt,
      lastPracticedAt,
      last_practiced_at: lastPracticedAt,
      updatedAt: now,
      updated_at: now,
      totalAttempted,
      totalAttempts: totalAttempted,
      correctCount,
      correctAttempts: correctCount,
      accuracyPercentage,
      streakCount,
      needsReview: status === 'weak' || (status === 'developing' && streakCount === 0),
      history: updatedHistory,
    };

    this.masteryStore.set(key, updatedRecord);

    // Also persist to Supabase if configured (async fire-and-forget)
    if (this.isSupabaseConfigured()) {
      this.persistToSupabase(updatedRecord, historyEntry).catch(() => {});
    }

    return updatedRecord;
  }

  private async persistToSupabase(record: TopicMastery, historyEntry: TopicMasteryHistoryEntry): Promise<void> {
    try {
      const supabase = createClient();
      await (supabase as any).from('topic_mastery').upsert({
        id: record.id,
        student_id: record.studentId,
        topic_id: record.topicId,
        subject_id: record.subjectId,
        mastery_score: record.masteryScore,
        status: record.status,
        last_assessed_at: record.lastAssessedAt,
        last_practiced_at: record.lastPracticedAt,
        updated_at: record.updatedAt,
        total_attempted: record.totalAttempted,
        correct_count: record.correctCount,
        accuracy_percentage: record.accuracyPercentage,
        streak_count: record.streakCount,
        needs_review: record.needsReview,
        mastery_level: record.masteryLevel,
      });

      await (supabase as any).from('topic_mastery_history').insert({
        id: historyEntry.id,
        student_id: historyEntry.studentId,
        topic_id: historyEntry.topicId,
        previous_score: historyEntry.previousScore,
        new_score: historyEntry.newScore,
        delta: historyEntry.delta,
        source_context: historyEntry.sourceContext,
        attempt_count: historyEntry.attemptCount,
        accuracy: historyEntry.accuracy,
        note: historyEntry.note,
        created_at: historyEntry.timestamp,
      });
    } catch {
      // Ignored for resilient offline execution
    }
  }

  // ============================================================================
  // 3. SPECIALIZED MUTATION TRIGGERS (Diagnostic & Practice)
  // ============================================================================

  /**
   * Record practice question attempt and update mastery
   */
  public recordPracticeAttempt(params: {
    studentId: string;
    topicId: string;
    subjectId?: string;
    isCorrect: boolean;
    difficulty?: DifficultyLevel;
    timeSpentSeconds?: number;
    confidence?: ConfidenceLevel;
    sourceContext?: 'practice' | 'diagnostic' | 'mastery_test' | 'mock_exam' | 'learning_unit';
    questionId?: string;
    attemptedAt?: string;
  }): TopicMastery {
    const evidence: TopicAttemptEvidence = {
      questionId: params.questionId || `q-${Date.now()}`,
      isCorrect: params.isCorrect,
      difficulty: params.difficulty || 'medium',
      timeSpentSeconds: params.timeSpentSeconds || 60,
      confidence: params.confidence,
      sourceContext: params.sourceContext || 'practice',
      attemptedAt: params.attemptedAt || new Date().toISOString(),
    };

    return this.updateTopicMasterySync({
      studentId: params.studentId,
      topicId: params.topicId,
      subjectId: params.subjectId,
      evidence,
      sourceContext: params.sourceContext || 'practice',
      note: `Practice attempt on ${params.difficulty || 'medium'} difficulty question`,
    });
  }

  /**
   * Record diagnostic assessment performance for a topic
   */
  public recordDiagnosticAssessment(params: {
    studentId: string;
    topicId: string;
    subjectId?: string;
    attemptedCount: number;
    correctCount: number;
    accuracy: number;
    completedAt?: string;
  }): TopicMastery {
    const syntheticAttempts: TopicAttemptEvidence[] = [];
    const timestamp = params.completedAt || new Date().toISOString();

    for (let i = 0; i < params.attemptedCount; i++) {
      const isCorrect = i < params.correctCount;
      syntheticAttempts.push({
        questionId: `diag-q-${params.topicId}-${i}`,
        isCorrect,
        difficulty: i % 2 === 0 ? 'medium' : 'hard',
        timeSpentSeconds: 50,
        sourceContext: 'diagnostic',
        attemptedAt: timestamp,
      });
    }

    return this.updateTopicMasterySync({
      studentId: params.studentId,
      topicId: params.topicId,
      subjectId: params.subjectId,
      attempts: syntheticAttempts,
      sourceContext: 'diagnostic',
      note: `Baseline Diagnostic evaluation (${params.accuracy}% accuracy across ${params.attemptedCount} questions)`,
    });
  }

  // ============================================================================
  // 4. GET STUDENT MASTERY (Retrieval & Filtering)
  // ============================================================================

  /**
   * Get all topic mastery records for a student with aggregated summary statistics
   */
  public getStudentMastery(
    studentId: string,
    options?: StudentMasteryFilterOptions
  ): StudentMasterySummary {
    const resolvedStudentId = studentId || DEMO_STUDENT_ID;
    let topics: TopicMastery[] = [];

    for (const [key, mastery] of this.masteryStore.entries()) {
      if (key.startsWith(`${resolvedStudentId}:`)) {
        topics.push(mastery);
      }
    }

    // Apply filters
    if (options?.examType) {
      topics = topics.filter((m) => examConfigService.isSubjectAllowed(m.subjectId, options.examType!));
    }
    if (options?.subjectId && options.subjectId !== 'all') {
      topics = topics.filter((m) => m.subjectId === options.subjectId);
    }
    if (options?.status && options.status !== 'unassessed') {
      topics = topics.filter((m) => m.status === options.status);
    }
    if (options?.needsReview !== undefined) {
      topics = topics.filter((m) => m.needsReview === options.needsReview);
    }
    if (options?.minScore !== undefined) {
      topics = topics.filter((m) => m.masteryScore >= options.minScore!);
    }
    if (options?.maxScore !== undefined) {
      topics = topics.filter((m) => m.masteryScore <= options.maxScore!);
    }

    // Sort: weak first, then developing, then strong, then mastered, unassessed at end
    const statusWeight: Record<TopicMasteryStatus, number> = {
      weak: 1,
      developing: 2,
      strong: 3,
      mastered: 4,
      unassessed: 5,
    };
    topics.sort((a, b) => {
      const aStatus = a.status || 'unassessed';
      const bStatus = b.status || 'unassessed';
      return statusWeight[aStatus] - statusWeight[bStatus] || a.masteryScore - b.masteryScore;
    });

    if (options?.limit) {
      topics = topics.slice(0, options.limit);
    }

    // Compute aggregate summary
    const assessedTopics = topics.filter((t) => (t.status || 'unassessed') !== 'unassessed');
    const totalScore = assessedTopics.reduce((sum, t) => sum + t.masteryScore, 0);
    const averageMasteryScore =
      assessedTopics.length > 0 ? Math.round(totalScore / assessedTopics.length) : 0;

    const countsByStatus = {
      mastered: topics.filter((t) => t.status === 'mastered').length,
      strong: topics.filter((t) => t.status === 'strong').length,
      developing: topics.filter((t) => t.status === 'developing').length,
      weak: topics.filter((t) => t.status === 'weak').length,
      unassessed: topics.filter((t) => (t.status || 'unassessed') === 'unassessed').length,
    };

    return {
      studentId: resolvedStudentId,
      totalTopics: topics.length,
      assessedTopics: assessedTopics.length,
      averageMasteryScore,
      countsByStatus,
      topics,
    };
  }

  // ============================================================================
  // 5. WEAK TOPIC DETECTION
  // ============================================================================

  /**
   * Detects all weak topics for a student.
   * Weak topics are defined as having status === 'weak' (or score < 45) with attempted questions,
   * sorted by importance and lowest score first.
   */
  public getWeakTopics(
    studentId: string,
    options?: { limit?: number; subjectId?: string; examType?: ExamType }
  ): TopicMastery[] {
    const summary = this.getStudentMastery(studentId, {
      subjectId: options?.subjectId,
      examType: options?.examType,
    });

    const weakList = summary.topics.filter(
      (m) => m.status === 'weak' || (m.status === 'developing' && (m.accuracyPercentage ?? 0) < 50)
    );

    // Prioritize lowest score first
    weakList.sort((a, b) => a.masteryScore - b.masteryScore);

    return options?.limit ? weakList.slice(0, options.limit) : weakList;
  }

  // ============================================================================
  // 6. STRONG TOPIC DETECTION
  // ============================================================================

  /**
   * Detects strong and mastered topics for a student.
   * Strong topics are defined as having status === 'strong' or status === 'mastered' (score >= 70).
   */
  public getStrongTopics(
    studentId: string,
    options?: { limit?: number; subjectId?: string; examType?: ExamType }
  ): TopicMastery[] {
    const summary = this.getStudentMastery(studentId, {
      subjectId: options?.subjectId,
      examType: options?.examType,
    });

    const strongList = summary.topics.filter(
      (m) => m.status === 'strong' || m.status === 'mastered' || m.masteryScore >= 70
    );

    // Prioritize highest score first
    strongList.sort((a, b) => b.masteryScore - a.masteryScore);

    return options?.limit ? strongList.slice(0, options.limit) : strongList;
  }

  // ============================================================================
  // 7. MASTERY HISTORY RETRIEVAL
  // ============================================================================

  /**
   * Get historical progression timeline for a student's topic mastery
   */
  public getMasteryHistory(studentId: string, topicId?: string): TopicMasteryHistoryEntry[] {
    const resolvedStudentId = studentId || DEMO_STUDENT_ID;

    if (topicId) {
      const key = this.getStorageKey(resolvedStudentId, topicId);
      return this.historyStore.get(key) || [];
    }

    const allHistory: TopicMasteryHistoryEntry[] = [];
    for (const [key, entries] of this.historyStore.entries()) {
      if (key.startsWith(`${resolvedStudentId}:`)) {
        allHistory.push(...entries);
      }
    }

    return allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ============================================================================
  // 8. BACKWARD COMPATIBILITY METHODS
  // ============================================================================

  public async getTopicMastery(studentId: string, topicId: string): Promise<MasteryResult | null> {
    return this.getTopicMasterySync(studentId, topicId);
  }

  public getTopicMasteryRecordSync(studentId: string, topicId: string): TopicMastery | undefined {
    const key = this.getStorageKey(studentId, topicId);
    return this.masteryStore.get(key);
  }

  public getTopicMasterySync(studentId: string, topicId: string): MasteryResult {
    const key = this.getStorageKey(studentId, topicId);
    const existing = this.masteryStore.get(key);

    if (existing) {
      return {
        topicId: existing.topicId,
        studentId: existing.studentId,
        previousMasteryScore: Math.max(0, existing.masteryScore - 5),
        updatedMasteryScore: existing.masteryScore,
        masteryLevel: existing.masteryLevel || 'developing',
        accuracyPercentage: existing.accuracyPercentage ?? Math.round((existing.correctCount / Math.max(1, existing.totalAttempted)) * 100),
        timeSpentSeconds: 150,
        strengths: existing.masteryScore >= 70 ? ['Consistent high-yield accuracy'] : ['Baseline formulas identified'],
        weaknesses: existing.masteryScore < 50 ? ['Requires focused practice drills'] : [],
        recommendations: existing.masteryScore >= 70
          ? ['Reinforce with exam-level drills']
          : ['Study Key Formulas and worked examples'],
        passed: existing.masteryScore >= 60,
        completedAt: existing.updatedAt,
      };
    }

    return {
      topicId,
      studentId,
      previousMasteryScore: 0,
      updatedMasteryScore: 0,
      masteryLevel: 'novice',
      accuracyPercentage: 0,
      timeSpentSeconds: 0,
      strengths: ['Initial study unit opened'],
      weaknesses: ['Awaiting topic practice & diagnostic'],
      recommendations: ['Review Learn concepts and complete worked examples'],
      passed: false,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Legacy method for MasteryTestSection evaluation
   */
  public async evaluateTopicMastery(input: MasteryAssessmentInput): Promise<MasteryResult> {
    const key = this.getStorageKey(input.studentId, input.topicId);
    const existing = this.masteryStore.get(key);
    const previousScore = existing ? existing.masteryScore : 40;

    // Convert input attempts to TopicAttemptEvidence
    const evidenceList: TopicAttemptEvidence[] = input.attempts.map((att) => ({
      questionId: att.questionId,
      isCorrect: att.isCorrect,
      difficulty: att.difficulty,
      timeSpentSeconds: att.timeSpentSeconds,
      sourceContext: 'mastery_test',
      attemptedAt: new Date().toISOString(),
    }));

    // Update mastery via centralized model
    const updated = this.updateTopicMasterySync({
      studentId: input.studentId,
      topicId: input.topicId,
      attempts: evidenceList,
      previousScore,
      sourceContext: 'mastery_test',
      note: `Mastery Test completed (${input.testScore}/${input.totalQuestions} correct)`,
    });

    const accuracyPct = updated.accuracyPercentage ?? Math.round((updated.correctCount / Math.max(1, updated.totalAttempted)) * 100);
    const passed = accuracyPct >= 65;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    input.attempts.forEach((att) => {
      if (att.isCorrect) {
        strengths.push(`Mastered ${att.difficulty.replace('_', ' ')} question (#${att.questionId.slice(-4)})`);
      } else {
        weaknesses.push(`Struggled with ${att.difficulty.replace('_', ' ')} concept (#${att.questionId.slice(-4)})`);
      }
    });

    const recommendations: string[] = [];
    if (!passed) {
      recommendations.push('Revisit the Key Formulas and Worked Examples tabs before retaking');
      recommendations.push('Work through the recommended practice drills to target flagged traps');
    } else if (updated.status === 'mastered') {
      recommendations.push('Outstanding! You have reached exam-level mastery for this topic');
      recommendations.push('Schedule a revision drill in 5 days to reinforce long-term memory');
    } else {
      recommendations.push('Good progress! Solve 2 more exam-level questions to reach full mastery');
    }

    return {
      topicId: input.topicId,
      studentId: input.studentId,
      previousMasteryScore: previousScore,
      updatedMasteryScore: updated.masteryScore,
      masteryLevel: updated.masteryLevel || 'developing',
      accuracyPercentage: accuracyPct,
      timeSpentSeconds: input.timeSpentSeconds,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      recommendations,
      passed,
      completedAt: updated.updatedAt,
    };
  }
}

export const masteryService = new MasteryService();

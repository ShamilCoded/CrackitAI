/**
 * Topic Mastery Engine Types
 * Centralized contracts for estimating and tracking student topic mastery.
 */

import type { DifficultyLevel, ConfidenceLevel, ExamType } from './domain';

export type TopicMasteryStatus = 'unassessed' | 'weak' | 'developing' | 'strong' | 'mastered';

/**
 * Historical record for tracking student topic mastery changes over time
 */
export interface TopicMasteryHistoryEntry {
  id: string;
  studentId: string;
  topicId: string;
  previousScore: number;
  newScore: number;
  delta: number;
  sourceContext: 'diagnostic' | 'practice' | 'mastery_test' | 'mock_exam' | 'learning_unit';
  attemptCount: number;
  accuracy: number;
  timestamp: string;
  note?: string;
}

/**
 * Configurable parameters for the transparent MVP Mastery scoring model
 */
export interface MasteryScoringConfig {
  /**
   * Component Weights (must sum to 1.0)
   * Primary Signal: Overall Accuracy (50%)
   * Secondary Signals: Difficulty Weighting (25%), Recency & Exposure (15%)
   * Supporting Signals: Confidence Calibration & Time Efficiency (10%)
   */
  weightAccuracy: number;
  weightDifficulty: number;
  weightRecency: number;
  weightSupporting: number;

  /**
   * Multipliers applied to question difficulty levels
   */
  difficultyMultipliers: {
    easy: number;
    medium: number;
    hard: number;
    exam_level: number;
  };

  /**
   * Status classification boundaries (0 - 100)
   */
  statusThresholds: {
    mastered: number;   // >= 85: Full exam-level mastery
    strong: number;     // >= 70: Solid competence
    developing: number; // 45 to 69: Partial understanding needing review
    weak: number;       // < 45: Significant conceptual gap
  };

  /**
   * Minimum attempts needed before status transitions from 'unassessed'
   */
  minAttemptsThreshold: number;

  /**
   * Exponential moving average factor for incorporating historical score
   * updatedScore = (1 - alpha) * previousScore + alpha * newEvidenceScore
   */
  momentumAlpha: number;
}

/**
 * Default MVP configuration for topic mastery scoring
 */
export const DEFAULT_MASTERY_SCORING_CONFIG: MasteryScoringConfig = {
  weightAccuracy: 0.50,
  weightDifficulty: 0.25,
  weightRecency: 0.15,
  weightSupporting: 0.10,
  difficultyMultipliers: {
    easy: 0.8,
    medium: 1.0,
    hard: 1.3,
    exam_level: 1.5,
  },
  statusThresholds: {
    mastered: 85,
    strong: 70,
    developing: 45,
    weak: 0,
  },
  minAttemptsThreshold: 1,
  momentumAlpha: 0.35,
};

/**
 * Breakdown of individual scoring signals for transparency
 */
export interface MasteryScoreComponents {
  accuracySignal: number;
  difficultySignal: number;
  recencySignal: number;
  supportingSignal: number;
  rawScore: number;
  previousScore: number;
  finalScore: number;
}

/**
 * Central Topic Mastery Entity
 * Associates student, topic, mastery_score, status, last_assessed_at, last_practiced_at, and updated_at
 */
export interface TopicMastery {
  id: string;

  // Direct associations required by the specification
  studentId: string;
  student?: string; // alias
  topicId: string;
  topic?: string; // alias
  subjectId: string;
  masteryScore: number; // Strictly bounded between 0 and 100
  mastery_score?: number; // alias
  status?: TopicMasteryStatus;
  lastAssessedAt?: string | null;
  last_assessed_at?: string | null; // alias
  lastTestedAt?: string | null; // legacy alias
  lastPracticedAt?: string | null;
  last_practiced_at?: string | null; // alias
  updatedAt: string;
  updated_at?: string; // alias

  // Underlying statistical evidence
  totalAttempted: number;
  totalAttempts?: number; // alias
  correctCount: number;
  correctAttempts?: number; // alias
  accuracyPercentage?: number;
  streakCount: number;
  needsReview: boolean;

  // Backward compatibility alias for legacy components
  masteryLevel?: 'novice' | 'developing' | 'proficient' | 'mastered';

  // Mastery progression timeline
  history?: TopicMasteryHistoryEntry[];
}

/**
 * Topic evidence input for calculation
 */
export interface TopicAttemptEvidence {
  questionId: string;
  isCorrect: boolean;
  difficulty: DifficultyLevel;
  timeSpentSeconds: number;
  confidence?: ConfidenceLevel;
  sourceContext: 'diagnostic' | 'practice' | 'mastery_test' | 'mock_exam' | 'learning_unit';
  attemptedAt: string;
}

/**
 * Options for querying student topic mastery
 */
export interface StudentMasteryFilterOptions {
  examType?: ExamType;
  subjectId?: string;
  status?: TopicMasteryStatus;
  needsReview?: boolean;
  minScore?: number;
  maxScore?: number;
  limit?: number;
}

/**
 * Aggregated summary of student mastery across a syllabus
 */
export interface StudentMasterySummary {
  studentId: string;
  totalTopics: number;
  assessedTopics: number;
  averageMasteryScore: number;
  countsByStatus: {
    mastered: number;
    strong: number;
    developing: number;
    weak: number;
    unassessed: number;
  };
  topics: TopicMastery[];
}

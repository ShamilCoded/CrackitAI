/**
 * Topic Mastery Scoring Engine
 *
 * Centralized, deterministic scoring model for calculating topic mastery.
 *
 * MATHEMATICAL FORMULATION:
 * -------------------------
 * Mastery is estimated as a bounded value [0, 100] derived from four weighted evidence signals:
 *
 * 1. Accuracy Signal (S_acc, weight = 50%):
 *    Direct proportion of correct responses across all recorded attempts:
 *    S_acc = (correctCount / totalAttempted) * 100
 *
 * 2. Question Difficulty Signal (S_diff, weight = 25%):
 *    Questions are weighted by their cognitive complexity (easy = 0.8, medium = 1.0, hard = 1.3, exam_level = 1.5).
 *    Solving high-difficulty questions proves deeper conceptual understanding:
 *    S_diff = (Σ w_diff[i] * isCorrect[i]) / (Σ w_diff[i]) * 100
 *
 * 3. Recency & Repeated Exposure Signal (S_rec, weight = 15%):
 *    Recent attempts carry exponential weights compared to historical attempts:
 *    w_rec[i] = (1 + λ)^i where i is the attempt index ordered chronologically.
 *    S_rec = (Σ w_rec[i] * isCorrect[i]) / (Σ w_rec[i]) * 100
 *    Damped by exposure factor: damp = min(1.0, totalAttempts / minAttemptsThreshold).
 *
 * 4. Supporting Signal - Confidence & Time (S_sup, weight = 10%):
 *    - Metacognitive Calibration: High confidence + correct = 1.0; High confidence + incorrect = 0.0 (misconception).
 *    - Time Efficiency: Answers within standard exam pace (20s - 120s) receive full score.
 *    If confidence or time are not recorded, S_sup gracefully defaults to S_acc.
 *
 * COMPOSITE FORMULA:
 * -------------------
 * RawEvidence = (0.50 * S_acc) + (0.25 * S_diff) + (0.15 * S_rec) + (0.10 * S_sup)
 *
 * Moving Average Update (when prior mastery exists):
 * UpdatedMastery = (1 - α) * PreviousMastery + α * RawEvidence  (where α = momentumAlpha = 0.35)
 *
 * Strict Bounding:
 * FinalMasteryScore = max(0, min(100, round(UpdatedMastery)))
 *
 * STATUS CLASSIFICATION:
 * ----------------------
 * - 'unassessed' : 0 attempts recorded
 * - 'mastered'   : score >= 85
 * - 'strong'     : score >= 70
 * - 'developing' : 45 <= score < 70
 * - 'weak'       : score < 45
 */

import type {
  TopicMasteryStatus,
  MasteryScoringConfig,
  MasteryScoreComponents,
  TopicAttemptEvidence,
} from '@/types/mastery';
import { DEFAULT_MASTERY_SCORING_CONFIG } from '@/types/mastery';

export class TopicMasteryScoringEngine {
  private config: MasteryScoringConfig;

  constructor(configOverrides?: Partial<MasteryScoringConfig>) {
    this.config = {
      ...DEFAULT_MASTERY_SCORING_CONFIG,
      ...configOverrides,
      difficultyMultipliers: {
        ...DEFAULT_MASTERY_SCORING_CONFIG.difficultyMultipliers,
        ...(configOverrides?.difficultyMultipliers || {}),
      },
      statusThresholds: {
        ...DEFAULT_MASTERY_SCORING_CONFIG.statusThresholds,
        ...(configOverrides?.statusThresholds || {}),
      },
    };
  }

  /**
   * Update active scoring configuration
   */
  public configure(configOverrides: Partial<MasteryScoringConfig>): void {
    this.config = {
      ...this.config,
      ...configOverrides,
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): MasteryScoringConfig {
    return { ...this.config };
  }

  /**
   * Calculate mastery score and component signals given historical attempt evidence
   */
  public calculateScoreFromEvidence(params: {
    attempts: TopicAttemptEvidence[];
    previousScore?: number;
    configOverrides?: Partial<MasteryScoringConfig>;
  }): MasteryScoreComponents {
    const config = params.configOverrides ? { ...this.config, ...params.configOverrides } : this.config;
    const { attempts } = params;
    const previousScore = params.previousScore !== undefined ? params.previousScore : 0;

    // Edge case: No attempts recorded
    if (!attempts || attempts.length === 0) {
      return {
        accuracySignal: 0,
        difficultySignal: 0,
        recencySignal: 0,
        supportingSignal: 0,
        rawScore: previousScore,
        previousScore,
        finalScore: previousScore,
      };
    }

    const totalAttempts = attempts.length;
    const correctCount = attempts.filter((a) => a.isCorrect).length;

    // 1. Accuracy Signal (S_acc)
    const accuracySignal = (correctCount / totalAttempts) * 100;

    // 2. Difficulty Signal (S_diff)
    let totalDifficultyWeight = 0;
    let earnedDifficultyWeight = 0;

    for (const attempt of attempts) {
      const multiplier =
        config.difficultyMultipliers[attempt.difficulty] ||
        config.difficultyMultipliers.medium;
      totalDifficultyWeight += multiplier;
      if (attempt.isCorrect) {
        earnedDifficultyWeight += multiplier;
      }
    }

    const difficultySignal =
      totalDifficultyWeight > 0
        ? (earnedDifficultyWeight / totalDifficultyWeight) * 100
        : accuracySignal;

    // 3. Recency & Repeated Exposure Signal (S_rec)
    // Sort chronologically ascending
    const sortedAttempts = [...attempts].sort((a, b) =>
      new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime()
    );

    let recencyWeightSum = 0;
    let recencyEarnedSum = 0;
    const lambda = 0.15; // Growth factor for recency

    sortedAttempts.forEach((attempt, index) => {
      const weight = Math.pow(1 + lambda, index);
      recencyWeightSum += weight;
      if (attempt.isCorrect) {
        recencyEarnedSum += weight;
      }
    });

    const rawRecency =
      recencyWeightSum > 0 ? (recencyEarnedSum / recencyWeightSum) * 100 : accuracySignal;

    // Exposure damping: require at least 3 attempts to reach extreme bounds
    const exposureFactor = Math.min(1.0, Math.max(0.4, totalAttempts / 3));
    const recencySignal = rawRecency * exposureFactor + 50 * (1 - exposureFactor);

    // 4. Supporting Signals (Confidence & Time)
    let supportingPoints = 0;
    let supportingCount = 0;

    for (const attempt of attempts) {
      let itemScore = attempt.isCorrect ? 100 : 0;

      // Confidence calibration adjustment
      if (attempt.confidence) {
        if (attempt.isCorrect) {
          itemScore = attempt.confidence === 'high' ? 100 : attempt.confidence === 'medium' ? 85 : 65;
        } else {
          // High confidence error = misconception penalty
          itemScore = attempt.confidence === 'high' ? 0 : attempt.confidence === 'medium' ? 15 : 30;
        }
      }

      // Time efficiency adjustment (target 20s to 120s per question)
      if (attempt.timeSpentSeconds > 0) {
        if (attempt.timeSpentSeconds > 180) {
          itemScore *= 0.85; // Excessively slow retrieval
        } else if (attempt.timeSpentSeconds < 10 && attempt.isCorrect) {
          itemScore *= 0.90; // Likely lucky rushed guess
        }
      }

      supportingPoints += itemScore;
      supportingCount += 1;
    }

    const supportingSignal =
      supportingCount > 0 ? supportingPoints / supportingCount : accuracySignal;

    // Composite Raw Evidence calculation
    const rawScore =
      config.weightAccuracy * accuracySignal +
      config.weightDifficulty * difficultySignal +
      config.weightRecency * recencySignal +
      config.weightSupporting * supportingSignal;

    // Moving average update with historical score if prior evidence exists
    let finalCalculatedScore = rawScore;
    if (previousScore > 0 && attempts.length < 5) {
      finalCalculatedScore =
        (1 - config.momentumAlpha) * previousScore + config.momentumAlpha * rawScore;
    }

    // Strict mathematical bounding: [0, 100]
    const finalScore = Math.max(0, Math.min(100, Math.round(finalCalculatedScore)));

    return {
      accuracySignal: Math.round(accuracySignal),
      difficultySignal: Math.round(difficultySignal),
      recencySignal: Math.round(recencySignal),
      supportingSignal: Math.round(supportingSignal),
      rawScore: Math.round(rawScore),
      previousScore,
      finalScore,
    };
  }

  /**
   * Determine TopicMasteryStatus based on score and attempt count
   */
  public determineStatus(score: number, totalAttempts: number): TopicMasteryStatus {
    if (totalAttempts === 0) {
      return 'unassessed';
    }
    if (score >= this.config.statusThresholds.mastered) {
      return 'mastered';
    }
    if (score >= this.config.statusThresholds.strong) {
      return 'strong';
    }
    if (score >= this.config.statusThresholds.developing) {
      return 'developing';
    }
    return 'weak';
  }

  /**
   * Map status to legacy MasteryLevel
   */
  public mapStatusToLegacyLevel(status: TopicMasteryStatus): 'novice' | 'developing' | 'proficient' | 'mastered' {
    switch (status) {
      case 'mastered':
        return 'mastered';
      case 'strong':
        return 'proficient';
      case 'developing':
        return 'developing';
      case 'weak':
      case 'unassessed':
      default:
        return 'novice';
    }
  }
}

export const topicMasteryScoringEngine = new TopicMasteryScoringEngine();

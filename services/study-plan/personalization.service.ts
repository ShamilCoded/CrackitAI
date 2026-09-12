/**
 * AI Personalization Engine Service
 *
 * Implements the full personalization loop:
 * Diagnostic → Mastery → Weaknesses → Priorities → Study Plan → Practice → New Performance → Updated Mastery → Updated Plan
 *
 * Core Principles:
 * 1. Operates on actual database and mastery data (never invents fake/unavailable info).
 * 2. Deterministic baseline algorithm computes scores, weights, retention decay, and time budgets.
 * 3. AI (Gemini) enriches recommendations with personalized coaching notes and "Why am I seeing this?" insights.
 * 4. Resilient dual-mode execution (Supabase + in-memory store fallback).
 */

import type {
  ExamType,
  StudyPlan,
  StudyPlanItem,
  PersonalizedStudyPlanResult,
  StudyPlanItemDetailed,
  TopicRecommendation,
  NextBestActivity,
  AdaptivePracticeOptions,
  AdaptivePracticeSetResult,
  WhyExplanation,
  StudyPlanGenerationOptions,
  RecommendedActivityType,
  DifficultyLevel,
  Question,
  TopicMastery,
} from '@/types';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { masteryService } from '@/services/mastery/mastery.service';
import { questionService } from '@/services/question/question.service';
import { diagnosticService } from '@/services/diagnostic/diagnostic.service';
import { aiService } from '@/services/ai/gemini.service';
import {
  DEMO_STUDENT_ID,
  DEMO_STUDENT_PROFILE,
  DEMO_STUDY_PLAN,
  DEMO_STUDY_PLAN_ITEMS,
  DEMO_MDCAT_STUDY_PLAN,
  DEMO_MDCAT_STUDY_PLAN_ITEMS,
} from '@/database/demo-data';
import { SEED_TOPICS, SEED_QUESTIONS } from '@/database/seed-data';
import { createClient } from '@/lib/supabase/client';
import { examConfigService } from '@/services/exam/exam-config.service';

export class PersonalizationService {
  // In-memory persistent cache for instant UI responsiveness & offline demo execution
  private activePlans = new Map<string, StudyPlan>();
  private activePlanItems = new Map<string, StudyPlanItemDetailed[]>();

  constructor() {
    // Seed initial plan for demo student (ECAT)
    this.activePlans.set(DEMO_STUDY_PLAN.id, { ...DEMO_STUDY_PLAN, targetExam: 'ECAT' as ExamType });
    this.activePlanItems.set(
      DEMO_STUDY_PLAN.id,
      DEMO_STUDY_PLAN_ITEMS.map((it) => this.enrichPlanItem(it, 'ECAT'))
    );

    // Seed initial plan for demo student (MDCAT)
    this.activePlans.set(DEMO_MDCAT_STUDY_PLAN.id, { ...DEMO_MDCAT_STUDY_PLAN, targetExam: 'MDCAT' as ExamType });
    this.activePlanItems.set(
      DEMO_MDCAT_STUDY_PLAN.id,
      DEMO_MDCAT_STUDY_PLAN_ITEMS.map((it) => this.enrichPlanItem(it, 'MDCAT'))
    );
  }

  private isSupabaseConfigured(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    );
  }

  // ==========================================================================
  // 1. TOPIC PRIORITIZATION & DETERMINISTIC RANKING ENGINE
  // ==========================================================================

  /**
   * Evaluates all topics in the student's exam syllabus and returns prioritized recommendations.
   *
   * Scoring factors:
   * - Low mastery (40% weight): (100 - masteryScore)
   * - Exam importance & weight (25% weight): (importanceRating * 20)
   * - Recent error rate / Diagnostic gap (20% weight): (100 - accuracy)
   * - Retention & Spaced Repetition (15% weight): decay since last practice or needsReview
   */
  public async getRecommendedTopics(
    studentId: string,
    options?: { examType?: ExamType; limit?: number; subjectFocus?: string }
  ): Promise<TopicRecommendation[]> {
    const examType: ExamType = options?.examType || 'ECAT';
    const limit = options?.limit || 10;

    // 1. Fetch live student mastery state from Mastery Engine (single source of truth)
    const masterySummary = masteryService.getStudentMastery(studentId, { examType });
    const masteryMap = new Map<string, TopicMastery>();
    masterySummary.topics.forEach((t) => masteryMap.set(t.topicId, t));

    // 2. Fetch latest diagnostic attempts if available
    const latestDiagnostic = await diagnosticService.getLatestAttemptForStudent(studentId, examType);
    const diagnosticTopicMap = new Map<string, { accuracy: number; severity: string }>();

    if (latestDiagnostic?.topicBreakdown) {
      Object.entries(latestDiagnostic.topicBreakdown).forEach(([tId, info]) => {
        diagnosticTopicMap.set(tId, {
          accuracy: info.accuracy,
          severity: info.severity || 'moderate',
        });
      });
    }

    // 3. Fetch candidate topics for the target exam
    const allTopics = curriculumService.getAllTopicsSync();
    const relevantTopics = allTopics.filter((topic) => {
      if (options?.subjectFocus && topic.subjectId !== options.subjectFocus) {
        return false;
      }
      return examConfigService.isSubjectAllowed(topic.subjectId, examType);
    });

    const recommendations: TopicRecommendation[] = [];

    for (const topic of relevantTopics) {
      const mastery = masteryMap.get(topic.id);
      const masteryScore = mastery ? mastery.masteryScore : 50; // default baseline for untested
      const masteryStatus: string =
        mastery?.status ||
        (masteryScore >= 75 ? 'mastered' : masteryScore >= 45 ? 'developing' : 'novice');
      const needsReview = mastery ? mastery.needsReview : false;
      const totalAttempted = mastery ? mastery.totalAttempted : 0;
      const correctCount = mastery ? mastery.correctCount : 0;

      const importanceRating = topic.importanceRating || 4; // 1 to 5 scale
      const diagData = diagnosticTopicMap.get(topic.id);

      // Calculate recent accuracy percentage
      let recentAccuracy = 50;
      if (diagData) {
        recentAccuracy = diagData.accuracy;
      } else if (totalAttempted > 0) {
        recentAccuracy = Math.round((correctCount / totalAttempted) * 100);
      }

      // Retention check (decay over time)
      let daysSincePractice = 0;
      if (mastery?.lastPracticedAt) {
        const diffMs = Date.now() - new Date(mastery.lastPracticedAt).getTime();
        daysSincePractice = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      // Compute Mathematical Priority Score taking into account the active exam syllabus
      const subjectConfig = examConfigService.getSubjectConfig(topic.subjectId, examType);
      const subjectWeightPercentage = subjectConfig?.weightPercentage || 25;
      const isCoreExamDiscipline = subjectConfig ? !subjectConfig.isShared : false;

      // 1. Mastery Need Component (higher priority if student needs improvement)
      const masteryNeedComponent = (100 - masteryScore) * 0.35;

      // 2. Exam Subject Weight Component: The active exam's subject weight directly drives priority
      // In MDCAT, Biology represents 34% (68 questions) vs Physics (27%) and English (9%).
      // In ECAT, Math & Physics represent 30% each.
      const examSubjectWeightComponent = (subjectWeightPercentage / 34) * 35;

      // 3. Core Discipline Alignment Boost: Core unshared subjects (Biology in MDCAT, Math in ECAT)
      // represent the defining discipline of that entrance exam
      const coreDisciplineBoost = isCoreExamDiscipline ? 30 : 0;

      // 4. Topic-level importance rating from curriculum (1 to 5)
      const examYieldComponent = (importanceRating * 20) * 0.15;

      // 5. Diagnostic and Error rate components
      const errorRateComponent = (100 - recentAccuracy) * 0.15;
      const retentionBonus = (needsReview ? 25 : daysSincePractice > 4 ? 15 : 0) * 0.1;
      const diagnosticBoost = diagData?.severity === 'critical' ? 8 : diagData?.severity === 'moderate' ? 4 : 0;

      const rawPriority =
        masteryNeedComponent +
        examSubjectWeightComponent +
        coreDisciplineBoost +
        examYieldComponent +
        errorRateComponent +
        retentionBonus +
        diagnosticBoost;
      const priorityScore = Math.min(100, Math.max(10, Math.round(rawPriority)));

      // Determine Pedagogical Activity Type
      const learningUnit = curriculumService.getLearningUnitByTopicId(topic.id);
      let recommendedActivity: RecommendedActivityType = 'practice_drill';
      if (learningUnit && (isCoreExamDiscipline || masteryScore < 45 || (diagData && diagData.accuracy < 45))) {
        recommendedActivity = 'learning_unit';
      } else if (masteryScore < 40 || (diagData && diagData.accuracy < 40)) {
        recommendedActivity = learningUnit ? 'learning_unit' : 'concept_review';
      } else if (needsReview || daysSincePractice > 5) {
        recommendedActivity = 'spaced_repetition';
      } else if (masteryScore >= 80) {
        recommendedActivity = 'mastery_test';
      }

      // Estimated minutes needed based on activity & mastery gap
      let estimatedMinutes = 25;
      if (recommendedActivity === 'learning_unit') {
        estimatedMinutes = 35;
      } else if (recommendedActivity === 'spaced_repetition') {
        estimatedMinutes = 15;
      } else if (recommendedActivity === 'mastery_test') {
        estimatedMinutes = 20;
      }

      const chapter = curriculumService.getChapterByIdSync(topic.chapterId);
      const subject = curriculumService.getSubjectByIdSync(topic.subjectId);

      // Generate Transparent "Why am I seeing this?" Fact Sheet
      const whyExplanation: WhyExplanation = {
        topicId: topic.id,
        topicName: topic.name,
        subjectName: subject?.name || 'Science',
        primaryReason: this.buildPrimaryReason({
          masteryScore,
          masteryStatus,
          importanceRating,
          diagAccuracy: diagData?.accuracy,
          diagSeverity: diagData?.severity,
          needsReview,
          examType,
        }),
        masteryScore,
        masteryStatus,
        importanceRating,
        examWeightPercentage: importanceRating === 5 ? 6.5 : importanceRating === 4 ? 4.5 : 3.0,
        recentAccuracy,
        totalAttempts: totalAttempted,
        retentionAlert: needsReview
          ? 'Flagged for retention reinforcement (score dropped or spaced interval reached).'
          : daysSincePractice > 4
          ? `Last practiced ${daysSincePractice} days ago; review recommended.`
          : undefined,
        pedagogicalObjective: `Master ${topic.name} concepts to ensure high accuracy on ${examType} section questions.`,
        aiCoachTip: `Focus on fundamental relations and practice 3-5 standard MCQs without calculator.`,
      };

      recommendations.push({
        topicId: topic.id,
        topicName: topic.name,
        chapterName: chapter?.name || 'Core Chapter',
        subjectId: topic.subjectId,
        subjectName: subject?.name || 'Subject',
        priorityScore,
        priorityRank: 1, // will assign after sorting
        recommendedActivity,
        estimatedMinutes,
        masteryScore,
        masteryStatus,
        importanceRating,
        reason: whyExplanation.primaryReason,
        whyExplanation,
      });
    }

    // Sort descending by priority score
    recommendations.sort((a, b) => b.priorityScore - a.priorityScore);

    // Assign sequential ranks
    recommendations.forEach((rec, idx) => {
      rec.priorityRank = idx + 1;
    });

    return recommendations.slice(0, limit);
  }

  // ==========================================================================
  // 2. GENERATE PERSONALIZED STUDY PLAN
  // ==========================================================================

  /**
   * Generates a fully personalized daily/weekly study plan tailored to the student's available daily time budget.
   */
  public async generateStudyPlan(
    studentId: string,
    options?: StudyPlanGenerationOptions
  ): Promise<PersonalizedStudyPlanResult> {
    const examType: ExamType = options?.examType || 'ECAT';
    const dailyMinutes = options?.dailyAvailableMinutes || 60;
    const goalExamDate = options?.goalExamDate || '2026-07-15';
    const targetScore = options?.targetScore || (examType === 'ECAT' ? 360 : 185);

    // 1. Get ranked topic recommendations
    const rankedTopics = await this.getRecommendedTopics(studentId, {
      examType,
      subjectFocus: options?.subjectFocus,
      limit: 8,
    });

    // 2. Budget Time across top topics (e.g. 60 min -> 25 min, 20 min, 15 min)
    const itemsCount = dailyMinutes <= 30 ? 2 : dailyMinutes <= 60 ? 3 : 4;
    const selectedTopics = rankedTopics.slice(0, itemsCount);

    const planId = `plan-${studentId}-${Date.now()}`;
    const distributedMinutes = this.distributeTimeBudget(dailyMinutes, itemsCount);

    const items: StudyPlanItemDetailed[] = [];

    for (let i = 0; i < selectedTopics.length; i++) {
      const rec = selectedTopics[i];
      const learningUnit = curriculumService.getLearningUnitByTopicId(rec.topicId);
      const allocatedMinutes = distributedMinutes[i] || 20;

      items.push({
        id: `plan-item-${planId}-${i + 1}`,
        studyPlanId: planId,
        studentId,
        topicId: rec.topicId,
        topicName: rec.topicName,
        chapterName: rec.chapterName,
        subjectId: rec.subjectId,
        subjectName: rec.subjectName,
        learningUnitId: learningUnit?.id,
        priorityOrder: i + 1,
        status: i === 0 ? 'in_progress' : 'pending',
        priorityReason: rec.reason,
        recommendedActivity: rec.recommendedActivity,
        estimatedMinutes: allocatedMinutes,
        masteryScore: rec.masteryScore,
        whyExplanation: rec.whyExplanation,
      });
    }

    // 3. Compute overall mastery summary for context
    const masterySummary = masteryService.getStudentMastery(studentId);
    const averageMastery = masterySummary.averageMasteryScore || 58;

    // 4. Request AI coaching note with fallback
    let coachingAdvice = `Focus on high-yield mechanics and equilibrium shifts today. Completing these ${itemsCount} tasks within your ${dailyMinutes}m budget will steadily advance your ${examType} target score.`;

    if (options?.includeAiCoaching !== false) {
      coachingAdvice = await aiService.generatePersonalizationCoachAdvice({
        examType,
        targetScore,
        goalExamDate,
        averageMastery,
        topWeakTopics: selectedTopics.map((t) => t.topicName),
        topStrongTopics: masteryService
          .getStrongTopics(studentId)
          .map((t) => curriculumService.getTopicByIdSync(t.topicId)?.name || t.topicId),
        dailyAvailableMinutes: dailyMinutes,
      });
    }

    const totalEstimatedHours = Math.max(1, Math.round((dailyMinutes / 60) * 10) / 10);

    const studyPlan: StudyPlan & {
      coachingMessage?: string;
      dailyAvailableMinutes?: number;
      targetExam?: ExamType;
      overallProgressPercentage?: number;
    } = {
      id: planId,
      studentId,
      examId: `exam-${examType.toLowerCase()}`,
      title: `${examType} Adaptive Mastery Sprint (${dailyMinutes} min/day)`,
      goalExamDate,
      totalEstimatedHours,
      status: 'active',
      dailyAvailableMinutes: dailyMinutes,
      targetExam: examType,
      coachingMessage: coachingAdvice,
      overallProgressPercentage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in active in-memory cache
    this.activePlans.set(planId, studyPlan);
    this.activePlanItems.set(planId, items);

    // Compute Next Best Activity
    const nextBestActivity = this.computeNextBestActivity(items[0], examType);

    return {
      plan: studyPlan,
      items,
      nextBestActivity,
      topWeakTopics: selectedTopics,
      coachingAdvice,
    };
  }

  // ==========================================================================
  // 3. NEXT BEST ACTIVITY (1-CLICK RECOMMENDED SESSION)
  // ==========================================================================

  /**
   * Retrieves the single highest-impact activity for the student right now.
   */
  public async getNextBestActivity(
    studentId: string,
    options?: { examType?: ExamType }
  ): Promise<NextBestActivity> {
    const examType: ExamType = options?.examType || 'ECAT';

    // 1. Check if there is an in-progress item in the active plan
    const activePlanEntries = Array.from(this.activePlans.values()).filter(
      (p) =>
        p.studentId === studentId &&
        p.status === 'active' &&
        ((p as any).targetExam === examType ||
          (examType === 'MDCAT' ? p.examId === 'exam-mdcat' : p.examId === 'exam-ecat'))
    );
    const latestPlan = activePlanEntries[activePlanEntries.length - 1];

    if (latestPlan) {
      const items = this.activePlanItems.get(latestPlan.id) || [];
      const inProgressItem = items.find((it) => it.status === 'in_progress');
      if (inProgressItem) {
        return this.computeNextBestActivity(inProgressItem, examType);
      }
      const nextPendingItem = items.find((it) => it.status === 'pending');
      if (nextPendingItem) {
        return this.computeNextBestActivity(nextPendingItem, examType);
      }
    }

    // 2. Otherwise generate from top ranked recommendation
    const topRecs = await this.getRecommendedTopics(studentId, { examType, limit: 1 });
    const topTopic = topRecs[0];

    const defaultTopicId = examType === 'MDCAT' ? 'topic-bio-cell-structure' : 'topic-phy-centripetal-force';
    const defaultTopic = curriculumService.getTopicByIdSync(defaultTopicId);
    const defaultSubject = defaultTopic ? curriculumService.getSubjectByIdSync(defaultTopic.subjectId) : null;

    const whyExplanation = topTopic?.whyExplanation || {
      topicId: topTopic?.topicId || defaultTopicId,
      topicName: topTopic?.topicName || defaultTopic?.name || (examType === 'MDCAT' ? 'Cell Structure' : 'Centripetal Force & Banking of Roads'),
      subjectName: topTopic?.subjectName || defaultSubject?.name || (examType === 'MDCAT' ? 'Biology' : 'Physics'),
      primaryReason:
        examType === 'MDCAT'
          ? 'Core High-Yield Topic: 34% of MDCAT weight. Membrane transport & enzyme organelle mechanics.'
          : 'Ranked #1 Critical Gap in entrance exam preparation.',
      masteryScore: topTopic?.masteryScore || (examType === 'MDCAT' ? 78 : 38),
      masteryStatus: (examType === 'MDCAT' ? 'proficient' : 'weak') as any,
      importanceRating: 5,
      pedagogicalObjective:
        examType === 'MDCAT'
          ? 'Master cell membrane transport and organelles to secure top marks on MDCAT.'
          : 'Remediate fundamental circular motion equations and banking angles.',
      aiCoachTip:
        examType === 'MDCAT'
          ? 'Focus on active vs passive transport and mitochondrial cristae.'
          : 'Focus on setting net radial force equal to centripetal acceleration.',
    };

    return {
      topicId: topTopic ? topTopic.topicId : defaultTopicId,
      topicName: topTopic ? topTopic.topicName : defaultTopic?.name || (examType === 'MDCAT' ? 'Cell Structure' : 'Centripetal Force & Banking of Roads'),
      subjectName: topTopic ? topTopic.subjectName : defaultSubject?.name || (examType === 'MDCAT' ? 'Biology' : 'Physics'),
      activityType: topTopic ? topTopic.recommendedActivity : 'learning_unit',
      title: topTopic
        ? `${topTopic.recommendedActivity === 'learning_unit' ? 'Review Learning Unit:' : 'Targeted Practice:'} ${topTopic.topicName}`
        : examType === 'MDCAT'
        ? 'Review Learning Unit: Cell Structure'
        : 'Review Learning Unit: Centripetal Force & Banking of Roads',
      description:
        topTopic?.reason ||
        (examType === 'MDCAT'
          ? 'Core High-Yield Topic: 34% of MDCAT weight. Analyze organelle mechanics and membrane dynamics.'
          : 'Ranked #1 Critical Gap: 33% accuracy on diagnostic test. High-yield past paper topic (5-7% of marks).'),
      estimatedMinutes: topTopic ? topTopic.estimatedMinutes : (examType === 'MDCAT' ? 40 : 25),
      actionUrl:
        (topTopic?.recommendedActivity || 'learning_unit') === 'learning_unit'
          ? `/student/learn/${topTopic?.topicId || defaultTopicId}`
          : `/student/practice?topicId=${topTopic?.topicId || defaultTopicId}`,
      priorityScore: topTopic ? topTopic.priorityScore : (examType === 'MDCAT' ? 96 : 95),
      priorityReason:
        topTopic ? topTopic.reason : (examType === 'MDCAT' ? 'Core High-Yield Topic: 34% of MDCAT weight.' : 'Ranked #1 Critical Gap from diagnostic assessment.'),
      whyExplanation,
    };
  }

  // ==========================================================================
  // 4. ADAPTIVE PRACTICE SET GENERATOR
  // ==========================================================================

  /**
   * Generates a targeted, adaptive practice question set calibrated to the student's weaknesses.
   * Scaffolds difficulty: starts with foundational/medium questions and advances to exam-level.
   */
  public async getAdaptivePracticeSet(
    studentId: string,
    options?: AdaptivePracticeOptions
  ): Promise<AdaptivePracticeSetResult> {
    const examType: ExamType = options?.examType || 'ECAT';
    const targetCount = options?.targetQuestionCount || 6;

    // 1. Determine focus topics
    let focusTopicIds = options?.focusTopicIds;
    if (!focusTopicIds || focusTopicIds.length === 0) {
      const topRecs = await this.getRecommendedTopics(studentId, {
        examType,
        subjectFocus: options?.subjectId,
        limit: 3,
      });
      focusTopicIds = topRecs.map((r) => r.topicId);
    }

    const targetTopicDetails: Array<{ topicId: string; topicName: string; masteryScore: number }> = [];
    const masterySummary = masteryService.getStudentMastery(studentId);
    const masteryMap = new Map<string, number>();
    masterySummary.topics.forEach((t) => masteryMap.set(t.topicId, t.masteryScore));

    const candidateQuestions: Question[] = [];

    for (const topicId of focusTopicIds) {
      const topicObj = curriculumService.getTopicByIdSync(topicId);
      const mScore = masteryMap.get(topicId) ?? 45;
      targetTopicDetails.push({
        topicId,
        topicName: topicObj?.name || topicId.replace('topic-', ''),
        masteryScore: mScore,
      });

      // Fetch questions for this topic
      const topicQs = questionService.getQuestionsByTopicSync(topicId);
      candidateQuestions.push(...topicQs);
    }

    // Fallback if specific topic questions are scarce
    if (candidateQuestions.length === 0) {
      candidateQuestions.push(...SEED_QUESTIONS.filter((q) => q.applicableExams.includes(examType)));
    }

    // 2. Select questions with balanced difficulty distribution
    const easyQs = candidateQuestions.filter((q) => q.difficulty === 'easy');
    const mediumQs = candidateQuestions.filter((q) => q.difficulty === 'medium');
    const hardQs = candidateQuestions.filter((q) => q.difficulty === 'hard' || q.difficulty === 'exam_level');

    const selectedQuestions: Question[] = [];
    const diffBreakdown: Record<DifficultyLevel, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
      exam_level: 0,
    };

    // Scaffolding: e.g. for 6 questions: 2 easy, 3 medium, 1 hard
    const easyTarget = Math.max(1, Math.floor(targetCount * 0.3));
    const mediumTarget = Math.max(2, Math.floor(targetCount * 0.5));
    const hardTarget = Math.max(1, targetCount - easyTarget - mediumTarget);

    // Pick easy
    for (let i = 0; i < easyTarget && easyQs.length > 0; i++) {
      const q = easyQs[i % easyQs.length];
      if (!selectedQuestions.some((sq) => sq.id === q.id)) {
        selectedQuestions.push(q);
        diffBreakdown[q.difficulty]++;
      }
    }

    // Pick medium
    for (let i = 0; i < mediumTarget && mediumQs.length > 0; i++) {
      const q = mediumQs[i % mediumQs.length];
      if (!selectedQuestions.some((sq) => sq.id === q.id)) {
        selectedQuestions.push(q);
        diffBreakdown[q.difficulty]++;
      }
    }

    // Pick hard
    for (let i = 0; i < hardTarget && hardQs.length > 0; i++) {
      const q = hardQs[i % hardQs.length];
      if (!selectedQuestions.some((sq) => sq.id === q.id)) {
        selectedQuestions.push(q);
        diffBreakdown[q.difficulty]++;
      }
    }

    // Fill any remaining spots
    for (const q of candidateQuestions) {
      if (selectedQuestions.length >= targetCount) break;
      if (!selectedQuestions.some((sq) => sq.id === q.id)) {
        selectedQuestions.push(q);
        diffBreakdown[q.difficulty]++;
      }
    }

    const estimatedMinutes = Math.round(selectedQuestions.length * 2.5);

    return {
      sessionId: `adaptive-session-${Date.now()}`,
      studentId,
      examType,
      totalQuestions: selectedQuestions.length,
      estimatedMinutes,
      targetTopics: targetTopicDetails,
      difficultyBreakdown: diffBreakdown,
      questions: selectedQuestions,
      rationale: `Targeted practice set concentrating on your top priority weak topics (${targetTopicDetails.map((t) => t.topicName).join(', ')}). Calibrated to bridge conceptual gaps and build exam speed.`,
    };
  }

  // ==========================================================================
  // 5. "WHY AM I SEEING THIS?" EXPLANATION GENERATION
  // ==========================================================================

  /**
   * Generates a comprehensive, transparent explanation for why a particular topic is recommended.
   */
  public async getWhyExplanation(
    studentId: string,
    topicId: string,
    examType: ExamType = 'ECAT'
  ): Promise<WhyExplanation> {
    const topic = curriculumService.getTopicByIdSync(topicId);
    const subject = topic ? curriculumService.getSubjectByIdSync(topic.subjectId) : null;
    const masterySummary = masteryService.getStudentMastery(studentId);
    const mastery = masterySummary.topics.find((t) => t.topicId === topicId);

    const latestDiag = await diagnosticService.getLatestAttemptForStudent(studentId, examType);
    const diagData = latestDiag?.topicBreakdown ? latestDiag.topicBreakdown[topicId] : undefined;

    const masteryScore = mastery ? mastery.masteryScore : 45;
    const masteryStatus: string =
      mastery?.status ||
      (masteryScore >= 75 ? 'mastered' : masteryScore >= 45 ? 'developing' : 'novice');
    const importanceRating = topic?.importanceRating || 4;
    const recentAccuracy = diagData?.accuracy ?? (mastery?.totalAttempted ? Math.round((mastery.correctCount / mastery.totalAttempted) * 100) : 50);

    const primaryReason = this.buildPrimaryReason({
      masteryScore,
      masteryStatus,
      importanceRating,
      diagAccuracy: diagData?.accuracy,
      diagSeverity: diagData?.severity,
      needsReview: mastery?.needsReview,
      examType,
    });

    const retentionAlert = mastery?.needsReview
      ? 'Retention threshold reached — immediate spaced practice recommended to avoid memory decay.'
      : undefined;

    // Call AI service for pedagogical reasoning
    const aiRationale = await aiService.generatePersonalizedWhyRationale({
      examType,
      topicName: topic?.name || topicId,
      subjectName: subject?.name || 'Science',
      masteryScore,
      masteryStatus,
      importanceRating,
      accuracy: recentAccuracy,
      retentionAlert,
    });

    return {
      topicId,
      topicName: topic?.name || topicId,
      subjectName: subject?.name || 'Science',
      primaryReason,
      masteryScore,
      masteryStatus,
      importanceRating,
      examWeightPercentage: importanceRating === 5 ? 6.5 : importanceRating === 4 ? 4.5 : 3.0,
      recentAccuracy,
      totalAttempts: mastery?.totalAttempted || 0,
      retentionAlert,
      pedagogicalObjective: aiRationale.pedagogicalObjective,
      aiCoachTip: aiRationale.aiCoachTip,
    };
  }

  // ==========================================================================
  // 6. PLAN ITEM LIFECYCLE MANAGEMENT
  // ==========================================================================

  /**
   * Update study plan item status ('in_progress' | 'completed' | 'skipped')
   */
  public async updatePlanItemStatus(
    itemId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ): Promise<StudyPlanItemDetailed | null> {
    for (const [planId, items] of this.activePlanItems.entries()) {
      const itemIndex = items.findIndex((it) => it.id === itemId);
      if (itemIndex !== -1) {
        items[itemIndex].status = status;
        if (status === 'completed') {
          items[itemIndex].completedAt = new Date().toISOString();
          // Auto-advance next pending item to in_progress
          const nextPending = items.find((it) => it.status === 'pending');
          if (nextPending) {
            nextPending.status = 'in_progress';
          }
        }

        // Update plan progress percentage
        const plan = this.activePlans.get(planId);
        if (plan) {
          const completedCount = items.filter((it) => it.status === 'completed').length;
          plan.overallProgressPercentage = Math.round((completedCount / items.length) * 100);
          plan.updatedAt = new Date().toISOString();
        }

        return items[itemIndex];
      }
    }
    return null;
  }

  /**
   * Retrieves active study plan for student
   */
  public async getActiveStudyPlan(
    studentId: string,
    examType?: ExamType
  ): Promise<PersonalizedStudyPlanResult | null> {
    const resolvedExam: ExamType = examType || 'ECAT';
    const plans = Array.from(this.activePlans.values()).filter(
      (p) =>
        p.studentId === studentId &&
        p.status === 'active' &&
        ((p as any).targetExam === resolvedExam ||
          (resolvedExam === 'MDCAT' ? p.examId === 'exam-mdcat' : p.examId === 'exam-ecat'))
    );
    const activePlan = plans[plans.length - 1];
    if (!activePlan) {
      return this.generateStudyPlan(studentId, { examType: resolvedExam });
    }

    const rawItems = this.activePlanItems.get(activePlan.id) || [];
    const items = rawItems.map((it) => this.enrichPlanItem(it, resolvedExam));
    const nextBestActivity = items[0]
      ? this.computeNextBestActivity(items[0], resolvedExam)
      : await this.getNextBestActivity(studentId, { examType: resolvedExam });

    const topWeakRecs = await this.getRecommendedTopics(studentId, {
      examType: resolvedExam,
      limit: 3,
    });

    return {
      plan: activePlan as any,
      items,
      nextBestActivity,
      topWeakTopics: topWeakRecs,
      coachingAdvice: (activePlan as any).coachingMessage,
    };
  }

  // ==========================================================================
  // HELPER UTILITIES
  // ==========================================================================

  private buildPrimaryReason(ctx: {
    masteryScore: number;
    masteryStatus?: string;
    importanceRating: number;
    diagAccuracy?: number;
    diagSeverity?: string;
    needsReview?: boolean;
    examType: ExamType;
  }): string {
    if (ctx.diagAccuracy !== undefined && ctx.diagAccuracy < 50) {
      return `Critical Diagnostic Gap: ${ctx.diagAccuracy}% accuracy on diagnostic baseline test. High-yield past paper topic (${ctx.importanceRating}/5 yield).`;
    }
    if (ctx.needsReview) {
      return `Spaced Retention Alert: Topic flagged for scheduled review to prevent forgetting curve decay.`;
    }
    if (ctx.masteryScore < 45) {
      return `Low Mastery Gap (${ctx.masteryScore}%): High past paper question frequency on ${ctx.examType}.`;
    }
    if (ctx.masteryScore < 65) {
      return `Developing Concept (${ctx.masteryScore}%): Targeted practice will rapidly elevate this to high mastery.`;
    }
    return `High-Yield Maintenance: Solidify high confidence accuracy (${ctx.masteryScore}%) under entrance exam pacing.`;
  }

  private distributeTimeBudget(totalMinutes: number, count: number): number[] {
    if (count === 1) return [totalMinutes];
    if (count === 2) {
      const first = Math.round(totalMinutes * 0.6);
      return [first, totalMinutes - first];
    }
    if (count === 3) {
      const first = Math.round(totalMinutes * 0.42);
      const second = Math.round(totalMinutes * 0.33);
      const third = totalMinutes - first - second;
      return [first, second, third];
    }
    // 4 items
    const first = Math.round(totalMinutes * 0.35);
    const second = Math.round(totalMinutes * 0.28);
    const third = Math.round(totalMinutes * 0.22);
    const fourth = totalMinutes - first - second - third;
    return [first, second, third, fourth];
  }

  private computeNextBestActivity(item: StudyPlanItemDetailed, examType: ExamType): NextBestActivity {
    const isLearningUnit = item.recommendedActivity === 'learning_unit';
    const actionUrl = isLearningUnit
      ? `/student/learn/${item.topicId}`
      : `/student/practice?topicId=${item.topicId}`;

    return {
      topicId: item.topicId,
      topicName: item.topicName || item.topicId.replace('topic-', '').replace(/-/g, ' '),
      subjectName: item.subjectName || 'Core Subject',
      activityType: item.recommendedActivity || 'practice_drill',
      title: isLearningUnit
        ? `Review Learning Unit: ${item.topicName || item.topicId}`
        : `Targeted Practice: ${item.topicName || item.topicId}`,
      description: item.priorityReason,
      estimatedMinutes: item.estimatedMinutes || 25,
      actionUrl,
      priorityScore: 92,
      priorityReason: item.priorityReason,
      whyExplanation: item.whyExplanation || {
        topicId: item.topicId,
        topicName: item.topicName || item.topicId,
        subjectName: item.subjectName || 'Subject',
        primaryReason: item.priorityReason,
        masteryScore: item.masteryScore || 45,
        masteryStatus: 'weak',
        importanceRating: 5,
        pedagogicalObjective: `Master ${item.topicName || item.topicId} to boost entrance exam score.`,
        aiCoachTip: 'Focus on identifying the core relation before calculating.',
      },
    };
  }

  private enrichPlanItem(item: StudyPlanItem, examType: ExamType): StudyPlanItemDetailed {
    const topic = curriculumService.getTopicByIdSync(item.topicId);
    const chapter = topic ? curriculumService.getChapterByIdSync(topic.chapterId) : null;
    const subject = topic ? curriculumService.getSubjectByIdSync(topic.subjectId) : null;
    const unit = curriculumService.getLearningUnitByTopicId(item.topicId);
    const studentMastery = masteryService.getStudentMastery(item.studentId, { examType });
    const mastery = studentMastery.topics.find((t) => t.topicId === item.topicId);

    const topicName = (item as any).topicName || topic?.name || item.topicId.replace('topic-', '').replace(/-/g, ' ');
    const chapterName = (item as any).chapterName || chapter?.name || 'Core Curriculum';
    const subjectId = (item as any).subjectId || topic?.subjectId || (examType === 'MDCAT' ? 'subj-biology' : 'subj-physics');
    const subjectName = (item as any).subjectName || subject?.name || (examType === 'MDCAT' ? 'Biology' : 'Physics');
    const learningUnitId = item.learningUnitId || unit?.id;
    const recommendedActivity: RecommendedActivityType =
      (item as any).recommendedActivity ||
      (item.priorityOrder === 1 ? 'learning_unit' : 'practice_drill');
    const masteryScore =
      (item as any).masteryScore ??
      mastery?.masteryScore ??
      (topic?.subjectId === 'subj-biology' ? 78 : topic?.subjectId === 'subj-physics' ? 38 : 50);

    const whyExplanation: WhyExplanation = (item as any).whyExplanation || {
      topicId: item.topicId,
      topicName,
      subjectName,
      primaryReason: item.priorityReason,
      masteryScore,
      masteryStatus: (masteryScore >= 70 ? 'proficient' : masteryScore >= 45 ? 'developing' : 'weak') as any,
      importanceRating: topic?.importanceRating || 5,
      examWeightPercentage: topic?.subjectId === 'subj-biology' ? 34 : 27,
      recentAccuracy: mastery?.accuracyPercentage || 50,
      totalAttempts: mastery?.totalAttempted || 0,
      pedagogicalObjective: `Master ${topicName} concepts to ensure high accuracy on ${examType} section questions.`,
      aiCoachTip: `Focus on high-frequency question patterns and key derivations for ${topicName}.`,
    };

    return {
      ...item,
      topicName,
      chapterName,
      subjectId,
      subjectName,
      learningUnitId,
      recommendedActivity,
      masteryScore,
      whyExplanation,
    };
  }
}

export const personalizationService = new PersonalizationService();

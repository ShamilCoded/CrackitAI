import type {
  StudyPlan,
  StudyPlanItem,
  ExamType,
  PersonalizedStudyPlanResult,
  StudyPlanGenerationOptions,
  NextBestActivity,
  TopicRecommendation,
  AdaptivePracticeOptions,
  AdaptivePracticeSetResult,
  WhyExplanation,
  StudyPlanItemDetailed,
} from '@/types';
import { aiService } from '@/services/ai/gemini.service';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { personalizationService, PersonalizationService } from './personalization.service';

export interface CreatePlanFromDiagnosticInput {
  studentId: string;
  examType: ExamType;
  examId: string;
  weeklyHours?: number;
  weaknesses: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
    severity: 'critical' | 'moderate' | 'minor';
    accuracy: number;
  }>;
}

/**
 * Service for generating, updating, and sequencing personalized Study Plans.
 */
class StudyPlanService {
  /**
   * Generates a fully personalized daily/weekly study plan.
   */
  async generateStudyPlan(
    studentId: string,
    options?: StudyPlanGenerationOptions
  ): Promise<PersonalizedStudyPlanResult> {
    return personalizationService.generateStudyPlan(studentId, options);
  }

  /**
   * Gets the immediate Next Best Activity for the student.
   */
  async getNextBestActivity(
    studentId: string,
    options?: { examType?: ExamType }
  ): Promise<NextBestActivity> {
    return personalizationService.getNextBestActivity(studentId, options);
  }

  /**
   * Gets ranked topic recommendations based on mastery and exam yield.
   */
  async getRecommendedTopics(
    studentId: string,
    options?: { examType?: ExamType; limit?: number; subjectFocus?: string }
  ): Promise<TopicRecommendation[]> {
    return personalizationService.getRecommendedTopics(studentId, options);
  }

  /**
   * Generates an adaptive practice set based on student weaknesses.
   */
  async getAdaptivePracticeSet(
    studentId: string,
    options?: AdaptivePracticeOptions
  ): Promise<AdaptivePracticeSetResult> {
    return personalizationService.getAdaptivePracticeSet(studentId, options);
  }

  /**
   * Generates a transparent "Why am I seeing this?" fact sheet & AI insight.
   */
  async getWhyExplanation(
    studentId: string,
    topicId: string,
    examType?: ExamType
  ): Promise<WhyExplanation> {
    return personalizationService.getWhyExplanation(studentId, topicId, examType);
  }

  /**
   * Updates a study plan item's status ('pending' | 'in_progress' | 'completed' | 'skipped').
   */
  async updatePlanItemStatus(
    itemId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ): Promise<StudyPlanItemDetailed | null> {
    return personalizationService.updatePlanItemStatus(itemId, status);
  }

  /**
   * Gets the active study plan for the student.
   */
  async getActiveStudyPlan(studentId: string): Promise<PersonalizedStudyPlanResult | null> {
    return personalizationService.getActiveStudyPlan(studentId);
  }

  /**
   * Backward compatible diagnostic recovery plan generator.
   */
  async generatePersonalizedPlan(
    input: CreatePlanFromDiagnosticInput
  ): Promise<{ plan: StudyPlan; items: StudyPlanItem[] }> {
    const weeklyHours = input.weeklyHours || 15;

    // Request AI synthesis for structured focus
    const aiPlan = await aiService.generatePersonalizedStudyPlan({
      examType: input.examType,
      weeklyAvailableHours: weeklyHours,
      criticalWeaknesses: input.weaknesses.map((w) => ({
        topicId: w.topicId,
        topicName: w.topicName,
        subjectName: w.subjectName,
      })),
    });

    const planId = `plan-${Date.now()}`;
    const studyPlan: StudyPlan = {
      id: planId,
      studentId: input.studentId,
      examId: input.examId,
      title: aiPlan.planTitle || `${input.examType} Personalized Diagnostic Recovery Plan`,
      totalEstimatedHours: aiPlan.items.reduce((acc, it) => acc + (it.estimatedHours || 3), 0),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const items: StudyPlanItem[] = [];

    for (let i = 0; i < input.weaknesses.length; i++) {
      const w = input.weaknesses[i];
      const matchedAiItem = aiPlan.items.find((it) => it.topicId === w.topicId);
      const learningUnit = await curriculumService.getLearningUnitForTopic(w.topicId);

      items.push({
        id: `plan-item-${planId}-${i + 1}`,
        studyPlanId: planId,
        studentId: input.studentId,
        topicId: w.topicId,
        learningUnitId: learningUnit?.id,
        priorityOrder: i + 1,
        status: i === 0 ? 'in_progress' : 'pending',
        priorityReason:
          matchedAiItem?.reason ||
          `Targeted based on diagnostic accuracy of ${w.accuracy}% (${w.severity} priority).`,
        estimatedMinutes: (matchedAiItem?.estimatedHours || 2) * 60,
      });
    }

    return { plan: studyPlan, items };
  }
}

export const studyPlanService = new StudyPlanService();
export { personalizationService, PersonalizationService };

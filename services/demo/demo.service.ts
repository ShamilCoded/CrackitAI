import type {
  StudentProfile,
  TopicMastery,
  DiagnosticAttempt,
  StudyPlan,
  StudyPlanItem,
  TutorSession,
  ExamType,
} from '@/types';
import {
  DEMO_STUDENT_ID,
  DEMO_ADMIN_ID,
  DEMO_PARENT_ID,
  DEMO_STUDENT_PROFILE,
  DEMO_ADMIN_PROFILE,
  DEMO_PARENT_PROFILE,
  DEMO_TOPIC_MASTERIES,
  DEMO_DIAGNOSTIC_ATTEMPT,
  DEMO_STUDY_PLAN,
  DEMO_STUDY_PLAN_ITEMS,
  DEMO_TUTOR_SESSION,
} from '@/database/demo-data';
import { masteryService } from '@/services/mastery/mastery.service';

/**
 * Isolated Demo Data Service
 * Enforces strict isolation: demo operations only mutate demo state and never bleed into real user records.
 */
class DemoService {
  private profile: StudentProfile = { ...DEMO_STUDENT_PROFILE };
  private masteries: TopicMastery[] = [...DEMO_TOPIC_MASTERIES];
  private diagnosticAttempt: DiagnosticAttempt = { ...DEMO_DIAGNOSTIC_ATTEMPT };
  private studyPlan: StudyPlan = { ...DEMO_STUDY_PLAN };
  private planItems: StudyPlanItem[] = [...DEMO_STUDY_PLAN_ITEMS];
  private tutorSession: TutorSession = {
    ...DEMO_TUTOR_SESSION,
    messages: [...DEMO_TUTOR_SESSION.messages],
  };

  getDemoStudentId(): string {
    return DEMO_STUDENT_ID;
  }

  getDemoAdminId(): string {
    return DEMO_ADMIN_ID;
  }

  getDemoParentId(): string {
    return DEMO_PARENT_ID;
  }

  getDemoProfile(): StudentProfile {
    return { ...this.profile };
  }

  getDemoAdminProfile(): StudentProfile {
    return { ...DEMO_ADMIN_PROFILE };
  }

  getDemoParentProfile(): StudentProfile {
    return { ...DEMO_PARENT_PROFILE };
  }

  setDemoTargetExam(exam: ExamType): StudentProfile {
    this.profile.targetExam = exam;
    this.profile.targetScore = exam === 'ECAT' ? 360 : 180;
    this.profile.baselineScore = exam === 'ECAT' ? 240 : 120;
    this.profile.currentScoreEstimate = exam === 'ECAT' ? 268 : 138;
    this.profile.updatedAt = new Date().toISOString();
    return { ...this.profile };
  }

  getDemoDiagnosticResult(): DiagnosticAttempt {
    return { ...this.diagnosticAttempt };
  }

  getDemoTopicMasteries(): TopicMastery[] {
    return masteryService.getStudentMastery(DEMO_STUDENT_ID).topics;
  }

  getDemoStudyPlan(): { plan: StudyPlan; items: StudyPlanItem[] } {
    return {
      plan: { ...this.studyPlan },
      items: [...this.planItems],
    };
  }

  getDemoTutorSession(): TutorSession {
    return {
      ...this.tutorSession,
      messages: [...this.tutorSession.messages],
    };
  }

  addTutorMessage(content: string, role: 'student' | 'tutor'): TutorSession {
    const newMessage = {
      id: `msg-${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    this.tutorSession.messages.push(newMessage);
    this.tutorSession.updatedAt = new Date().toISOString();
    return {
      ...this.tutorSession,
      messages: [...this.tutorSession.messages],
    };
  }

  recordPracticeAttempt(topicId: string, isCorrect: boolean): void {
    // Single Source of Truth: Delegate to centralized Topic Mastery Engine
    masteryService.recordPracticeAttempt({
      studentId: DEMO_STUDENT_ID,
      topicId,
      isCorrect,
      difficulty: 'medium',
      timeSpentSeconds: 60,
      sourceContext: 'practice',
    });
    this.masteries = masteryService.getStudentMastery(DEMO_STUDENT_ID).topics;
  }

  resetDemoState(): void {
    this.profile = { ...DEMO_STUDENT_PROFILE };
    this.masteries = masteryService.getStudentMastery(DEMO_STUDENT_ID).topics;
    this.diagnosticAttempt = { ...DEMO_DIAGNOSTIC_ATTEMPT };
    this.studyPlan = { ...DEMO_STUDY_PLAN };
    this.planItems = [...DEMO_STUDY_PLAN_ITEMS];
    this.tutorSession = {
      ...DEMO_TUTOR_SESSION,
      messages: [...DEMO_TUTOR_SESSION.messages],
    };
  }
}

export const demoService = new DemoService();

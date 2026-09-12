import { NextRequest, NextResponse } from 'next/server';
import { personalizationService } from '@/services/study-plan/personalization.service';
import { DEMO_STUDENT_ID } from '@/database/demo-data';
import type { ExamType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || DEMO_STUDENT_ID;
    const type = searchParams.get('type') || 'plan';
    const examType = (searchParams.get('examType') as ExamType) || 'ECAT';
    const topicId = searchParams.get('topicId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const dailyMinutes = searchParams.get('dailyMinutes')
      ? parseInt(searchParams.get('dailyMinutes')!, 10)
      : undefined;

    if (type === 'next_activity') {
      const nextActivity = await personalizationService.getNextBestActivity(studentId, {
        examType,
      });
      return NextResponse.json({ success: true, data: nextActivity });
    }

    if (type === 'recommendations') {
      const recs = await personalizationService.getRecommendedTopics(studentId, {
        examType,
        limit,
      });
      return NextResponse.json({ success: true, data: recs });
    }

    if (type === 'why') {
      if (!topicId) {
        return NextResponse.json(
          { success: false, error: 'topicId parameter is required for type=why' },
          { status: 400 }
        );
      }
      const whyExplanation = await personalizationService.getWhyExplanation(
        studentId,
        topicId,
        examType
      );
      return NextResponse.json({ success: true, data: whyExplanation });
    }

    // Default: get active study plan or generate
    let plan = await personalizationService.getActiveStudyPlan(studentId);
    if (!plan || dailyMinutes) {
      plan = await personalizationService.generateStudyPlan(studentId, {
        examType,
        dailyAvailableMinutes: dailyMinutes || 60,
      });
    }

    return NextResponse.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('Error in personalization GET API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process personalization request' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, studentId = DEMO_STUDENT_ID, ...params } = body;

    if (action === 'generate_plan') {
      const plan = await personalizationService.generateStudyPlan(studentId, {
        examType: params.examType || 'ECAT',
        dailyAvailableMinutes: params.dailyAvailableMinutes || 60,
        goalExamDate: params.goalExamDate,
        targetScore: params.targetScore,
        subjectFocus: params.subjectFocus,
      });
      return NextResponse.json({ success: true, data: plan });
    }

    if (action === 'adaptive_practice') {
      const practiceSet = await personalizationService.getAdaptivePracticeSet(studentId, {
        examType: params.examType || 'ECAT',
        subjectId: params.subjectId,
        targetQuestionCount: params.targetQuestionCount || 6,
        focusTopicIds: params.focusTopicIds,
      });
      return NextResponse.json({ success: true, data: practiceSet });
    }

    if (action === 'update_item_status') {
      if (!params.itemId || !params.status) {
        return NextResponse.json(
          { success: false, error: 'itemId and status are required' },
          { status: 400 }
        );
      }
      const updatedItem = await personalizationService.updatePlanItemStatus(
        params.itemId,
        params.status
      );
      return NextResponse.json({ success: true, data: updatedItem });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in personalization POST API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute personalization action' },
      { status: 500 }
    );
  }
}

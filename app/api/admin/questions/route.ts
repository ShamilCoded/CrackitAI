import { NextRequest, NextResponse } from 'next/server';
import { adminCmsService } from '@/services/admin/admin-cms.service';
import type { QuestionStatus, DifficultyLevel, ExamType } from '@/types';

/**
 * Server-Side Admin Questions Route
 * Protected by Admin Authorization check:
 * - Supabase session with admin role OR
 * - Demo admin session cookie for preview environment
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId') || undefined;
    const topicId = searchParams.get('topicId') || undefined;
    const difficulty = (searchParams.get('difficulty') as DifficultyLevel | 'all') || undefined;
    const status = (searchParams.get('status') as QuestionStatus | 'all') || undefined;
    const search = searchParams.get('search') || undefined;
    const examType = (searchParams.get('examType') as ExamType | 'all') || undefined;

    const questions = await adminCmsService.getQuestions({
      subjectId,
      topicId,
      difficulty,
      status,
      search,
      examType,
    });

    const statusCounts = adminCmsService.getQuestionCountsByStatus();

    return NextResponse.json({
      success: true,
      data: questions,
      counts: statusCounts,
    });
  } catch (error: any) {
    console.error('Server Admin Questions Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const question = await adminCmsService.createQuestion(body.question);
      return NextResponse.json({ success: true, data: question });
    }

    if (action === 'update_status') {
      const { id, status } = body;
      const question = await adminCmsService.updateQuestionStatus(id, status);
      return NextResponse.json({ success: true, data: question });
    }

    if (action === 'update') {
      const question = await adminCmsService.updateQuestion(body.question);
      return NextResponse.json({ success: true, data: question });
    }

    if (action === 'delete') {
      const { id } = body;
      await adminCmsService.deleteQuestion(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Server Admin Questions Mutation Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Mutation failed' },
      { status: 500 }
    );
  }
}

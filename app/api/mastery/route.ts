import { NextRequest, NextResponse } from 'next/server';
import { masteryService } from '@/services/mastery/mastery.service';
import { DEMO_STUDENT_ID } from '@/database/demo-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || DEMO_STUDENT_ID;
    const filter = searchParams.get('filter'); // 'weak' | 'strong' | 'history' | 'all'
    const subjectId = searchParams.get('subjectId') || undefined;
    const topicId = searchParams.get('topicId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    if (filter === 'weak') {
      const weakTopics = masteryService.getWeakTopics(studentId, { limit, subjectId });
      return NextResponse.json({ success: true, data: weakTopics });
    }

    if (filter === 'strong') {
      const strongTopics = masteryService.getStrongTopics(studentId, { limit, subjectId });
      return NextResponse.json({ success: true, data: strongTopics });
    }

    if (filter === 'history') {
      const history = masteryService.getMasteryHistory(studentId, topicId);
      return NextResponse.json({ success: true, data: history });
    }

    const summary = masteryService.getStudentMastery(studentId, {
      subjectId: subjectId && subjectId !== 'all' ? subjectId : undefined,
      limit,
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve topic mastery' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, studentId = DEMO_STUDENT_ID, topicId, ...params } = body;

    if (action === 'calculate') {
      const components = masteryService.calculateTopicMastery({
        attempts: params.attempts || [],
        previousScore: params.previousScore,
        configOverrides: params.configOverrides,
      });
      return NextResponse.json({ success: true, data: components });
    }

    if (action === 'practice_attempt') {
      const updated = masteryService.recordPracticeAttempt({
        studentId,
        topicId,
        subjectId: params.subjectId,
        isCorrect: params.isCorrect,
        difficulty: params.difficulty,
        timeSpentSeconds: params.timeSpentSeconds,
        confidence: params.confidence,
        sourceContext: params.sourceContext || 'practice',
        questionId: params.questionId,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'diagnostic_assessment') {
      const updated = masteryService.recordDiagnosticAssessment({
        studentId,
        topicId,
        subjectId: params.subjectId,
        attemptedCount: params.attemptedCount,
        correctCount: params.correctCount,
        accuracy: params.accuracy,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Default update
    const updated = await masteryService.updateTopicMastery({
      studentId,
      topicId,
      subjectId: params.subjectId,
      evidence: params.evidence,
      attempts: params.attempts,
      previousScore: params.previousScore,
      sourceContext: params.sourceContext,
      note: params.note,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update topic mastery' },
      { status: 400 }
    );
  }
}

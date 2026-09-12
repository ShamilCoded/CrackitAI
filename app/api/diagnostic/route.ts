import { NextRequest, NextResponse } from 'next/server';
import { diagnosticService } from '@/services/diagnostic/diagnostic.service';
import type { ExamType } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examType = searchParams.get('examType') as ExamType | null;
  const testId = searchParams.get('testId');
  const attemptId = searchParams.get('attemptId');

  try {
    if (attemptId) {
      const attempt = await diagnosticService.getDiagnosticAttempt(attemptId);
      if (!attempt) {
        return NextResponse.json({ error: 'Diagnostic attempt not found' }, { status: 404 });
      }
      return NextResponse.json({ attempt });
    }

    if (testId) {
      const test = await diagnosticService.getDiagnosticTestById(testId);
      if (!test) {
        return NextResponse.json({ error: 'Diagnostic test not found' }, { status: 404 });
      }
      const questions = await diagnosticService.getQuestionsForDiagnostic(testId, examType || undefined);
      return NextResponse.json({ test, questions });
    }

    const tests = await diagnosticService.getDiagnosticTests(examType || undefined);
    return NextResponse.json({ tests });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve diagnostic information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'submit';

    if (action === 'start') {
      const session = await diagnosticService.startDiagnosticAttempt({
        studentId: body.studentId,
        studentName: body.studentName,
        diagnosticTestId: body.diagnosticTestId,
        examType: body.examType || 'ECAT',
      });
      return NextResponse.json(session);
    }

    if (action === 'submit' || action === 'complete') {
      const result = await diagnosticService.completeDiagnosticAttempt({
        attemptId: body.attemptId,
        answers: body.answers || [],
        scoringConfigOverrides: body.scoringConfigOverrides,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action parameter' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process diagnostic action' },
      { status: 500 }
    );
  }
}

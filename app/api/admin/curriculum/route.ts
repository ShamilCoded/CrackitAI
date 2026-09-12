import { NextRequest, NextResponse } from 'next/server';
import { adminCmsService } from '@/services/admin/admin-cms.service';

/**
 * Server-Side Admin Curriculum Route
 * Provides protected curriculum metrics and management
 */
export async function GET() {
  try {
    const counts = adminCmsService.getCurriculumOverviewCounts();
    const exams = adminCmsService.getExams();
    const subjects = adminCmsService.getSubjects();

    return NextResponse.json({
      success: true,
      data: {
        counts,
        exams,
        subjects,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch curriculum' },
      { status: 500 }
    );
  }
}

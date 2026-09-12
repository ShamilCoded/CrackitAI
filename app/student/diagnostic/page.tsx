'use client';

import React from 'react';
import { DiagnosticContainer } from '@/components/diagnostic';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuth } from '@/lib/auth/auth-context';

export default function StudentDiagnosticPage() {
  const { profile } = useAuth();
  const examType = profile?.targetExam || 'ECAT';

  return (
    <div className="w-full space-y-6">
      <ErrorBoundary
        title="Diagnostic Engine Error"
        fallbackMessage="An unexpected issue occurred while rendering the diagnostic assessment. Your progress has been saved."
        resetKey={examType}
      >
        <DiagnosticContainer initialExamType={examType} />
      </ErrorBoundary>
    </div>
  );
}

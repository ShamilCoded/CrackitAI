'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { MockExamContainer } from '@/components/mock-exam';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function StudentMockExamPage() {
  const { profile } = useAuth();
  const router = useRouter();

  return (
    <div className="w-full space-y-6">
      <ErrorBoundary
        title="Mock Exam Engine Error"
        fallbackMessage="An unexpected error occurred during the mock exam simulation. You can safely retry or return to the configurator."
      >
        <MockExamContainer
          initialExam={profile?.targetExam || 'ECAT'}
          onNavigateToTopic={(topicId) => {
            router.push(`/student/learn/${topicId}`);
          }}
          onNavigateToPractice={() => {
            router.push('/student/practice');
          }}
        />
      </ErrorBoundary>
    </div>
  );
}

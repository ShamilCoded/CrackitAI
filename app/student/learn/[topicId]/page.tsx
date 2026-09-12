import React from 'react';
import { LearningUnitContainer } from '@/components/learning-unit/LearningUnitContainer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface PageProps {
  params: Promise<{
    topicId: string;
  }>;
}

export default async function LearningUnitPage({ params }: PageProps) {
  const resolvedParams = await params;
  const topicId = resolvedParams.topicId || 'topic-phy-kinematics';

  return (
    <ErrorBoundary
      title="Learning Unit Error"
      fallbackMessage="Unable to load this learning unit. You can retry or return to your student curriculum."
      resetKey={topicId}
    >
      <LearningUnitContainer topicId={topicId} />
    </ErrorBoundary>
  );
}

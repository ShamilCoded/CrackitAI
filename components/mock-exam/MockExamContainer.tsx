'use client';

import React, { useState } from 'react';
import type {
  ExamType,
  MockPresetKey,
  MockExam,
  MockAttempt,
  MockExamQuestion,
} from '@/types';
import { mockExamService } from '@/services/mock-exam';
import { DEMO_STUDENT_ID } from '@/database/demo-data';
import { useExam } from '@/lib/context/exam-context';
import { MockExamConfigurator } from './MockExamConfigurator';
import { MockExamSession } from './MockExamSession';
import { MockExamResultView } from './MockExamResultView';

interface MockExamContainerProps {
  initialExam?: ExamType;
  onNavigateToTopic?: (topicId: string, subjectId?: string) => void;
  onNavigateToPractice?: (subjectId: string, topicId?: string) => void;
}

type ViewMode = 'config' | 'session' | 'result';

export const MockExamContainer: React.FC<MockExamContainerProps> = ({
  initialExam = 'ECAT',
  onNavigateToTopic,
  onNavigateToPractice,
}) => {
  const { selectedExam: examType, setSelectedExam: setExamType } = useExam();
  const [viewMode, setViewMode] = useState<ViewMode>('config');

  // Active session
  const [activeSession, setActiveSession] = useState<{
    mockExam: MockExam;
    questions: MockExamQuestion[];
    attemptId: string;
  } | null>(null);

  // Completed or inspected attempt
  const [currentResultAttempt, setCurrentResultAttempt] = useState<MockAttempt | null>(null);

  // Past attempts initialized from service
  const [pastAttempts, setPastAttempts] = useState<MockAttempt[]>(() =>
    mockExamService.getMockAttempts(DEMO_STUDENT_ID)
  );

  // Refresh past attempts helper
  const refreshPastAttempts = () => {
    setPastAttempts(mockExamService.getMockAttempts(DEMO_STUDENT_ID));
  };

  // Handle start exam
  const handleStartExam = (config: {
    examType: ExamType;
    presetKey: MockPresetKey;
    questionCount: number;
    durationMinutes: number;
  }) => {
    const { mockExam, questions } = mockExamService.generateMockExam(config);
    const session = mockExamService.startMockAttempt(DEMO_STUDENT_ID, mockExam, questions);

    setActiveSession({
      mockExam,
      questions,
      attemptId: session.attemptId,
    });
    setViewMode('session');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle exam completion
  const handleFinishExam = (attempt: MockAttempt) => {
    setCurrentResultAttempt(attempt);
    setActiveSession(null);
    setViewMode('result');
    const updatedAttempts = mockExamService.getMockAttempts(DEMO_STUDENT_ID);
    setPastAttempts(updatedAttempts);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View past attempt
  const handleViewPastAttempt = (attempt: MockAttempt) => {
    setCurrentResultAttempt(attempt);
    setViewMode('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Retake or new mock
  const handleRetake = () => {
    setViewMode('config');
    setActiveSession(null);
    setCurrentResultAttempt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exit without saving
  const handleExitWithoutSaving = () => {
    setActiveSession(null);
    setViewMode('config');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="mock-exam-container" className="w-full">
      {viewMode === 'config' && (
        <MockExamConfigurator
          selectedExam={examType}
          onExamChange={setExamType}
          onStartExam={handleStartExam}
          onViewPastAttempt={handleViewPastAttempt}
          pastAttempts={pastAttempts}
        />
      )}

      {viewMode === 'session' && activeSession && (
        <MockExamSession
          mockExam={activeSession.mockExam}
          questions={activeSession.questions}
          attemptId={activeSession.attemptId}
          onFinishExam={handleFinishExam}
          onExitWithoutSaving={handleExitWithoutSaving}
        />
      )}

      {viewMode === 'result' && currentResultAttempt && (
        <MockExamResultView
          attempt={currentResultAttempt}
          onRetake={handleRetake}
          onBackToHub={handleRetake}
          onNavigateToTopic={onNavigateToTopic}
          onNavigateToPractice={onNavigateToPractice}
        />
      )}
    </div>
  );
};

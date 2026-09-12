'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DiagnosticIntro } from './DiagnosticIntro';
import { DiagnosticInstructions } from './DiagnosticInstructions';
import { DiagnosticProgress } from './DiagnosticProgress';
import { DiagnosticQuestionCard } from './DiagnosticQuestionCard';
import { DiagnosticCompletionModal } from './DiagnosticCompletionModal';
import { DiagnosticResultsView } from './DiagnosticResultsView';
import { diagnosticService } from '@/services/diagnostic/diagnostic.service';
import type {
  ExamType,
  DiagnosticTest,
  Question,
  DiagnosticAttempt,
  DiagnosticAnswer,
  ConfidenceLevel,
} from '@/types';
import { Loader2 } from 'lucide-react';
import { useExam } from '@/lib/context/exam-context';

interface DiagnosticContainerProps {
  initialExamType?: ExamType;
  initialMode?: 'intro' | 'results';
  onComplete?: (attempt: DiagnosticAttempt) => void;
  onNavigateToTopic?: (topicId: string) => void;
}

export function DiagnosticContainer({
  initialExamType = 'ECAT',
  initialMode = 'intro',
  onComplete,
  onNavigateToTopic,
}: DiagnosticContainerProps) {
  const router = useRouter();
  const { selectedExam: examType, setSelectedExam: setExamType } = useExam();

  // Primary mode state
  const [mode, setMode] = useState<'intro' | 'instructions' | 'in_progress' | 'results'>(initialMode);
  const [availableTests, setAvailableTests] = useState<DiagnosticTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('diag-ecat-prelim');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active attempt state
  const [attemptId, setAttemptId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Map<string, { optionId: string; confidence: ConfidenceLevel; timeSpent: number }>>(new Map());
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800); // 30 mins
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Completed result
  const [completedResult, setCompletedResult] = useState<DiagnosticAttempt | null>(null);

  // Timer and submission references
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentQuestionStartTime = useRef<number>(0);
  const submitRef = useRef<() => void>(() => {});

  // Load available tests and default completed attempt on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const tests = await diagnosticService.getDiagnosticTests(examType);
        setAvailableTests(tests);
        if (tests.length > 0) {
          setSelectedTestId(tests[0].id);
        }

        // Check if demo/saved attempt exists
        const demoAttempt = diagnosticService.getDemoDiagnosticAttempt(examType);
        setCompletedResult(demoAttempt);

        if (initialMode === 'results') {
          setMode('results');
        }
      } catch (err) {
        console.error('Failed to load diagnostic metadata:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [examType, initialMode]);

  // Handle Exam Type switch
  const handleExamTypeChange = (newType: ExamType) => {
    setExamType(newType);
    const demo = diagnosticService.getDemoDiagnosticAttempt(newType);
    setCompletedResult(demo);
  };

  // Timer effect during active attempt
  useEffect(() => {
    if (mode === 'in_progress') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            submitRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [mode]);

  // Start Live Diagnostic Attempt
  const handleStartDiagnostic = async () => {
    setIsLoading(true);
    try {
      const session = await diagnosticService.startDiagnosticAttempt({
        diagnosticTestId: selectedTestId,
        examType,
      });

      setAttemptId(session.attemptId);
      setQuestions(session.questions);
      setCurrentIndex(0);
      setAnswers(new Map());
      setFlaggedIds(new Set());
      setSecondsRemaining((session.test.timeLimitMinutes || 30) * 60);
      currentQuestionStartTime.current = Date.now();
      setMode('in_progress');
    } catch (err) {
      console.error('Error starting diagnostic:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Record Answer for current question
  const handleSelectOption = (optionId: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = answers.get(currentQ.id);
    const timeSpent = existing?.timeSpent || Math.round((Date.now() - currentQuestionStartTime.current) / 1000);

    const updated = new Map(answers);
    updated.set(currentQ.id, {
      optionId,
      confidence: existing?.confidence || 'medium',
      timeSpent: Math.max(1, timeSpent),
    });

    setAnswers(updated);
  };

  // Set Confidence
  const handleSelectConfidence = (confidence: ConfidenceLevel) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = answers.get(currentQ.id);
    const updated = new Map(answers);

    updated.set(currentQ.id, {
      optionId: existing?.optionId || '',
      confidence,
      timeSpent: existing?.timeSpent || Math.round((Date.now() - currentQuestionStartTime.current) / 1000),
    });

    setAnswers(updated);
  };

  // Clear Answer
  const handleClearAnswer = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updated = new Map(answers);
    updated.delete(currentQ.id);
    setAnswers(updated);
  };

  // Toggle Flag
  const handleToggleFlag = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const nextFlags = new Set(flaggedIds);
    if (nextFlags.has(currentQ.id)) {
      nextFlags.delete(currentQ.id);
    } else {
      nextFlags.add(currentQ.id);
    }
    setFlaggedIds(nextFlags);
  };

  // Navigation between questions
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      currentQuestionStartTime.current = Date.now();
    } else {
      setShowCompletionModal(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      currentQuestionStartTime.current = Date.now();
    }
  };

  const handleSelectIndex = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      currentQuestionStartTime.current = Date.now();
    }
  };

  // Final Submit & Evaluation
  const handleFinalSubmit = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const formattedAnswers: DiagnosticAnswer[] = [];
      for (const [qId, data] of answers.entries()) {
        if (data.optionId) {
          formattedAnswers.push({
            questionId: qId,
            selectedOptionId: data.optionId,
            timeSpentSeconds: data.timeSpent,
            confidence: data.confidence,
          });
        }
      }

      const result = await diagnosticService.completeDiagnosticAttempt({
        attemptId: attemptId || `diag-att-${Date.now()}`,
        answers: formattedAnswers,
      });

      setCompletedResult(result);
      setShowCompletionModal(false);
      setMode('results');

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      console.error('Failed to complete diagnostic assessment:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    submitRef.current = handleFinalSubmit;
  });

  const handleRetake = () => {
    setMode('intro');
  };

  const handleNavigateToTopic = (topicId: string) => {
    if (onNavigateToTopic) {
      onNavigateToTopic(topicId);
    } else {
      router.push(`/student/learn/${topicId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="text-xs font-medium">Initializing Diagnostic Engine...</span>
      </div>
    );
  }

  // 1. INTRO VIEW
  if (mode === 'intro') {
    return (
      <DiagnosticIntro
        examType={examType}
        onExamTypeChange={handleExamTypeChange}
        availableTests={availableTests}
        selectedTestId={selectedTestId}
        onSelectTest={setSelectedTestId}
        onStart={handleStartDiagnostic}
        onViewInstructions={() => setMode('instructions')}
        onViewPastResults={() => setMode('results')}
        hasPastResults={Boolean(completedResult)}
      />
    );
  }

  // 2. INSTRUCTIONS VIEW
  if (mode === 'instructions') {
    return (
      <DiagnosticInstructions
        examType={examType}
        onBack={() => setMode('intro')}
        onProceed={handleStartDiagnostic}
      />
    );
  }

  // 3. IN PROGRESS ASSESSMENT VIEW
  if (mode === 'in_progress') {
    const currentQ = questions[currentIndex];
    const currentAnswer = currentQ ? answers.get(currentQ.id) : null;
    const answeredIds = new Set(
      Array.from(answers.entries())
        .filter(([, v]) => Boolean(v.optionId))
        .map(([k]) => k)
    );

    const subjectName = currentQ?.subjectId
      ? currentQ.subjectId.replace('subj-', '').toUpperCase()
      : 'GENERAL';

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 py-4 px-2" id="diagnostic-active-view">
        {/* Progress & Tracker Bar */}
        <DiagnosticProgress
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          questions={questions}
          answeredQuestionIds={answeredIds}
          flaggedQuestionIds={flaggedIds}
          secondsRemaining={secondsRemaining}
          onSelectIndex={handleSelectIndex}
          onFinishReview={() => setShowCompletionModal(true)}
          currentSubjectName={subjectName}
        />

        {/* Question Card */}
        {currentQ ? (
          <DiagnosticQuestionCard
            question={currentQ}
            selectedOptionId={currentAnswer?.optionId || null}
            confidence={currentAnswer?.confidence || 'medium'}
            isFlagged={flaggedIds.has(currentQ.id)}
            onSelectOption={handleSelectOption}
            onSelectConfidence={handleSelectConfidence}
            onToggleFlag={handleToggleFlag}
            onClearAnswer={handleClearAnswer}
            onPrevious={handlePrevious}
            onNext={handleNext}
            isFirst={currentIndex === 0}
            isLast={currentIndex === questions.length - 1}
            questionNumber={currentIndex + 1}
          />
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No questions available in this diagnostic test configuration.
          </div>
        )}

        {/* Completion Modal */}
        <DiagnosticCompletionModal
          isOpen={showCompletionModal}
          totalQuestions={questions.length}
          answeredCount={answeredIds.size}
          flaggedCount={flaggedIds.size}
          secondsRemaining={secondsRemaining}
          onClose={() => setShowCompletionModal(false)}
          onSubmitFinal={handleFinalSubmit}
          isSubmitting={isEvaluating}
        />
      </div>
    );
  }

  // 4. RESULTS VIEW
  if (mode === 'results' && completedResult) {
    return (
      <DiagnosticResultsView
        attempt={completedResult}
        onRetake={handleRetake}
        onSelectTopic={handleNavigateToTopic}
      />
    );
  }

  return null;
}

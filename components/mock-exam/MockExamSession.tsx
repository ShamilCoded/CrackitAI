'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  MockExam,
  MockExamQuestion,
  MockAnswer,
  MockAttempt,
} from '@/types';
import { mockExamService } from '@/services/mock-exam';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Send,
  Check,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

interface MockExamSessionProps {
  mockExam: MockExam;
  questions: MockExamQuestion[];
  attemptId: string;
  onFinishExam: (attempt: MockAttempt) => void;
  onExitWithoutSaving: () => void;
}

export const MockExamSession: React.FC<MockExamSessionProps> = ({
  mockExam,
  questions,
  attemptId,
  onFinishExam,
  onExitWithoutSaving,
}) => {
  const isEcat = mockExam.examType === 'ECAT';

  // Navigation state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');
  const [isPaletteOpenMobile, setIsPaletteOpenMobile] = useState<boolean>(false);

  // Answers map
  const [answers, setAnswers] = useState<Map<string, MockAnswer>>(() => {
    const initial = new Map<string, MockAnswer>();
    questions.forEach((q, idx) => {
      initial.set(q.id, {
        questionId: q.id,
        selectedOptionId: undefined,
        isMarkedForReview: false,
        timeSpentSeconds: 0,
        visited: idx === 0,
      });
    });
    return initial;
  });

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    mockExam.durationMinutes * 60
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showTimeoutAlert, setShowTimeoutAlert] = useState<boolean>(false);

  // Pacing tracking ref (initialized lazily)
  const lastQuestionSwitchTimeRef = useRef<number | null>(null);
  const currentQId = questions[currentIndex]?.id;

  // Question switch time tracking
  const recordCurrentQuestionTimeSpent = useCallback(() => {
    if (!currentQId) return;
    const now = Date.now();
    const lastTime = lastQuestionSwitchTimeRef.current ?? now;
    const elapsedSeconds = Math.max(1, Math.round((now - lastTime) / 1000));
    lastQuestionSwitchTimeRef.current = now;

    setAnswers((prev) => {
      const next = new Map(prev);
      const existing = next.get(currentQId);
      if (existing) {
        existing.timeSpentSeconds += elapsedSeconds;
      }
      return next;
    });

    // Update service
    mockExamService.updateAnswer(attemptId, currentQId, {
      timeSpentDeltaSeconds: elapsedSeconds,
    });
  }, [attemptId, currentQId]);

  // Handle auto-submit when timer expires
  const handleAutoSubmitOnTimeout = useCallback(async () => {
    recordCurrentQuestionTimeSpent();
    setShowTimeoutAlert(true);
    setIsSubmitting(true);

    try {
      const attempt = await mockExamService.submitMockAttempt(attemptId, true);
      setTimeout(() => {
        onFinishExam(attempt);
      }, 1500);
    } catch {
      setIsSubmitting(false);
    }
  }, [attemptId, onFinishExam, recordCurrentQuestionTimeSpent]);

  // Keep ref synchronized outside render
  const handleAutoSubmitRef = useRef(handleAutoSubmitOnTimeout);
  useEffect(() => {
    handleAutoSubmitRef.current = handleAutoSubmitOnTimeout;
  }, [handleAutoSubmitOnTimeout]);

  // Timer countdown hook
  useEffect(() => {
    if (isSubmitting || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitting, secondsRemaining]);

  // Switch question
  const goToQuestion = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    recordCurrentQuestionTimeSpent();

    setCurrentIndex(targetIndex);
    const targetQId = questions[targetIndex]?.id;

    // Mark visited
    if (targetQId) {
      setAnswers((prev) => {
        const next = new Map(prev);
        const curr = next.get(targetQId);
        if (curr) curr.visited = true;
        return next;
      });
      mockExamService.updateAnswer(attemptId, targetQId, { visited: true });
    }

    setIsPaletteOpenMobile(false);
  };

  // Option selection
  const handleSelectOption = (optionId: string) => {
    if (!currentQId || isSubmitting) return;

    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQId);
      if (curr) {
        // Toggle selection or select
        curr.selectedOptionId = curr.selectedOptionId === optionId ? undefined : optionId;
      }
      return next;
    });

    mockExamService.updateAnswer(attemptId, currentQId, {
      selectedOptionId: answers.get(currentQId)?.selectedOptionId === optionId ? undefined : optionId,
    });
  };

  // Clear answer
  const handleClearSelection = () => {
    if (!currentQId || isSubmitting) return;

    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQId);
      if (curr) {
        curr.selectedOptionId = undefined;
      }
      return next;
    });

    mockExamService.updateAnswer(attemptId, currentQId, {
      selectedOptionId: undefined,
    });
  };

  // Mark for review toggle
  const handleToggleMarkForReview = () => {
    if (!currentQId || isSubmitting) return;

    const currentStatus = answers.get(currentQId)?.isMarkedForReview || false;
    const newStatus = !currentStatus;

    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQId);
      if (curr) {
        curr.isMarkedForReview = newStatus;
      }
      return next;
    });

    mockExamService.updateAnswer(attemptId, currentQId, {
      isMarkedForReview: newStatus,
    });
  };

  // Submit test manual
  const handleConfirmSubmit = async () => {
    recordCurrentQuestionTimeSpent();
    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const attempt = await mockExamService.submitMockAttempt(attemptId, false);
      onFinishExam(attempt);
    } catch {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers.get(currentQ.id) : null;

  // Statistics calculation for palette
  let answeredCount = 0;
  let markedCount = 0;
  let unattemptedCount = 0;

  answers.forEach((ans) => {
    if (ans.selectedOptionId) answeredCount += 1;
    else unattemptedCount += 1;
    if (ans.isMarkedForReview) markedCount += 1;
  });

  // Timer format (HH:MM:SS or MM:SS)
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Time urgency styling
  const isTimeCritical = secondsRemaining < 120; // < 2 mins
  const isTimeWarning = secondsRemaining < 300; // < 5 mins

  // Filter questions for palette
  const distinctSubjects = Array.from(new Set(questions.map((q) => q.subjectId)));
  const filteredPaletteQuestions =
    activeSubjectFilter === 'all'
      ? questions
      : questions.filter((q) => q.subjectId === activeSubjectFilter);

  return (
    <div id="mock-exam-session-container" className="max-w-7xl mx-auto space-y-4">
      {/* High-Stakes Test Header */}
      <header
        id="mock-exam-session-header"
        className="sticky top-2 z-30 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-xs flex items-center justify-between gap-2 sm:gap-4"
      >
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onExitWithoutSaving}
            className="text-xs text-slate-500 hover:text-rose-600 font-medium px-1.5 sm:px-2 py-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
          >
            <span className="hidden sm:inline">Exit Exam</span>
            <span className="sm:hidden">Exit</span>
          </button>
          <div className="h-4 w-px bg-slate-200 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 shrink-0">
                {mockExam.examType}
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[110px] sm:max-w-xs md:max-w-md">
                {mockExam.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Center/Right Timer & Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Digital Timer */}
          <div
            id="mock-exam-digital-timer"
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-mono text-xs sm:text-sm font-bold tracking-wider transition-all shrink-0 ${
              isTimeCritical
                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                : isTimeWarning
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isTimeCritical ? 'text-rose-600' : 'text-slate-600'}`} />
            <span>{timeFormatted}</span>
          </div>

          {/* Palette toggle on mobile */}
          <button
            type="button"
            onClick={() => setIsPaletteOpenMobile(!isPaletteOpenMobile)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg shrink-0"
            title="Toggle Question Palette"
          >
            {isPaletteOpenMobile ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Submit Exam Button */}
          <button
            id="btn-finish-mock-exam"
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowSubmitModal(true)}
            className="cursor-pointer px-2.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finish Exam</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Question Canvas & Side Palette */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Question Workspace (8 cols on md) */}
        <div className="md:col-span-8 space-y-4">
          {currentQ ? (
            <div
              id={`mock-question-card-${currentQ.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6"
            >
              {/* Question Header Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    {currentQ.subjectName}
                  </span>
                  {currentQ.topicName && (
                    <span className="hidden sm:inline-block text-xs text-slate-500 max-w-xs truncate">
                      {currentQ.topicName}
                    </span>
                  )}
                </div>

                {/* Marking Rule Pill */}
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-600">
                    {isEcat ? '+4' : '+1'} Marks
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-rose-600">
                    {isEcat ? '-1 Penalty' : '0 Penalty'}
                  </span>
                </div>
              </div>

              {/* Past paper context */}
              {currentQ.pastPaperSource && (
                <div className="text-[11px] font-medium text-slate-400">
                  Ref: {currentQ.pastPaperSource}
                </div>
              )}

              {/* Question Content */}
              <div
                id="mock-question-content-text"
                className="text-base md:text-lg font-medium text-slate-900 leading-relaxed space-y-3"
              >
                <p className="whitespace-pre-line">{currentQ.content || currentQ.questionText}</p>
              </div>

              {/* Multiple Choice Options */}
              <div id="mock-question-options-list" className="space-y-3 pt-2">
                {currentQ.options.map((option) => {
                  const isSelected = currentAnswer?.selectedOptionId === option.id;
                  return (
                    <div
                      key={option.id}
                      id={`option-card-${option.id}`}
                      onClick={() => handleSelectOption(option.id)}
                      className={`cursor-pointer rounded-xl p-4 border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Option Key Badge */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {option.optionKey}
                      </div>

                      {/* Option Text */}
                      <div className="text-sm md:text-base text-slate-800 pt-0.5 leading-snug flex-1">
                        {option.text || option.optionText}
                      </div>

                      {/* Selected Checkmark Indicator */}
                      {isSelected && (
                        <div className="text-indigo-600 shrink-0">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action Toolbar */}
              <div
                id="mock-question-action-toolbar"
                className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <button
                    id="btn-prev-question"
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => goToQuestion(currentIndex - 1)}
                    className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Clear Selection */}
                  {currentAnswer?.selectedOptionId && (
                    <button
                      id="btn-clear-selection"
                      type="button"
                      onClick={handleClearSelection}
                      className="cursor-pointer px-3 py-2 text-xs font-medium rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
                      title="Clear your answer for this question"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Response</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Mark for Review Button */}
                  <button
                    id="btn-mark-for-review"
                    type="button"
                    onClick={handleToggleMarkForReview}
                    className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                      currentAnswer?.isMarkedForReview
                        ? 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-600/10'
                        : 'border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <Flag
                      className={`w-3.5 h-3.5 ${
                        currentAnswer?.isMarkedForReview ? 'fill-purple-600 text-purple-600' : ''
                      }`}
                    />
                    <span>
                      {currentAnswer?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                    </span>
                  </button>

                  {/* Next Question / Save & Next */}
                  {currentIndex < questions.length - 1 ? (
                    <button
                      id="btn-next-question"
                      type="button"
                      onClick={() => goToQuestion(currentIndex + 1)}
                      className="cursor-pointer px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <span>Save & Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id="btn-final-submit"
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="cursor-pointer px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <span>Review & Submit</span>
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">No question loaded</div>
          )}
        </div>

        {/* Right Column: Question Palette (4 cols on md) */}
        <div
          id="mock-exam-palette-sidebar"
          className={`md:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5 ${
            isPaletteOpenMobile
              ? 'fixed inset-x-4 top-20 bottom-4 z-40 overflow-y-auto block md:static md:inset-auto md:z-auto'
              : 'hidden md:block'
          }`}
        >
          {/* Palette Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Question Navigation</h3>
            <span className="text-xs text-slate-500 font-medium">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>

          {/* Palette Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                ✓
              </span>
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300" />
              <span>Unattempted ({unattemptedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-purple-600 text-white flex items-center justify-center text-[9px]">
                <Flag className="w-2.5 h-2.5 fill-white" />
              </span>
              <span>Review Flag ({markedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border-2 border-indigo-600 bg-white" />
              <span>Current Item</span>
            </div>
          </div>

          {/* Subject Filter Tabs */}
          {distinctSubjects.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Filter by Section
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setActiveSubjectFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeSubjectFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({questions.length})
                </button>
                {distinctSubjects.map((subjId) => {
                  const subjectName =
                    questions.find((q) => q.subjectId === subjId)?.subjectName || 'Section';
                  const count = questions.filter((q) => q.subjectId === subjId).length;
                  return (
                    <button
                      key={subjId}
                      type="button"
                      onClick={() => setActiveSubjectFilter(subjId)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors truncate max-w-[120px] ${
                        activeSubjectFilter === subjId
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {subjectName} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question Chips Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Jump Directly
            </span>
            <div className="grid grid-cols-5 gap-2 max-h-[340px] overflow-y-auto p-1">
              {filteredPaletteQuestions.map((q) => {
                const actualIndex = questions.findIndex((item) => item.id === q.id);
                const ans = answers.get(q.id);
                const isCurrent = actualIndex === currentIndex;
                const isAnswered = Boolean(ans?.selectedOptionId);
                const isMarked = ans?.isMarkedForReview;

                // Determine chip style
                let chipBg = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (isAnswered && isMarked) {
                  chipBg = 'bg-purple-600 text-white border-purple-700 shadow-xs';
                } else if (isMarked) {
                  chipBg = 'bg-purple-100 text-purple-800 border-purple-300';
                } else if (isAnswered) {
                  chipBg = 'bg-emerald-500 text-white border-emerald-600 shadow-xs';
                }

                return (
                  <button
                    key={q.id}
                    id={`palette-chip-${q.id}`}
                    type="button"
                    onClick={() => goToQuestion(actualIndex)}
                    className={`h-10 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center relative ${chipBg} ${
                      isCurrent ? 'ring-2 ring-offset-1 ring-indigo-600 scale-105' : ''
                    }`}
                  >
                    <span>{actualIndex + 1}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Summary Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Marking Scheme:</span>
              <span className="font-semibold text-slate-800">
                {isEcat ? '+4 / -1' : '+1 / 0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Questions Remaining:</span>
              <span className="font-semibold text-slate-800">{unattemptedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Review Flags:</span>
              <span className="font-semibold text-purple-700">{markedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submission Modal */}
      {showSubmitModal && (
        <div
          id="mock-exam-submit-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Confirm Final Submission</h3>
                <p className="text-xs text-slate-500">
                  Review your completion status before locking in scores
                </p>
              </div>
            </div>

            {/* Status matrix */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block">Answered</span>
                <span className="text-base font-bold text-emerald-600">
                  {answeredCount} Questions
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Unanswered</span>
                <span className="text-base font-bold text-rose-600">
                  {unattemptedCount} Questions
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Marked for Review</span>
                <span className="text-base font-bold text-purple-600">
                  {markedCount} Questions
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Time Remaining</span>
                <span className="text-base font-bold text-slate-800">{timeFormatted}</span>
              </div>
            </div>

            {unattemptedCount > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  You have {unattemptedCount} unattempted questions.
                  {isEcat
                    ? ' In ECAT, unattempted questions receive 0 marks (avoiding the -1 wrong answer penalty).'
                    : ' In MDCAT, there is no negative penalty, so guessing is advantageous.'}
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Return to Exam
              </button>
              <button
                id="btn-confirm-final-submit"
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="cursor-pointer px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all"
              >
                {isSubmitting ? 'Evaluating Test...' : 'Yes, Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Submit Timeout Toast / Alert */}
      {showTimeoutAlert && (
        <div
          id="mock-exam-timeout-alert"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5"
        >
          <Clock className="w-5 h-5 text-amber-400 animate-spin" />
          <div>
            <p className="text-xs font-bold">Exam Time Expired!</p>
            <p className="text-[11px] text-slate-300">
              Your exam has been automatically collected and submitted for grading.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

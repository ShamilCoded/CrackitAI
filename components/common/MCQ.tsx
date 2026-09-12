'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Question, QuestionOption, ConfidenceLevel, SubmitAnswerResult, ExplanationMode } from '@/types';
import { questionService } from '@/services/question/question.service';
import { aiTutorClientService } from '@/services/ai/ai-tutor.client.service';
import { tutorSessionService } from '@/services/ai/tutor-session.service';
import { TutorMarkdownRenderer } from '@/components/tutor/TutorMarkdownRenderer';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Lightbulb,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Award,
  Zap,
} from 'lucide-react';

export interface MCQProps {
  question: Question;
  studentId?: string;
  sourceContext?: 'practice' | 'diagnostic' | 'mock_exam' | 'learning_unit';
  contextId?: string;
  showConfidenceSelector?: boolean;
  onAttemptRecorded?: (result: SubmitAnswerResult) => void;
  onNext?: () => void;
  className?: string;
}

export function MCQ({
  question,
  studentId = '00000000-0000-0000-0000-000000000001',
  sourceContext = 'practice',
  contextId,
  showConfidenceSelector = true,
  onAttemptRecorded,
  onNext,
  className = '',
}: MCQProps) {
  // State
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<SubmitAnswerResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // AI Tutor Drawer State
  const [showTutorDrawer, setShowTutorDrawer] = useState<boolean>(false);
  const [isTutorLoading, setIsTutorLoading] = useState<boolean>(false);
  const [tutorAnswer, setTutorAnswer] = useState<string | null>(null);

  const handleAskTutor = async (prompt: string, mode: ExplanationMode = 'hint') => {
    setIsTutorLoading(true);
    setTutorAnswer(null);
    try {
      const topicId = question.topicId || 'topic-phy-kinematics';
      const examType = (question.applicableExams?.[0] || 'ECAT') as any;
      const ctx = tutorSessionService.buildFullTutorContext({
        topicId,
        examType,
        questionId: question.id,
        studentId,
        selectedOptionId: selectedOptionId || undefined,
      });

      const response = await aiTutorClientService.sendMessage({
        studentId,
        query: prompt,
        context: ctx,
        mode,
        quickAction: mode === 'hint' ? 'give_hint' : mode === 'simple' ? 'explain_simply' : undefined,
      });

      setTutorAnswer(response.content);
    } catch (e) {
      console.error('Failed to query tutor:', e);
      setTutorAnswer('Look at the key physical relations and verify the units for each variable before calculating.');
    } finally {
      setIsTutorLoading(false);
    }
  };

  // Timer & Idempotency
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const clientTokenRef = useRef<string>('');

  // Start timer on mount
  useEffect(() => {
    clientTokenRef.current = `token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const interval = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);
    timerRef.current = interval;

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Handle Option Select
  const handleSelectOption = (optionId: string) => {
    if (result !== null || isSubmitting) return; // Prevent change after submit
    setSelectedOptionId(optionId);
    setErrorMessage(null);
  };

  // Handle Answer Submit
  const handleSubmit = async () => {
    if (!selectedOptionId) {
      setErrorMessage('Please choose an answer before submitting.');
      return;
    }
    if (result !== null || isSubmitting) {
      return; // Prevent duplicate submit
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (!clientTokenRef.current) {
      clientTokenRef.current = `token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const submissionResult = await questionService.submitAnswer({
        studentId,
        questionId: question.id,
        selectedOptionId,
        timeSpentSeconds: Math.max(timeSpentSeconds, 1),
        confidence: showConfidenceSelector ? confidence : undefined,
        sourceContext,
        contextId,
        clientToken: clientTokenRef.current,
      });

      setResult(submissionResult);
      if (onAttemptRecorded) {
        onAttemptRecorded(submissionResult);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Difficulty Badge Colors
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'medium':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'hard':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'exam_level':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const optionsList: QuestionOption[] = question.options || [];

  return (
    <div
      id={`mcq-card-${question.id}`}
      className={`bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-6 transition-all ${className}`}
    >
      {/* Header Badges & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`px-2.5 py-0.5 rounded font-semibold uppercase tracking-wider border ${getDifficultyBadge(
              question.difficulty || 'medium'
            )}`}
          >
            {(question.difficulty || 'medium').replace('_', ' ')}
          </span>

          {question.source && (
            <span className="bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded border border-stone-200 font-mono text-[11px]">
              {question.source}
            </span>
          )}

          {question.topicId && (
            <span className="text-stone-500 text-xs">
              Topic: <strong className="text-stone-800 capitalize">{question.topicId.replace('topic-', '').replace(/-/g, ' ')}</strong>
            </span>
          )}
        </div>

        {/* Live Timer and Marks */}
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-1 font-mono text-stone-700 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{timeSpentSeconds}s</span>
          </div>

          <span className="hidden sm:inline text-stone-400">•</span>

          <span className="hidden sm:inline">
            Standard Scoring: <strong className="text-emerald-700">+4</strong> / <strong className="text-rose-700">-1</strong>
          </span>
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <div className="text-base sm:text-lg font-semibold text-stone-900 leading-relaxed">
          {question.questionText || question.content}
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-3" role="radiogroup" aria-label="Question options">
        {optionsList.map((option, index) => {
          const letter = option.optionKey || String.fromCharCode(65 + index);
          const isSelected = selectedOptionId === option.id;
          const isSubmitted = result !== null;
          const isCorrectAnswer = option.id === question.correctOptionId;

          // State styling
          let containerClasses = 'border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20';
          let letterClasses = 'border-stone-300 bg-stone-50 text-stone-700';

          if (isSelected && !isSubmitted) {
            containerClasses = 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600';
            letterClasses = 'border-emerald-600 bg-emerald-600 text-white font-bold';
          } else if (isSubmitted) {
            if (isCorrectAnswer) {
              containerClasses = 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500 text-emerald-950';
              letterClasses = 'border-emerald-600 bg-emerald-600 text-white font-bold';
            } else if (isSelected && !isCorrectAnswer) {
              containerClasses = 'border-rose-400 bg-rose-50/80 ring-1 ring-rose-400 text-rose-950';
              letterClasses = 'border-rose-600 bg-rose-600 text-white font-bold';
            } else {
              containerClasses = 'border-stone-200 bg-stone-50/50 opacity-60';
              letterClasses = 'border-stone-200 bg-stone-100 text-stone-400';
            }
          }

          return (
            <button
              key={option.id}
              id={`mcq-option-${option.id}`}
              type="button"
              disabled={isSubmitted || isSubmitting}
              onClick={() => handleSelectOption(option.id)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer disabled:cursor-default ${containerClasses}`}
            >
              {/* Option Letter Indicator */}
              <span
                className={`w-7 h-7 rounded-lg border text-xs font-semibold flex items-center justify-center shrink-0 transition-colors ${letterClasses}`}
              >
                {letter}
              </span>

              {/* Option Text */}
              <div className="flex-1 pt-0.5 text-sm sm:text-base font-medium text-stone-800">
                {option.text || option.optionText}
              </div>

              {/* Feedback Icons if submitted */}
              {isSubmitted && isCorrectAnswer && (
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0 self-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="hidden sm:inline">Correct</span>
                </div>
              )}
              {isSubmitted && isSelected && !isCorrectAnswer && (
                <div className="flex items-center gap-1 text-xs font-semibold text-rose-700 shrink-0 self-center">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span className="hidden sm:inline">Incorrect</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          id="mcq-error-banner"
          className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pre-Submission Controls: Confidence selector & Submit */}
      {!result && (
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-stone-200">
          {showConfidenceSelector ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-stone-600">Your Confidence:</span>
              <div className="inline-flex rounded-lg p-0.5 bg-stone-100 border border-stone-200 text-xs">
                {(['low', 'medium', 'high'] as ConfidenceLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfidence(level)}
                    className={`px-2.5 py-1 rounded-md capitalize font-medium transition ${
                      confidence === level
                        ? 'bg-white text-stone-900 font-bold shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTutorDrawer(!showTutorDrawer);
                  if (!tutorAnswer) {
                    handleAskTutor('Give me a pedagogical hint on how to start analyzing this question without giving the answer.', 'hint');
                  }
                }}
                className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showTutorDrawer ? 'Hide Hint' : 'Get AI Hint'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowTutorDrawer(!showTutorDrawer);
                if (!tutorAnswer) {
                  handleAskTutor('Give me a pedagogical hint on how to start analyzing this question without giving the answer.', 'hint');
                }
              }}
              className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showTutorDrawer ? 'Hide Hint' : 'Get AI Hint'}</span>
            </button>
          )}

          <button
            id="mcq-submit-button"
            type="button"
            disabled={!selectedOptionId || isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Answer</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Pre-Submission AI Tutor Drawer */}
      {!result && showTutorDrawer && (
        <div className="bg-white border border-teal-200 rounded-xl p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-teal-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-teal-950">
                AI Socratic Tutor &bull; Guided Hint
              </span>
            </div>
            <button
              onClick={() => setShowTutorDrawer(false)}
              className="text-[11px] text-stone-400 hover:text-stone-700"
            >
              Close
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleAskTutor('Give me a conceptual hint without spoiling the option.', 'hint')}
              disabled={isTutorLoading}
              className="text-[11px] px-2.5 py-1 rounded-md bg-stone-50 hover:bg-teal-50 border border-stone-200 text-stone-700 font-medium transition"
            >
              🧭 Scaffolding Hint
            </button>
            <button
              type="button"
              onClick={() => handleAskTutor('Explain the core concept behind this question simply.', 'simple')}
              disabled={isTutorLoading}
              className="text-[11px] px-2.5 py-1 rounded-md bg-stone-50 hover:bg-teal-50 border border-stone-200 text-stone-700 font-medium transition"
            >
              🌱 Simple Concept
            </button>
            <button
              type="button"
              onClick={() => handleAskTutor('Give me an analogy to visualize what is happening.', 'analogy')}
              disabled={isTutorLoading}
              className="text-[11px] px-2.5 py-1 rounded-md bg-stone-50 hover:bg-teal-50 border border-stone-200 text-stone-700 font-medium transition"
            >
              💡 Analogy
            </button>
          </div>

          {tutorAnswer && (
            <div className="p-3 bg-stone-50 dark:bg-stone-800/95 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-100">
              <TutorMarkdownRenderer content={tutorAnswer} />
            </div>
          )}

          {isTutorLoading && (
            <div className="p-3 text-xs text-stone-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              <span>AI Tutor is preparing your hint...</span>
            </div>
          )}
        </div>
      )}

      {/* Post-Submission Feedback & Comprehensive Explanation */}
      {result && (
        <div id="mcq-feedback-panel" className="space-y-4 pt-2 border-t border-stone-200">
          {/* Outcome Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              result.isCorrect
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.isCorrect ? (
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="text-sm font-bold">
                  {result.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                </div>
                <div className="text-xs opacity-90">
                  {result.isCorrect
                    ? `Great job! Solved in ${result.timeSpentSeconds} seconds.`
                    : `Correct option was ${
                        optionsList.find((o) => o.id === result.correctOptionId)?.optionKey || 'the correct option'
                      }. Review the explanation below.`}
                </div>
              </div>
            </div>

            {/* Next Question CTA */}
            {onNext && (
              <button
                id="mcq-next-button"
                type="button"
                onClick={onNext}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Comprehensive Explanation Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Step-by-Step Explanation</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorDrawer(!showTutorDrawer)}
                className="px-3 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>{showTutorDrawer ? 'Hide AI Tutor' : 'Ask AI Tutor'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {result.explanation || question.comprehensiveExplanation || question.explanation}
            </p>

            {/* Tip or Shortcut */}
            {(result.tipOrShortcut || question.tipOrShortcut) && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Exam Shortcut / Golden Rule: </strong>
                  <span>{result.tipOrShortcut || question.tipOrShortcut}</span>
                </div>
              </div>
            )}
          </div>

          {/* Integrated AI Tutor Drawer */}
          {showTutorDrawer && (
            <div className="bg-white border border-teal-200 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-teal-950">
                    AI Tutor &bull; Question Deep Dive
                  </span>
                </div>
                <button
                  onClick={() => setShowTutorDrawer(false)}
                  className="text-[11px] text-stone-400 hover:text-stone-700"
                >
                  Close
                </button>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAskTutor('Give me a simple analogy for this concept.', 'analogy')}
                  disabled={isTutorLoading}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-stone-50 hover:bg-teal-50 border border-stone-200 text-stone-700 font-medium transition"
                >
                  💡 Intuitive Analogy
                </button>
                <button
                  type="button"
                  onClick={() => handleAskTutor('What is the #1 trap on this in past papers?', 'exam_focused')}
                  disabled={isTutorLoading}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-stone-50 hover:bg-teal-50 border border-stone-200 text-stone-700 font-medium transition"
                >
                  🎯 Exam Traps & Shortcuts
                </button>
                <button
                  type="button"
                  onClick={() => handleAskTutor('Break down the governing formulas step-by-step.', 'step_by_step')}
                  disabled={isTutorLoading}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-stone-50 hover:bg-teal-50 border border-stone-200 text-stone-700 font-medium transition"
                >
                  🪜 Step-by-Step Derivation
                </button>
              </div>

              {tutorAnswer && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/95 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-100">
                  <TutorMarkdownRenderer content={tutorAnswer} />
                </div>
              )}

              {isTutorLoading && (
                <div className="p-3 text-xs text-stone-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                  <span>AI Tutor is formulating contextual advice...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MCQ;

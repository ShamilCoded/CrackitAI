'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { FullLearningUnit } from '@/types/learning-unit';
import type { Question } from '@/types';
import {
  masteryService,
  type MasteryResult,
  type MasteryAssessmentInput,
} from '@/services/mastery/mastery.service';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target,
  BookOpen,
} from 'lucide-react';

interface MasteryTestSectionProps {
  unitData: FullLearningUnit;
  onMasteryUpdated?: (result: MasteryResult) => void;
  onNavigateSection: (section: 'learn' | 'practice' | 'ai-tutor') => void;
}

export function MasteryTestSection({
  unitData,
  onMasteryUpdated,
  onNavigateSection,
}: MasteryTestSectionProps) {
  const [testState, setTestState] = useState<'idle' | 'in_progress' | 'completed'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<MasteryResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const testQuestions: Question[] =
    unitData.masteryTestQuestions.length > 0
      ? unitData.masteryTestQuestions
      : unitData.practiceQuestions.slice(0, 3);

  // Time allocation: 60s per question
  const totalAllocatedSeconds = Math.max(120, testQuestions.length * 60);

  const startTest = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(totalAllocatedSeconds);
    setTotalTimeSpent(0);
    setEvaluationResult(null);
    setTestState('in_progress');
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleCompleteTest = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);

    let correctCount = 0;
    const attempts = testQuestions.map((q) => {
      const chosenOptId = selectedAnswers[q.id] || '';
      const chosenOption = q.options.find((o) => o.id === chosenOptId);
      const isCorrect = Boolean(chosenOption?.isCorrect);

      if (isCorrect) correctCount += 1;

      return {
        questionId: q.id,
        selectedOptionId: chosenOptId,
        isCorrect,
        timeSpentSeconds: Math.round(totalTimeSpent / testQuestions.length),
        difficulty: q.difficulty,
      };
    });

    const input: MasteryAssessmentInput = {
      studentId: '00000000-0000-0000-0000-000000000001',
      topicId: unitData.topic.id,
      testScore: correctCount,
      totalQuestions: testQuestions.length,
      timeSpentSeconds: totalTimeSpent,
      attempts,
    };

    try {
      // Call clean Mastery Service boundary
      const result = await masteryService.evaluateTopicMastery(input);
      setEvaluationResult(result);
      if (onMasteryUpdated) {
        onMasteryUpdated(result);
      }
      setTestState('completed');
    } catch (err) {
      console.error('Failed to evaluate mastery:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTestRef = useRef(handleCompleteTest);
  useEffect(() => {
    handleCompleteTestRef.current = handleCompleteTest;
  });

  // Timer loop
  useEffect(() => {
    if (testState === 'in_progress') {
      timerRef.current = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleCompleteTestRef.current();
            return 0;
          }
          return prev - 1;
        });
        setTotalTimeSpent((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testState]);

  const currentQ = testQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === testQuestions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. IDLE STATE: WELCOME & BRIEFING */}
      {testState === 'idle' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-xs space-y-6 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-2xs">
            <Trophy className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Official Topic Assessment
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              {unitData.topic.name} Mastery Test
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto">
              Test your exam readiness under actual timed test conditions. Completing this assessment evaluates your mastery score via the Mastery Engine.
            </p>
          </div>

          {/* Key Parameters */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 border border-stone-200 rounded-xl text-left">
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase block">Questions</span>
              <span className="text-sm font-extrabold text-stone-900">{testQuestions.length} Items</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase block">Duration</span>
              <span className="text-sm font-extrabold text-stone-900">{formatTime(totalAllocatedSeconds)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase block">Pass Bar</span>
              <span className="text-sm font-extrabold text-emerald-700">65% Accuracy</span>
            </div>
          </div>

          <div className="text-left bg-purple-50/60 border border-purple-200/80 rounded-xl p-4 text-xs text-purple-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-purple-900">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Assessment Rules:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-stone-700">
              <li>Answers are hidden until submission to simulate entrance test conditions.</li>
              <li>Calculations factor in question difficulty for your updated topic score.</li>
            </ul>
          </div>

          <button
            id="btn-start-mastery-test"
            onClick={startTest}
            className="w-full sm:w-auto px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 mx-auto"
          >
            <span>Start Topic Mastery Test</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. IN_PROGRESS STATE: ACTIVE TEST */}
      {testState === 'in_progress' && currentQ && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-extrabold text-sm">
                {currentQuestionIndex + 1}/{testQuestions.length}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-700">
                  {unitData.topic.name}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                  Question {currentQuestionIndex + 1} of {testQuestions.length}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                  timeRemainingSeconds < 30
                    ? 'bg-rose-100 text-rose-800 animate-pulse'
                    : 'bg-stone-100 text-stone-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>

              <button
                id="btn-submit-mastery-test"
                onClick={handleCompleteTest}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Question Stepper */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {testQuestions.map((q, idx) => {
              const isAnswered = Boolean(selectedAnswers[q.id]);
              const isCurrent = currentQuestionIndex === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-purple-600 ring-offset-1 bg-purple-600 text-white'
                      : isAnswered
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 text-xs">
              <span className="font-bold text-stone-500 uppercase tracking-wider">
                Difficulty: {currentQ.difficulty.replace('_', ' ')}
              </span>
              <span className="text-stone-400">ID #{currentQ.id.slice(-4)}</span>
            </div>

            <p className="text-sm sm:text-base font-semibold text-stone-900 leading-relaxed">
              {currentQ.content}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === option.id;
                const optionLetter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectAnswer(currentQ.id, option.id)}
                    className={`w-full text-left p-4 rounded-xl border transition flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20 text-purple-950 font-medium'
                        : 'border-stone-200 bg-stone-50/40 hover:bg-stone-100/70 text-stone-800'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {optionLetter}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed">{option.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer Navigation */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-30 text-stone-700 text-xs font-bold rounded-xl transition"
              >
                Previous
              </button>

              <span className="text-xs text-stone-500">
                {answeredCount} of {testQuestions.length} Answered
              </span>

              {isLastQuestion ? (
                <button
                  onClick={handleCompleteTest}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Submit Assessment
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPLETED STATE: EVALUATION & MASTERY UPDATE */}
      {testState === 'completed' && evaluationResult && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-300">
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xs ${
                  evaluationResult.passed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {evaluationResult.accuracyPercentage}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      evaluationResult.masteryLevel === 'mastered'
                        ? 'bg-purple-100 text-purple-800'
                        : evaluationResult.masteryLevel === 'proficient'
                        ? 'bg-emerald-100 text-emerald-800'
                        : evaluationResult.masteryLevel === 'developing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Level: {evaluationResult.masteryLevel}
                  </span>
                  <span className="text-xs text-stone-500">
                    Time: {formatTime(evaluationResult.timeSpentSeconds)}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 mt-0.5">
                  {evaluationResult.passed
                    ? 'Mastery Assessment Passed!'
                    : 'Topic Assessment Completed'}
                </h3>
              </div>
            </div>

            {/* Score Delta */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-right">
              <span className="text-[10px] font-bold text-stone-500 uppercase block">
                Mastery Score Updated
              </span>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-stone-400 line-through">
                  {evaluationResult.previousMasteryScore}%
                </span>
                <span className="text-base font-black text-stone-900">
                  {evaluationResult.updatedMasteryScore}%
                </span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    evaluationResult.updatedMasteryScore >= evaluationResult.previousMasteryScore
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {evaluationResult.updatedMasteryScore >= evaluationResult.previousMasteryScore ? '+' : ''}
                  {evaluationResult.updatedMasteryScore - evaluationResult.previousMasteryScore}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Demonstrated Strengths</span>
              </div>
              <ul className="space-y-1 text-xs text-emerald-950 pl-5 list-disc">
                {evaluationResult.strengths.length > 0 ? (
                  evaluationResult.strengths.map((s, i) => <li key={i}>{s}</li>)
                ) : (
                  <li>Consistent effort during timed assessment.</li>
                )}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Areas to Polish</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-950 pl-5 list-disc">
                {evaluationResult.weaknesses.length > 0 ? (
                  evaluationResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)
                ) : (
                  <li>No major gaps detected on this set.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Next Learning Steps</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-700 pl-5 list-disc">
              {evaluationResult.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
            <button
              onClick={startTest}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Mastery Test</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onNavigateSection('learn')}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Back to Learn</span>
              </button>
              <button
                onClick={() => onNavigateSection('ai-tutor')}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Review with AI Tutor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

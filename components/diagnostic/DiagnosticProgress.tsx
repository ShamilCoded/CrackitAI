'use client';

import React from 'react';
import { Timer, Bookmark, Check, AlertCircle } from 'lucide-react';
import type { Question } from '@/types';

interface DiagnosticProgressProps {
  currentIndex: number;
  totalQuestions: number;
  questions: Question[];
  answeredQuestionIds: Set<string>;
  flaggedQuestionIds: Set<string>;
  secondsRemaining: number;
  onSelectIndex: (index: number) => void;
  onFinishReview: () => void;
  currentSubjectName: string;
}

export function DiagnosticProgress({
  currentIndex,
  totalQuestions,
  questions,
  answeredQuestionIds,
  flaggedQuestionIds,
  secondsRemaining,
  onSelectIndex,
  onFinishReview,
  currentSubjectName,
}: DiagnosticProgressProps) {
  const answeredCount = answeredQuestionIds.size;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Format timer
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isTimeUrgent = secondsRemaining < 300; // < 5 mins

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3" id="diagnostic-progress-header">
      {/* Top Bar: Subject, Index, Timer, Finish Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {currentSubjectName}
          </span>
          <span className="text-xs font-medium text-slate-500">
            Question <strong className="text-slate-900">{currentIndex + 1}</strong> of{' '}
            <strong className="text-slate-900">{totalQuestions}</strong>
          </span>
        </div>

        {/* Right: Timer & Finish CTA */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
              isTimeUrgent
                ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            type="button"
            id="btn-finish-review"
            onClick={onFinishReview}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            Finish & Review
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-600">
          <span>{answeredCount} of {totalQuestions} answered ({progressPercent}%)</span>
          <span>{flaggedQuestionIds.size} flagged for review</span>
        </div>
      </div>

      {/* Interactive Question Tracker Palette */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = answeredQuestionIds.has(q.id);
          const isFlagged = flaggedQuestionIds.has(q.id);

          let baseClass = 'w-7 h-7 rounded-lg text-xs font-medium transition-all flex items-center justify-center relative border';

          if (isCurrent) {
            baseClass += ' bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20';
          } else if (isAnswered) {
            baseClass += ' bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100';
          } else {
            baseClass += ' bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
          }

          return (
            <button
              key={q.id}
              type="button"
              id={`tracker-dot-${idx + 1}`}
              onClick={() => onSelectIndex(idx)}
              className={baseClass}
              title={`Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'}${isFlagged ? ', Flagged' : ''})`}
            >
              <span>{idx + 1}</span>
              {isFlagged && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

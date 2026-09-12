'use client';

import React from 'react';
import {
  Bookmark,
  ShieldCheck,
  Zap,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import type { Question, ConfidenceLevel } from '@/types';

interface DiagnosticQuestionCardProps {
  question: Question;
  selectedOptionId: string | null;
  confidence: ConfidenceLevel;
  isFlagged: boolean;
  onSelectOption: (optionId: string) => void;
  onSelectConfidence: (level: ConfidenceLevel) => void;
  onToggleFlag: () => void;
  onClearAnswer: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  questionNumber: number;
}

export function DiagnosticQuestionCard({
  question,
  selectedOptionId,
  confidence,
  isFlagged,
  onSelectOption,
  onSelectConfidence,
  onToggleFlag,
  onClearAnswer,
  onPrevious,
  onNext,
  isFirst,
  isLast,
  questionNumber,
}: DiagnosticQuestionCardProps) {
  // Format topic name cleanly
  const topicLabel = question.topicId
    ? question.topicId
        .replace(/^topic-[a-z]+-/, '')
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'General Curriculum';

  // Format difficulty badge color
  const difficultyBadge = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    hard: 'bg-rose-50 text-rose-700 border-rose-200',
    exam_level: 'bg-purple-50 text-purple-700 border-purple-200',
  }[question.difficulty || 'medium'];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6" id={`question-card-${question.id}`}>
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
            MCQ #{questionNumber}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${difficultyBadge}`}>
            {(question.difficulty || 'medium').toUpperCase()}
          </span>
          <span className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
            {topicLabel}
          </span>
        </div>

        {/* Flag Button */}
        <button
          type="button"
          id="btn-toggle-flag"
          onClick={onToggleFlag}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            isFlagged
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
          <span>{isFlagged ? 'Flagged' : 'Flag for Review'}</span>
        </button>
      </div>

      {/* Question Statement */}
      <div className="space-y-2">
        <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
          {question.questionText || question.content}
        </p>

        {question.pastPaperSource && (
          <span className="inline-block text-[11px] font-medium text-indigo-600 bg-indigo-50/60 px-2.5 py-0.5 rounded border border-indigo-100">
            Source: {question.pastPaperSource}
          </span>
        )}
      </div>

      {/* Options List */}
      <div className="space-y-2.5" role="radiogroup" aria-label="Answer Options">
        {question.options.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          const letter = opt.optionKey || String.fromCharCode(65 + idx);

          return (
            <button
              key={opt.id}
              type="button"
              id={`opt-${opt.id}`}
              onClick={() => onSelectOption(opt.id)}
              className={`w-full flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {letter}
              </div>
              <div className="flex-1 pt-0.5 text-sm text-slate-800 leading-snug">
                {opt.optionText || opt.text}
              </div>
              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Confidence Selector & Clear Action */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            <span>How certain are you of this answer?</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-conf-low"
              onClick={() => onSelectConfidence('low')}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                confidence === 'low'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Low Certainty
            </button>
            <button
              type="button"
              id="btn-conf-medium"
              onClick={() => onSelectConfidence('medium')}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                confidence === 'medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Medium
            </button>
            <button
              type="button"
              id="btn-conf-high"
              onClick={() => onSelectConfidence('high')}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                confidence === 'high'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              High (Sure)
            </button>
          </div>
        </div>

        {selectedOptionId && (
          <button
            type="button"
            onClick={onClearAnswer}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-rose-600 transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Answer</span>
          </button>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          id="btn-prev-question"
          onClick={onPrevious}
          disabled={isFirst}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          id="btn-next-question"
          onClick={onNext}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
        >
          <span>{isLast ? 'Review & Submit' : 'Next Question'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

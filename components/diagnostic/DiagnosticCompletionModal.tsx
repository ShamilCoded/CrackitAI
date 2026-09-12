'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Bookmark, Clock, ArrowRight, X } from 'lucide-react';

interface DiagnosticCompletionModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  secondsRemaining: number;
  onClose: () => void;
  onSubmitFinal: () => void;
  isSubmitting?: boolean;
}

export function DiagnosticCompletionModal({
  isOpen,
  totalQuestions,
  answeredCount,
  flaggedCount,
  secondsRemaining,
  onClose,
  onSubmitFinal,
  isSubmitting = false,
}: DiagnosticCompletionModalProps) {
  if (!isOpen) return null;

  const unattemptedCount = totalQuestions - answeredCount;
  const minutesRemaining = Math.floor(secondsRemaining / 60);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      id="diagnostic-completion-modal"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Assessment Summary
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Submit Diagnostic Test?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Summary Stats */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-center">
            <span className="text-[11px] font-medium text-slate-500 block">Answered</span>
            <span className="text-lg font-bold text-emerald-700 block mt-0.5">
              {answeredCount}
            </span>
          </div>

          <div className="text-center border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Unattempted</span>
            <span className={`text-lg font-bold block mt-0.5 ${
              unattemptedCount > 0 ? 'text-amber-600' : 'text-slate-700'
            }`}>
              {unattemptedCount}
            </span>
          </div>

          <div className="text-center border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Flagged</span>
            <span className="text-lg font-bold text-slate-700 block mt-0.5">
              {flaggedCount}
            </span>
          </div>
        </div>

        {/* Warning if unattempted */}
        {unattemptedCount > 0 ? (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              You have <strong>{unattemptedCount} unattempted</strong> {unattemptedCount === 1 ? 'question' : 'questions'}.
              Any unattempted questions will be awarded 0 marks and their topics classified accordingly.
            </span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>
              All <strong>{totalQuestions} questions</strong> have been answered! Time remaining:{' '}
              {minutesRemaining} minutes.
            </span>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Submitting will calculate your overall score, topic classifications, time pacing, confidence metrics,
          and recommend your immediate Learning Unit recovery step.
        </p>

        {/* Modal CTAs */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            Return to Questions
          </button>

          <button
            type="button"
            id="btn-confirm-final-submit"
            onClick={onSubmitFinal}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Evaluating...</span>
            ) : (
              <>
                <span>Confirm & Finalize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

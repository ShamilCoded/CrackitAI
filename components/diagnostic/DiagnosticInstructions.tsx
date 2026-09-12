'use client';

import React from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import type { ExamType } from '@/types';

interface DiagnosticInstructionsProps {
  examType: ExamType;
  onBack: () => void;
  onProceed: () => void;
}

export function DiagnosticInstructions({
  examType,
  onBack,
  onProceed,
}: DiagnosticInstructionsProps) {
  const isEcat = examType === 'ECAT';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-4 px-2" id="diagnostic-instructions-view">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Diagnostic Overview</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {examType} Diagnostic Instructions & Scoring Policy
          </h1>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Official Format
        </span>
      </div>

      {/* Marking Scheme */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Marking Scheme & Scoring Rules
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-800 block">Correct Response</span>
            <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
              {isEcat ? '+4 Marks' : '+1 Mark'}
            </span>
            <span className="text-[11px] text-emerald-600">Full credit awarded</span>
          </div>

          <div className={`p-3 rounded-lg border ${
            isEcat ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-xs font-semibold block ${isEcat ? 'text-rose-800' : 'text-slate-700'}`}>
              Incorrect Response
            </span>
            <span className={`text-lg font-bold mt-0.5 block ${isEcat ? 'text-rose-700' : 'text-slate-700'}`}>
              {isEcat ? '-1 Mark Penalty' : '0 Marks'}
            </span>
            <span className={`text-[11px] ${isEcat ? 'text-rose-600' : 'text-slate-500'}`}>
              {isEcat ? 'Negative marking active' : 'No negative marking'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-700 block">Unattempted MCQ</span>
            <span className="text-lg font-bold text-slate-800 mt-0.5 block">0 Marks</span>
            <span className="text-[11px] text-slate-500">Neutral impact on score</span>
          </div>
        </div>

        {isEcat && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200/80 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>ECAT Strategic Rule:</strong> Guessing blindly without eliminating options is penalized. If unsure, mark your confidence as low or consider skipping.
            </span>
          </p>
        )}
      </div>

      {/* Topic Classification Thresholds (Explicitly Documented) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Pedagogical Topic Classification
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Configurable Benchmarks</span>
        </div>

        <p className="text-xs text-slate-600">
          Following this diagnostic, every tested topic is mathematically classified based on accuracy:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-800">Strong</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 block">≥ 75% Accuracy</span>
            <span className="text-[11px] text-slate-600 mt-1 block">
              Demonstrates solid mastery and exam readiness.
            </span>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-800">Developing</span>
            </div>
            <span className="text-xs font-semibold text-amber-700 block">50% – 74% Accuracy</span>
            <span className="text-[11px] text-slate-600 mt-1 block">
              Partial competence; requires targeted revision.
            </span>
          </div>

          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs font-bold text-rose-800">Weak</span>
            </div>
            <span className="text-xs font-semibold text-rose-700 block">&lt; 50% Accuracy</span>
            <span className="text-[11px] text-slate-600 mt-1 block">
              Critical gaps; routed directly to Learning Unit.
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-xs font-bold text-slate-700">Unknown</span>
            </div>
            <span className="text-xs font-semibold text-slate-600 block">0 Questions</span>
            <span className="text-[11px] text-slate-600 mt-1 block">
              Untested syllabus topics pending evaluation.
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Calibration */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            3. Metacognitive Confidence Tracking
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          For each question, select your perceived certainty (<strong>Low</strong>, <strong>Medium</strong>, or <strong>High</strong>). The engine correlates your confidence ratings against true accuracy to calculate calibration:
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li><strong>High Confidence:</strong> You know the exact formula, derivation, or rule.</li>
          <li><strong>Medium Confidence:</strong> You eliminated 2 options and made an educated choice.</li>
          <li><strong>Low Confidence:</strong> Uncertain or guessing.</li>
        </ul>
      </div>

      {/* CTAs */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
        >
          Cancel & Return
        </button>

        <button
          type="button"
          id="btn-proceed-to-diagnostic"
          onClick={onProceed}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
        >
          <span>I Understand — Start Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

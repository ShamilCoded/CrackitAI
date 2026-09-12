'use client';

import React from 'react';
import Link from 'next/link';
import type { WhyExplanation } from '@/types';
import {
  Sparkles,
  HelpCircle,
  X,
  Target,
  BookOpen,
  Award,
  AlertTriangle,
  Clock,
  TrendingUp,
  Brain,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface WhyExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: WhyExplanation | null;
  onStartPractice?: (topicId: string) => void;
}

export function WhyExplanationModal({
  isOpen,
  onClose,
  explanation,
  onStartPractice,
}: WhyExplanationModalProps) {
  if (!isOpen || !explanation) return null;

  const masteryStatusColor =
    explanation.masteryScore >= 70
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : explanation.masteryScore >= 45
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-stone-200 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-stone-100 text-stone-700">
                <Brain className="w-4 h-4 text-emerald-600" />
              </span>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Personalization Intelligence
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">Why am I seeing this?</h3>
            <p className="text-xs text-stone-500">
              Deterministic pedagogical audit & AI rationale for{' '}
              <strong className="text-stone-800">{explanation.topicName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Algorithmic Reason */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
            <Target className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Primary Decision Factor</span>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed pl-6">{explanation.primaryReason}</p>
        </div>

        {/* Core Mathematical Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1">
            <div className="text-[10px] uppercase font-bold text-stone-500">Current Mastery</div>
            <div className="text-lg font-black text-stone-900">{explanation.masteryScore}%</div>
            <span
              className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${masteryStatusColor}`}
            >
              {explanation.masteryStatus}
            </span>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1">
            <div className="text-[10px] uppercase font-bold text-stone-500">Exam Importance</div>
            <div className="text-lg font-black text-stone-900">
              {explanation.importanceRating}
              <span className="text-xs text-stone-400">/5</span>
            </div>
            <span className="inline-block text-[10px] font-semibold text-stone-600">
              ~{explanation.examWeightPercentage || 5}% of marks
            </span>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1">
            <div className="text-[10px] uppercase font-bold text-stone-500">Recent Accuracy</div>
            <div className="text-lg font-black text-stone-900">
              {explanation.recentAccuracy !== undefined ? `${explanation.recentAccuracy}%` : 'N/A'}
            </div>
            <span className="inline-block text-[10px] text-stone-500">
              {explanation.totalAttempts || 0} attempts
            </span>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1">
            <div className="text-[10px] uppercase font-bold text-stone-500">Subject Area</div>
            <div className="text-sm font-bold text-stone-900 truncate pt-1">
              {explanation.subjectName}
            </div>
            <span className="inline-block text-[10px] text-emerald-700 font-semibold">
              High-Yield Unit
            </span>
          </div>
        </div>

        {/* Retention Spacing Alert if present */}
        {explanation.retentionAlert && (
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Spaced Repetition Trigger:</span>{' '}
              {explanation.retentionAlert}
            </div>
          </div>
        )}

        {/* Pedagogical Strategy & AI Coach Tip */}
        <div className="space-y-3 pt-1">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Pedagogical Objective</span>
            </div>
            <p className="text-blue-800 leading-relaxed pl-5">{explanation.pedagogicalObjective}</p>
          </div>

          {explanation.aiCoachTip && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Tutor Strategy Tip</span>
              </div>
              <p className="text-emerald-800 leading-relaxed pl-5">{explanation.aiCoachTip}</p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <Link
              href={`/student/learn/${explanation.topicId}`}
              className="px-3 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
              onClick={onClose}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Open Learning Unit</span>
            </Link>

            <button
              onClick={() => {
                onClose();
                if (onStartPractice) {
                  onStartPractice(explanation.topicId);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Start Practice Drill</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

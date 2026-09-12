'use client';

import React, { useState } from 'react';
import type { FullLearningUnit } from '@/types/learning-unit';
import type { Question } from '@/types';
import {
  RotateCcw,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Bookmark,
  Sparkles,
  Trophy,
  ArrowRight,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface RevisionSectionProps {
  unitData: FullLearningUnit;
  onNavigateSection: (section: 'practice' | 'ai-tutor' | 'mastery-test', question?: Question) => void;
}

export function RevisionSection({ unitData, onNavigateSection }: RevisionSectionProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'mistakes' | 'weak-concepts' | 'review-items'>('all');
  const revision = unitData.revisionData;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Revision Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Personalized Revision & Mistake Remediation
            </span>
            <h3 className="text-base font-extrabold text-stone-900">
              {unitData.topic.name} Revision Hub
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateSection('ai-tutor')}
              className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Ask Tutor to Review Weak Points</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Insights ({revision.weakConcepts.length + revision.previousMistakes.length + revision.reviewItems.length})
          </button>
          <button
            onClick={() => setActiveTab('weak-concepts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'weak-concepts'
                ? 'bg-amber-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Weak Concepts ({revision.weakConcepts.length})
          </button>
          <button
            onClick={() => setActiveTab('mistakes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'mistakes'
                ? 'bg-rose-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Previous Mistakes ({revision.previousMistakes.length})
          </button>
          <button
            onClick={() => setActiveTab('review-items')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'review-items'
                ? 'bg-blue-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Review Cheat Sheet ({revision.reviewItems.length})
          </button>
        </div>
      </div>

      {/* 1. Weak Concepts */}
      {(activeTab === 'all' || activeTab === 'weak-concepts') && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Diagnosed Weak Concepts</span>
            </h3>
            <span className="text-[11px] text-stone-500">Based on diagnostic telemetry</span>
          </div>

          <div className="space-y-3">
            {revision.weakConcepts.map((wc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 space-y-2 hover:bg-stone-50 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        wc.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : wc.severity === 'moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {wc.severity} priority
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">{wc.concept}</h4>
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed pl-1">
                  <strong className="text-stone-900">Remedy:</strong> {wc.remedy}
                </p>

                {wc.relevantObjectiveStatement && (
                  <div className="text-[11px] text-stone-500 pl-1">
                    Related syllabus objective: <em>{wc.relevantObjectiveStatement}</em>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Previous Mistakes Breakdown */}
      {(activeTab === 'all' || activeTab === 'mistakes') && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Previous Exam Mistakes & Trap Analysis</span>
            </h3>
            <span className="text-[11px] text-stone-500">Questions you missed</span>
          </div>

          <div className="space-y-4">
            {revision.previousMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="p-4.5 rounded-xl border border-rose-200/80 bg-rose-50/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                    Question #{mistake.questionId.slice(-4)}
                  </span>
                  {mistake.timestamp && (
                    <span className="text-[10px] text-stone-400">{mistake.timestamp}</span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-semibold text-stone-900 leading-relaxed">
                  {mistake.questionContent}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-rose-100/60 border border-rose-200 text-rose-900">
                    <span className="text-[10px] font-bold uppercase block text-rose-700">
                      Your Attempt:
                    </span>
                    <span className="font-semibold">{mistake.studentSelectedOption}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-100/60 border border-emerald-200 text-emerald-950">
                    <span className="text-[10px] font-bold uppercase block text-emerald-700">
                      Correct Key:
                    </span>
                    <span className="font-semibold">{mistake.correctOption}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-700 leading-relaxed">
                  <strong className="text-rose-900">Why this was wrong:</strong>{' '}
                  {mistake.misconceptionAnalysis}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Recommended Practice Questions */}
      {revision.recommendedQuestions.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recommended Practice Questions</span>
            </h3>
            <span className="text-[11px] text-stone-500">Hand-picked to strengthen weaknesses</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {revision.recommendedQuestions.slice(0, 4).map((q, i) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/30 flex flex-col justify-between gap-3 hover:border-emerald-300 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-stone-500">
                      Drill #{i + 1}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-stone-800 line-clamp-2 font-medium">{q.content}</p>
                </div>

                <button
                  onClick={() => onNavigateSection('practice', q)}
                  className="w-full text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1.5 rounded-lg transition text-center"
                >
                  Solve This Problem →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Review Items & Flashcards */}
      {(activeTab === 'all' || activeTab === 'review-items') && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-600" />
              <span>Key Takeaway Review Items</span>
            </h3>
            <span className="text-[11px] text-stone-500">Core mental anchors</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {revision.reviewItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded inline-block ${
                      item.category === 'formula'
                        ? 'bg-blue-100 text-blue-800'
                        : item.category === 'shortcut'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900">{item.title}</h4>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-mono bg-white p-2 rounded-lg border border-stone-200/80">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mastery Test CTA */}
      <div className="p-5 bg-linear-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-900">
            <Trophy className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-extrabold">Ready to Prove Topic Mastery?</h4>
          </div>
          <p className="text-xs text-purple-800 max-w-lg">
            Take the timed Mastery Test to calculate and update your official topic mastery score.
          </p>
        </div>

        <button
          onClick={() => onNavigateSection('mastery-test')}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <span>Begin Mastery Test</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

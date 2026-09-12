'use client';

import React, { useState } from 'react';
import type { FullLearningUnit } from '@/types/learning-unit';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Award,
  Clock,
  Target,
  FileText,
  Lightbulb,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LearnSectionProps {
  unitData: FullLearningUnit;
  onNavigateSection: (section: 'examples' | 'practice' | 'ai-tutor') => void;
}

export function LearnSection({ unitData, onNavigateSection }: LearnSectionProps) {
  const [expandedConceptIdx, setExpandedConceptIdx] = useState<number | null>(0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Topic Overview & Context */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Core Topic Overview
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-stone-900">
                {unitData.topic.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>{unitData.unit.estimatedMinutes} mins est.</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Yield: {unitData.topic.importanceRating}/5</span>
            </span>
          </div>
        </div>

        <p className="text-sm text-stone-700 leading-relaxed font-normal">
          {unitData.overview}
        </p>

        {/* Quick Section CTAs */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <button
            id="btn-learn-to-examples"
            onClick={() => onNavigateSection('examples')}
            className="text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>View {unitData.workedExamples.length} Worked Examples</span>
          </button>
          <button
            id="btn-learn-to-practice"
            onClick={() => onNavigateSection('practice')}
            className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span>Practice Topic Questions ({unitData.practiceQuestions.length})</span>
          </button>
          <button
            id="btn-learn-to-tutor"
            onClick={() => onNavigateSection('ai-tutor')}
            className="text-xs font-bold text-stone-900 bg-linear-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 border border-teal-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Ask AI Tutor About Concepts</span>
          </button>
        </div>
      </div>

      {/* 2. Bloom's Taxonomy Learning Objectives */}
      {unitData.learningObjectives.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Target Learning Objectives ({unitData.learningObjectives.length})</span>
            </h3>
            <span className="text-[11px] text-stone-500">Graded by Bloom&apos;s Cognitive Depth</span>
          </div>

          <div className="space-y-2.5">
            {unitData.learningObjectives.map((lo) => (
              <div
                key={lo.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition"
              >
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                    lo.bloomTaxonomyLevel === 'evaluate' || lo.bloomTaxonomyLevel === 'create'
                      ? 'bg-purple-100 text-purple-800'
                      : lo.bloomTaxonomyLevel === 'analyze'
                      ? 'bg-amber-100 text-amber-800'
                      : lo.bloomTaxonomyLevel === 'apply'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {lo.bloomTaxonomyLevel}
                </span>
                <p className="text-xs sm:text-sm text-stone-700 leading-snug font-medium">
                  {lo.statement}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Key Concepts */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Fundamental Pedagogical Concepts</span>
        </h3>

        <div className="space-y-3">
          {unitData.unit.keyConcepts.map((concept, idx) => {
            const isExpanded = expandedConceptIdx === idx;
            return (
              <div
                key={idx}
                className="border border-stone-200 rounded-xl overflow-hidden transition"
              >
                <button
                  onClick={() => setExpandedConceptIdx(isExpanded ? null : idx)}
                  className="w-full text-left p-4 bg-stone-50/80 hover:bg-stone-100/70 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                      {concept}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white border-t border-stone-100 text-xs text-stone-600 leading-relaxed space-y-2">
                    <p>
                      <strong>Exam Implication:</strong> In past entrance papers, questions on this concept frequently challenge students by altering initial boundary conditions or testing scalar vs vector distinctions.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Make sure to practice identifying this concept in the Practice section.</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Key Formulas */}
      {unitData.unit.keyFormulas.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>High-Yield Governing Formulas</span>
            </h3>
            <span className="text-[11px] text-stone-500">Memorize for Speed & Accuracy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unitData.unit.keyFormulas.map((formula, i) => (
              <div
                key={i}
                className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1 hover:border-blue-300 transition"
              >
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Relation #{i + 1}
                </span>
                <div className="font-mono text-xs sm:text-sm font-bold text-stone-900 bg-white p-2.5 rounded-lg border border-stone-200/80 shadow-2xs">
                  {formula}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Important Definitions */}
      {unitData.definitions.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-stone-700" />
              <span>Important Definitions & Operational Terms</span>
            </h3>
            <span className="text-[11px] text-stone-500">Strict Syllabus Definitions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {unitData.definitions.map((def) => (
              <div
                key={def.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 space-y-2 hover:bg-stone-50 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-stone-900">{def.term}</h4>
                  {def.symbolOrUnit && (
                    <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded">
                      {def.symbolOrUnit}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">{def.definition}</p>
                {def.examNote && (
                  <div className="pt-1 text-[11px] font-medium text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
                    <strong>Note:</strong> {def.examNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Common Mistakes & Pitfalls */}
      {unitData.commonPitfalls.length > 0 && (
        <div className="bg-rose-50/40 border border-rose-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Common Exam Traps & Examiner Pitfalls</span>
            </h3>
            <span className="text-[11px] text-rose-700 font-semibold">How to prevent lost marks</span>
          </div>

          <div className="space-y-3">
            {unitData.commonPitfalls.map((pitfall, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white border border-rose-200 shadow-2xs space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    !
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-rose-950">
                      {pitfall.trap}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      <strong className="text-stone-800">Why it happens:</strong>{' '}
                      {pitfall.whyItHappens}
                    </p>
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      <strong>How to avoid:</strong> {pitfall.howToAvoid}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

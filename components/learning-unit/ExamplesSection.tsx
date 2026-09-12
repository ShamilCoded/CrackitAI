'use client';

import React, { useState } from 'react';
import type { FullLearningUnit, WorkedExample } from '@/types/learning-unit';
import {
  FileText,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface ExamplesSectionProps {
  unitData: FullLearningUnit;
  onNavigateSection: (section: 'practice' | 'ai-tutor') => void;
}

export function ExamplesSection({ unitData, onNavigateSection }: ExamplesSectionProps) {
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);

  if (unitData.workedExamples.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-4">
        <FileText className="w-10 h-10 text-stone-400 mx-auto" />
        <h3 className="text-base font-bold text-stone-900">No Worked Examples Added Yet</h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          Worked step-by-step examples for {unitData.topic.name} are being compiled. You can practice exam questions right away.
        </p>
        <button
          onClick={() => onNavigateSection('practice')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
        >
          Go to Practice Section
        </button>
      </div>
    );
  }

  const currentExample: WorkedExample =
    unitData.workedExamples[selectedExampleIndex] || unitData.workedExamples[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Selector / Tabs for Worked Examples */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              Exam Problem Walkthroughs
            </span>
            <h3 className="text-base font-extrabold text-stone-900">
              Worked Step-by-Step Solutions ({unitData.workedExamples.length})
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Curated from past ECAT & MDCAT high-yield patterns
          </span>
        </div>

        {/* Tab Pills for multiple examples */}
        <div className="flex flex-wrap items-center gap-2 pt-3">
          {unitData.workedExamples.map((ex, idx) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExampleIndex(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                selectedExampleIndex === idx
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80'
              }`}
            >
              <span>Example {idx + 1}</span>
              <span
                className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                  selectedExampleIndex === idx
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {ex.difficulty}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Example Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Title & Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Problem {selectedExampleIndex + 1}
              </span>
              {currentExample.targetExam && (
                <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  {currentExample.targetExam} Standard
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 leading-snug">
              {currentExample.title}
            </h2>
          </div>
          <span
            className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full shrink-0 ${
              currentExample.difficulty === 'exam_level'
                ? 'bg-purple-100 text-purple-800'
                : currentExample.difficulty === 'hard'
                ? 'bg-rose-100 text-rose-800'
                : currentExample.difficulty === 'medium'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {currentExample.difficulty.replace('_', ' ')}
          </span>
        </div>

        {/* Problem Statement */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4.5 space-y-3">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Problem Statement
          </h4>
          <p className="text-sm text-stone-800 leading-relaxed font-medium">
            {currentExample.problemStatement}
          </p>

          {/* Given Data Parameters */}
          {currentExample.givenData && (
            <div className="pt-2 border-t border-stone-200/70">
              <span className="text-[11px] font-bold text-stone-600 uppercase">Given Parameters:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                {Object.entries(currentExample.givenData).map(([k, v]) => (
                  <div key={k} className="p-2 bg-white rounded-lg border border-stone-200 text-xs">
                    <span className="text-[10px] text-stone-500 block truncate">{k}</span>
                    <span className="font-mono font-bold text-stone-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step-by-Step Solution */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Step-by-Step Solution Breakdown</span>
          </h4>

          <div className="space-y-3.5">
            {currentExample.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 space-y-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </span>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">{step.title}</h5>
                </div>

                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed pl-8">
                  {step.explanation}
                </p>

                {step.mathExpression && (
                  <div className="ml-8 font-mono text-xs sm:text-sm font-bold text-stone-900 bg-white p-3 rounded-lg border border-stone-200/90 shadow-2xs">
                    {step.mathExpression}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final Answer Banner */}
        <div className="p-4.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
            Verified Final Answer
          </span>
          <div className="font-mono text-sm sm:text-base font-black text-emerald-950">
            {currentExample.finalAnswer}
          </div>
        </div>

        {/* Exam Shortcut / Golden Rule */}
        {currentExample.examShortcutTip && (
          <div className="p-4.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-amber-900">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <h5 className="text-xs font-bold uppercase tracking-wider">
                Exam Shortcut & Speed Technique
              </h5>
            </div>
            <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed pl-6">
              {currentExample.examShortcutTip}
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100">
          <div className="flex items-center gap-2">
            {selectedExampleIndex > 0 && (
              <button
                onClick={() => setSelectedExampleIndex((prev) => prev - 1)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
              >
                Previous Example
              </button>
            )}
            {selectedExampleIndex < unitData.workedExamples.length - 1 && (
              <button
                onClick={() => setSelectedExampleIndex((prev) => prev + 1)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
              >
                <span>Next Example</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onNavigateSection('ai-tutor')}
              className="text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Ask AI Tutor to Explain</span>
            </button>
            <button
              onClick={() => onNavigateSection('practice')}
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Solve Practice Problems</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

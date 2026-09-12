'use client';

import React from 'react';
import {
  Brain,
  Timer,
  BookOpen,
  Award,
  ArrowRight,
  HelpCircle,
  BarChart3,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { ExamType, DiagnosticTest } from '@/types';

interface DiagnosticIntroProps {
  examType: ExamType;
  onExamTypeChange: (type: ExamType) => void;
  availableTests: DiagnosticTest[];
  selectedTestId: string;
  onSelectTest: (testId: string) => void;
  onStart: () => void;
  onViewInstructions: () => void;
  onViewPastResults: () => void;
  hasPastResults: boolean;
}

export function DiagnosticIntro({
  examType,
  onExamTypeChange,
  availableTests,
  selectedTestId,
  onSelectTest,
  onStart,
  onViewInstructions,
  onViewPastResults,
  hasPastResults,
}: DiagnosticIntroProps) {
  const currentTest =
    availableTests.find((t) => t.id === selectedTestId) || availableTests[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-4 px-2" id="diagnostic-intro-view">
      {/* Exam Switcher & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Module 04: Diagnostic Engine
            </span>
            <span className="text-xs font-medium text-slate-400">Baseline Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {examType} Adaptive Diagnostic Assessment
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Calibrate your baseline readiness across all high-yield subjects. This assessment identifies
            critical knowledge gaps and classifies syllabus topics to formulate your personalized study plan.
          </p>
        </div>

        {/* Exam Type Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            id="btn-select-ecat"
            onClick={() => onExamTypeChange('ECAT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              examType === 'ECAT'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ECAT (Engineering)
          </button>
          <button
            type="button"
            id="btn-select-mdcat"
            onClick={() => onExamTypeChange('MDCAT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              examType === 'MDCAT'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            MDCAT (Medical)
          </button>
        </div>
      </div>

      {/* Test Card & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Test Details & Quotas */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Official Syllabus Blueprint
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {currentTest?.name || `${examType} Baseline Diagnostic`}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {currentTest?.description ||
                  'Balanced representation of high-yield topics to rapidly uncover knowledge gaps.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
              <Brain className="w-4 h-4" />
              <span>Adaptive</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-600 uppercase">Questions</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5">
                {currentTest?.totalQuestions || 15} MCQs
              </span>
              <span className="text-[11px] text-slate-600 mt-0.5">High-yield sampling</span>
            </div>

            <div className="flex flex-col border-l border-slate-200 pl-3">
              <span className="text-[11px] font-medium text-slate-600 uppercase">Time Limit</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5">
                {currentTest?.timeLimitMinutes || 30} Mins
              </span>
              <span className="text-[11px] text-slate-600 mt-0.5">~90s per question</span>
            </div>

            <div className="flex flex-col border-l border-slate-200 pl-3">
              <span className="text-[11px] font-medium text-slate-600 uppercase">Scoring</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5">
                {examType === 'ECAT' ? '+4 / -1' : '+1 / 0'}
              </span>
              <span className="text-[11px] text-slate-600 mt-0.5">
                {examType === 'ECAT' ? 'Negative marking' : 'Standard MDCAT'}
              </span>
            </div>
          </div>

          {/* Subject Breakdown Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Subject Allocation</span>
              <span>{examType === 'ECAT' ? '4 Core Subjects' : '4 PMDC Subjects'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {examType === 'ECAT' ? (
                <>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="block text-xs font-semibold text-slate-800">Mathematics</span>
                    <span className="text-[11px] text-slate-600">Calculus & Algebra</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="block text-xs font-semibold text-slate-800">Physics</span>
                    <span className="text-[11px] text-slate-600">Mechanics & Fields</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="block text-xs font-semibold text-slate-800">Chemistry</span>
                    <span className="text-[11px] text-slate-600">Equilibrium & Atoms</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="block text-xs font-semibold text-slate-800">English</span>
                    <span className="text-[11px] text-slate-600">Grammar & Syntax</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="block text-xs font-semibold text-slate-800">Biology</span>
                    <span className="text-[11px] text-slate-600">Cell & Genetics</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="block text-xs font-semibold text-slate-800">Chemistry</span>
                    <span className="text-[11px] text-slate-600">Equilibrium & Bonding</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="block text-xs font-semibold text-slate-800">Physics</span>
                    <span className="text-[11px] text-slate-600">Waves & Electrostatics</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="block text-xs font-semibold text-slate-800">English</span>
                    <span className="text-[11px] text-slate-600">Vocabulary & Rules</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Assessment Objectives & Action */}
        <div className="flex flex-col justify-between bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Diagnostic Goals
              </h3>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Identify Weak Topics:</strong> Pinpoint exact conceptual bottlenecks with
                  rigorous accuracy thresholds.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Topic Classification:</strong> Group every tested concept into Strong,
                  Developing, Weak, or Unknown.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Immediate Recovery Step:</strong> Generates a direct transition into the
                  Learning Unit for your top weak area.
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-800">
            <button
              type="button"
              id="btn-start-diagnostic"
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Begin Diagnostic Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-view-instructions"
              onClick={onViewInstructions}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Read Exam Instructions</span>
            </button>

            {hasPastResults && (
              <button
                type="button"
                id="btn-view-past-diagnostic"
                onClick={onViewPastResults}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-medium transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>View Past Diagnostic Results</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

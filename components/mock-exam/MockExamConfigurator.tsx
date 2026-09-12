'use client';

import React, { useState } from 'react';
import type { ExamType, MockPresetKey, MockAttempt } from '@/types';
import { mockExamService } from '@/services/mock-exam';
import {
  Clock,
  CheckCircle2,
  Award,
  AlertTriangle,
  ChevronRight,
  Flame,
  BarChart3,
  BookOpen,
  ArrowRight,
  History,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface MockExamConfiguratorProps {
  selectedExam: ExamType;
  onExamChange: (exam: ExamType) => void;
  onStartExam: (config: {
    examType: ExamType;
    presetKey: MockPresetKey;
    questionCount: number;
    durationMinutes: number;
  }) => void;
  onViewPastAttempt: (attempt: MockAttempt) => void;
  pastAttempts: MockAttempt[];
}

export const MockExamConfigurator: React.FC<MockExamConfiguratorProps> = ({
  selectedExam,
  onExamChange,
  onStartExam,
  onViewPastAttempt,
  pastAttempts,
}) => {
  const isEcat = selectedExam === 'ECAT';
  const [selectedPreset, setSelectedPreset] = useState<MockPresetKey>('mini_20');
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(20);
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(25);

  const subjectDistribution = mockExamService.getSubjectDistributionForExam(selectedExam);

  // Derive active question count and duration based on preset
  let activeQuestionCount = 20;
  let activeDurationMinutes = isEcat ? 20 : 25;

  if (selectedPreset === 'sprint_10') {
    activeQuestionCount = 10;
    activeDurationMinutes = 12;
  } else if (selectedPreset === 'mini_20') {
    activeQuestionCount = 20;
    activeDurationMinutes = isEcat ? 20 : 25;
  } else if (selectedPreset === 'standard_30') {
    activeQuestionCount = 30;
    activeDurationMinutes = isEcat ? 30 : 35;
  } else {
    activeQuestionCount = customQuestionCount;
    activeDurationMinutes = customDurationMinutes;
  }

  const handlePresetSelect = (preset: MockPresetKey) => {
    setSelectedPreset(preset);
    if (preset === 'sprint_10') {
      setCustomQuestionCount(10);
      setCustomDurationMinutes(12);
    } else if (preset === 'mini_20') {
      setCustomQuestionCount(20);
      setCustomDurationMinutes(isEcat ? 20 : 25);
    } else if (preset === 'standard_30') {
      setCustomQuestionCount(30);
      setCustomDurationMinutes(isEcat ? 30 : 35);
    }
  };

  const handleLaunch = () => {
    onStartExam({
      examType: selectedExam,
      presetKey: selectedPreset,
      questionCount: activeQuestionCount,
      durationMinutes: activeDurationMinutes,
    });
  };

  const filteredPastAttempts = pastAttempts.filter((a) => a.examType === selectedExam);

  return (
    <div id="mock-exam-configurator" className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div
        id="mock-exam-header-card"
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Exam Simulation Arena
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Official Marking Standard
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              High-Stakes Mock Exam Center
            </h1>
            <p className="text-slate-600 text-sm md:text-base max-w-2xl leading-relaxed">
              Experience the exact test pressure, time limits, and negative-marking rules of your target
              entrance examination with our high-yield question pool.
            </p>
          </div>

          {/* Exam Switcher */}
          <div
            id="mock-exam-selector-toggle"
            className="inline-flex p-1.5 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-center"
          >
            <button
              id="mock-exam-select-ecat"
              type="button"
              onClick={() => onExamChange('ECAT')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isEcat
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              UET ECAT
            </button>
            <button
              id="mock-exam-select-mdcat"
              type="button"
              onClick={() => onExamChange('MDCAT')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                !isEcat
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PMDC MDCAT
            </button>
          </div>
        </div>

        {/* Examination Rules Bar */}
        <div
          id="mock-exam-rules-bar"
          className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-4 h-4 ${isEcat ? 'text-amber-600' : 'text-blue-600'}`} />
            <span>
              <strong>Marking: </strong>
              {isEcat ? (
                <span className="text-amber-700 font-semibold">+4 Correct, -1 Incorrect (Negative)</span>
              ) : (
                <span className="text-blue-700 font-semibold">+1 Correct, 0 Wrong (No Penalty)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>
              <strong>Pacing: </strong>
              {isEcat ? '~60 sec per question' : '~63 sec per question'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>Passing Benchmark: </strong>
              {isEcat ? '33% (132/400 marks)' : '55% (110/200 marks)'}
            </span>
          </div>
        </div>
      </div>

      {/* Preset Selection & Configuration */}
      <div id="mock-exam-presets-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Select Mock Exam Format
          </h2>
          <span className="text-xs text-slate-500">Configurable question count & time</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Preset 1: Rapid Sprint */}
          <div
            id="preset-sprint-10"
            onClick={() => handlePresetSelect('sprint_10')}
            className={`cursor-pointer rounded-xl p-5 border transition-all text-left relative ${
              selectedPreset === 'sprint_10'
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Rapid Drill
              </span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Sprint Mock</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Fast-paced calibration drill</p>
            <div className="space-y-1 text-xs text-slate-700 font-medium">
              <div className="flex justify-between">
                <span>Questions:</span>
                <span className="font-semibold text-slate-900">10 MCQs</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold text-slate-900">12 mins</span>
              </div>
            </div>
          </div>

          {/* Preset 2: High-Yield Mini Mock */}
          <div
            id="preset-mini-20"
            onClick={() => handlePresetSelect('mini_20')}
            className={`cursor-pointer rounded-xl p-5 border transition-all text-left relative ${
              selectedPreset === 'mini_20'
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="absolute -top-2.5 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Recommended
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Standard Mini
              </span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Mini Mock</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Balanced subject coverage</p>
            <div className="space-y-1 text-xs text-slate-700 font-medium">
              <div className="flex justify-between">
                <span>Questions:</span>
                <span className="font-semibold text-slate-900">20 MCQs</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold text-slate-900">{isEcat ? '20' : '25'} mins</span>
              </div>
            </div>
          </div>

          {/* Preset 3: Sectional Standard Mock */}
          <div
            id="preset-standard-30"
            onClick={() => handlePresetSelect('standard_30')}
            className={`cursor-pointer rounded-xl p-5 border transition-all text-left relative ${
              selectedPreset === 'standard_30'
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Comprehensive
              </span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Sectional Mock</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">In-depth multi-chapter test</p>
            <div className="space-y-1 text-xs text-slate-700 font-medium">
              <div className="flex justify-between">
                <span>Questions:</span>
                <span className="font-semibold text-slate-900">30 MCQs</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold text-slate-900">{isEcat ? '30' : '35'} mins</span>
              </div>
            </div>
          </div>

          {/* Preset 4: Custom Parameters */}
          <div
            id="preset-custom"
            onClick={() => handlePresetSelect('custom')}
            className={`cursor-pointer rounded-xl p-5 border transition-all text-left relative ${
              selectedPreset === 'custom'
                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Tailored
              </span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Custom Setup</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Set your own count & pacing</p>
            <div className="space-y-1 text-xs text-slate-700 font-medium">
              <div className="flex justify-between">
                <span>Questions:</span>
                <span className="font-semibold text-slate-900">{customQuestionCount} MCQs</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold text-slate-900">{customDurationMinutes} mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Controls (Visible when custom preset is selected) */}
        {selectedPreset === 'custom' && (
          <div
            id="mock-exam-custom-sliders"
            className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/30 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">Question Count:</span>
                <span className="font-bold text-indigo-700">{customQuestionCount} Questions</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={customQuestionCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCustomQuestionCount(val);
                  setCustomDurationMinutes(Math.round(val * (isEcat ? 1.0 : 1.1)));
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>5 MCQs (Short)</span>
                <span>25 MCQs</span>
                <span>50 MCQs (Deep)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">Time Limit:</span>
                <span className="font-bold text-indigo-700">{customDurationMinutes} Minutes</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={customDurationMinutes}
                onChange={(e) => setCustomDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>5 Mins</span>
                <span>30 Mins</span>
                <span>60 Mins</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subject Distribution Preview */}
      <div
        id="mock-exam-distribution-preview"
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Syllabus & Subject Weight Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Generated questions strictly follow official {selectedExam} syllabus weightings
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full self-start">
            Total Allocated: {activeQuestionCount} Questions
          </span>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
          {subjectDistribution.map((subj, idx) => {
            const colors = ['bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-cyan-500'];
            const colorClass = colors[idx % colors.length];
            return (
              <div
                key={subj.subjectId}
                style={{ width: `${subj.weightPercentage}%` }}
                className={`${colorClass} h-full transition-all`}
                title={`${subj.subjectName}: ${subj.weightPercentage}%`}
              />
            );
          })}
        </div>

        {/* Subject Pill List */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {subjectDistribution.map((subj, idx) => {
            const estimatedCount = Math.max(
              1,
              Math.round((subj.weightPercentage / 100) * activeQuestionCount)
            );
            const dotColors = ['bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-cyan-500'];
            return (
              <div
                key={subj.subjectId}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {subj.subjectName}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">{subj.weightPercentage}%</span>
                  <span className="text-sm font-bold text-slate-900">~{estimatedCount} Qs</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Launch CTA Card */}
      <div
        id="mock-exam-launch-card"
        className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md"
      >
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-800/60 text-indigo-200 border border-indigo-700/50">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Ready for Examination
          </div>
          <h3 className="text-xl md:text-2xl font-bold">
            Start {selectedExam} Mock Exam
          </h3>
          <p className="text-indigo-200 text-xs md:text-sm max-w-lg leading-relaxed">
            {activeQuestionCount} Questions • {activeDurationMinutes} Minutes • Timed Session with Auto-Submit.
            Timer begins immediately upon launch.
          </p>
        </div>

        <button
          id="btn-launch-mock-exam"
          type="button"
          onClick={handleLaunch}
          className="cursor-pointer whitespace-nowrap px-8 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base rounded-xl shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2"
        >
          <span>Launch Exam Now</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Past Mock Attempts History */}
      <div id="mock-exam-history-section" className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            Previous Mock Exam Attempts ({filteredPastAttempts.length})
          </h2>
          <span className="text-xs text-slate-500">Review mistakes, analytics & pacing</span>
        </div>

        {filteredPastAttempts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No mock attempts on record yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Complete your first mock exam to unlock comprehensive diagnostic analytics and percentile projections.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPastAttempts.map((attempt) => {
              const dateStr = new Date(attempt.completedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              return (
                <div
                  key={attempt.id}
                  id={`past-attempt-card-${attempt.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {attempt.examType} Mock
                      </span>
                      <span className="text-xs text-slate-500">{dateStr}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">{attempt.examTitle}</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-indigo-700">
                        {attempt.score}/{attempt.maxScore}
                      </span>
                      <span className="text-sm font-semibold text-slate-600">
                        ({attempt.percentage}%)
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          attempt.isPassed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {attempt.isPassed ? 'Passed' : 'Needs Work'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div>
                        <span className="block text-slate-400">Percentile</span>
                        <span className="font-semibold text-slate-800">
                          {attempt.projectedRankPercentile}th
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Accuracy</span>
                        <span className="font-semibold text-slate-800">
                          {Math.round((attempt.correctCount / Math.max(1, attempt.attemptedCount)) * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Duration</span>
                        <span className="font-semibold text-slate-800">
                          {Math.round(attempt.timeSpentSeconds / 60)} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    id={`btn-review-attempt-${attempt.id}`}
                    type="button"
                    onClick={() => onViewPastAttempt(attempt)}
                    className="mt-4 w-full cursor-pointer py-2 px-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Inspect Full Analytics & Mistakes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

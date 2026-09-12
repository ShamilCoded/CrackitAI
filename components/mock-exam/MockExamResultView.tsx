'use client';

import React, { useState } from 'react';
import type {
  MockAttempt,
  MockMistakeItem,
  MockRecommendation,
  ExamType,
} from '@/types';
import {
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  RotateCcw,
  BarChart2,
  Brain,
  HelpCircle,
  Lightbulb,
  Check,
  ChevronDown,
  ChevronUp,
  Flag,
  Target,
  Zap,
} from 'lucide-react';

interface MockExamResultViewProps {
  attempt: MockAttempt;
  onRetake: () => void;
  onBackToHub: () => void;
  onNavigateToTopic?: (topicId: string, subjectId?: string) => void;
  onNavigateToPractice?: (subjectId: string, topicId?: string) => void;
}

type ResultTabKey = 'overview' | 'subjects' | 'topics' | 'pacing' | 'mistakes' | 'recommendations';

export const MockExamResultView: React.FC<MockExamResultViewProps> = ({
  attempt,
  onRetake,
  onBackToHub,
  onNavigateToTopic,
  onNavigateToPractice,
}) => {
  const [activeTab, setActiveTab] = useState<ResultTabKey>('overview');
  const [mistakeFilter, setMistakeFilter] = useState<
    'all' | 'mistakes' | 'marked' | 'correct' | 'unattempted'
  >('all');
  const [expandedMistakeIds, setExpandedMistakeIds] = useState<Set<string>>(
    () => new Set(attempt.mistakes.filter((m) => !m.isCorrect).map((m) => m.questionId))
  );

  const isEcat = attempt.examType === 'ECAT';

  // Toggle mistake question accordion
  const toggleMistakeExpand = (questionId: string) => {
    setExpandedMistakeIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  // Filtered mistakes
  const filteredMistakes = attempt.mistakes.filter((item) => {
    if (mistakeFilter === 'mistakes') return !item.isCorrect && !item.isUnattempted;
    if (mistakeFilter === 'marked') return item.isMarkedForReview;
    if (mistakeFilter === 'correct') return item.isCorrect;
    if (mistakeFilter === 'unattempted') return item.isUnattempted;
    return true;
  });

  const durationMinutes = Math.round(attempt.timeSpentSeconds / 60);
  const accuracyPct =
    attempt.attemptedCount > 0
      ? Math.round((attempt.correctCount / attempt.attemptedCount) * 100)
      : 0;

  return (
    <div id="mock-exam-result-view" className="max-w-6xl mx-auto space-y-8">
      {/* Executive Scorecard Header Banner */}
      <div
        id="mock-result-hero-card"
        className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                {attempt.examType} Mock Assessment
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  attempt.isPassed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {attempt.isPassed ? 'Benchmark Cleared' : 'Needs Reinforcement'}
              </span>
              {attempt.isAutoSubmitted && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Auto-Submitted on Timeout
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {attempt.examTitle}
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Completed on{' '}
              {new Date(attempt.completedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Score Display Card */}
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Score
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl md:text-4xl font-black text-indigo-700">
                  {attempt.score}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  /{attempt.maxScore}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-600">
                {attempt.percentage}% Normalized
              </span>
            </div>

            <div className="h-12 w-px bg-slate-200" />

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Rank Percentile
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-black text-amber-500">
                  {attempt.projectedRankPercentile}
                  <span className="text-lg">th</span>
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-600">Top Entrance Tier</span>
            </div>
          </div>
        </div>

        {/* Core Metric Pills */}
        <div
          id="mock-result-metric-grid"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100"
        >
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs text-slate-400 block mb-0.5">Accuracy</span>
            <span className="text-lg font-bold text-slate-900">{accuracyPct}%</span>
            <span className="text-[11px] text-slate-500 block">
              {attempt.correctCount} of {attempt.attemptedCount} attempted
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs text-slate-400 block mb-0.5">Duration</span>
            <span className="text-lg font-bold text-slate-900">{durationMinutes} mins</span>
            <span className="text-[11px] text-slate-500 block">
              Avg {attempt.timeAnalysis.averageTimePerQuestionSeconds}s / MCQ
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs text-slate-400 block mb-0.5">Attempted</span>
            <span className="text-lg font-bold text-slate-900">
              {attempt.attemptedCount}/{attempt.totalQuestions}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {attempt.unattemptedCount} skipped
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs text-slate-400 block mb-0.5">Pacing Rating</span>
            <span
              className={`text-lg font-bold capitalize ${
                attempt.timeAnalysis.pacingEfficiency === 'optimal'
                  ? 'text-emerald-600'
                  : attempt.timeAnalysis.pacingEfficiency === 'slow'
                  ? 'text-amber-600'
                  : 'text-indigo-600'
              }`}
            >
              {attempt.timeAnalysis.pacingEfficiency}
            </span>
            <span className="text-[11px] text-slate-500 block">Exam speed</span>
          </div>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              id="btn-retake-mock-exam"
              type="button"
              onClick={onRetake}
              className="cursor-pointer px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Take Another Mock</span>
            </button>
            <button
              id="btn-back-to-hub"
              type="button"
              onClick={onBackToHub}
              className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back to Exam Hub
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('mistakes')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Review All {attempt.mistakes.filter((m) => !m.isCorrect).length} Mistakes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Analytics Tabs Navigation */}
      <div
        id="mock-analytics-tab-bar"
        className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px"
      >
        {[
          { key: 'overview', label: 'Summary' },
          { key: 'subjects', label: 'Subject Breakdown' },
          { key: 'topics', label: 'Topic Analysis' },
          { key: 'pacing', label: 'Time & Pacing' },
          { key: 'mistakes', label: `Mistakes Matrix (${attempt.mistakes.length})` },
          { key: 'recommendations', label: `AI Coach Insights (${attempt.recommendations.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            id={`tab-result-${tab.key}`}
            type="button"
            onClick={() => setActiveTab(tab.key as ResultTabKey)}
            className={`cursor-pointer px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview Summary */}
      {activeTab === 'overview' && (
        <div id="tab-content-overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject Snapshot */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                Subject Performance Overview
              </h3>
              <div className="space-y-3">
                {Object.values(attempt.subjectBreakdown).map((subj) => (
                  <div key={subj.subjectId} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{subj.subjectName}</span>
                      <span className="text-slate-600 font-semibold">
                        {subj.score}/{subj.maxScore} marks ({subj.accuracyPercentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${subj.accuracyPercentage}%` }}
                        className={`h-full rounded-full transition-all ${
                          subj.accuracyPercentage >= 75
                            ? 'bg-emerald-500'
                            : subj.accuracyPercentage >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Diagnosis Snapshot */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                Diagnostic Takeaway
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {attempt.percentage >= 70
                  ? `Strong command of high-yield topics for ${attempt.examType}. Focusing on speed optimization and formula recall will push your rank into the top 5th percentile.`
                  : `Solid effort with clear opportunity in core calculation mechanics. Targeted review of weak chapters will directly elevate overall exam score.`}
              </p>
              <div className="space-y-2 pt-2">
                {attempt.recommendations.slice(0, 2).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs flex items-start gap-2.5"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">{rec.title}</span>
                      <span className="text-slate-600 text-[11px]">{rec.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subject Breakdown */}
      {activeTab === 'subjects' && (
        <div id="tab-content-subjects" className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Subject Mastery Breakdown</h3>
                <p className="text-xs text-slate-500">
                  Comprehensive performance across all examined subjects
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Total Questions</th>
                    <th className="p-4">Attempted</th>
                    <th className="p-4">Correct</th>
                    <th className="p-4">Incorrect</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Accuracy</th>
                    <th className="p-4">Avg Time / Q</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(attempt.subjectBreakdown).map((subj) => (
                    <tr key={subj.subjectId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{subj.subjectName}</td>
                      <td className="p-4 text-slate-600">{subj.totalQuestions} MCQs</td>
                      <td className="p-4 text-slate-600">{subj.attemptedCount}</td>
                      <td className="p-4 font-semibold text-emerald-600">{subj.correctCount}</td>
                      <td className="p-4 font-semibold text-rose-600">{subj.incorrectCount}</td>
                      <td className="p-4 font-bold text-indigo-700">
                        {subj.score}/{subj.maxScore}
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            subj.accuracyPercentage >= 70
                              ? 'bg-emerald-50 text-emerald-700'
                              : subj.accuracyPercentage >= 50
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {subj.accuracyPercentage}%
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-mono">
                        {subj.averageTimePerQuestionSeconds}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Topic Analysis */}
      {activeTab === 'topics' && (
        <div id="tab-content-topics" className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Topic-Level Diagnostic Impact</h3>
              <p className="text-xs text-slate-500">
                Detailed breakdown of curriculum concepts tested in this mock exam
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(attempt.topicBreakdown).map((topic) => (
                <div
                  key={topic.topicId}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {topic.subjectName}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        topic.masteryImpact === 'improved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : topic.masteryImpact === 'declined'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {topic.masteryImpact === 'improved'
                        ? 'Mastery + Boost'
                        : topic.masteryImpact === 'declined'
                        ? 'Needs Review'
                        : 'Stable'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{topic.topicName}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {topic.correctCount} of {topic.totalQuestions} Correct
                    </span>
                    <span className="font-semibold text-slate-800">
                      {topic.accuracyPercentage}% Accuracy
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${topic.accuracyPercentage}%` }}
                      className={`h-full rounded-full ${
                        topic.accuracyPercentage >= 70
                          ? 'bg-emerald-500'
                          : topic.accuracyPercentage >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  {/* Direct Link to Learning Unit or Practice */}
                  {onNavigateToTopic && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTopic(topic.topicId, topic.subjectId)}
                      className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-800 pt-1 flex items-center gap-1"
                    >
                      <span>Open Learning Unit</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Time & Pacing Analysis */}
      {activeTab === 'pacing' && (
        <div id="tab-content-pacing" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Time Management & Pacing Telemetry</h3>
              <p className="text-xs text-slate-500">
                Evaluate your speed efficiency across correct, incorrect, and unattempted questions
              </p>
            </div>

            {/* Pacing Banner */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Pacing Strategy: {attempt.timeAnalysis.pacingEfficiency.toUpperCase()}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {attempt.timeAnalysis.pacingNotes}
                </p>
              </div>
            </div>

            {/* Time Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs text-slate-500 block">Avg Time on Correct MCQs</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {attempt.timeAnalysis.averageTimeCorrectSeconds}s
                </span>
                <p className="text-[11px] text-slate-400">Decisive problem resolution</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs text-slate-500 block">Avg Time on Incorrect MCQs</span>
                <span className="text-2xl font-bold text-rose-600">
                  {attempt.timeAnalysis.averageTimeIncorrectSeconds}s
                </span>
                <p className="text-[11px] text-slate-400">Time spent on erroneous paths</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs text-slate-500 block">Total Exam Duration</span>
                <span className="text-2xl font-bold text-slate-900">
                  {Math.round(attempt.timeAnalysis.totalTimeSpentSeconds / 60)}m /{' '}
                  {Math.round(attempt.timeAnalysis.allocatedTimeSeconds / 60)}m
                </span>
                <p className="text-[11px] text-slate-400">
                  {attempt.timeAnalysis.timeRemainingSeconds > 0
                    ? `${Math.round(attempt.timeAnalysis.timeRemainingSeconds / 60)}m left on clock`
                    : 'All time utilized'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Mistakes Matrix */}
      {activeTab === 'mistakes' && (
        <div id="tab-content-mistakes" className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              {[
                { key: 'all', label: `All (${attempt.mistakes.length})` },
                {
                  key: 'mistakes',
                  label: `Incorrect (${attempt.mistakes.filter((m) => !m.isCorrect && !m.isUnattempted).length})`,
                },
                {
                  key: 'marked',
                  label: `Marked (${attempt.mistakes.filter((m) => m.isMarkedForReview).length})`,
                },
                {
                  key: 'correct',
                  label: `Correct (${attempt.mistakes.filter((m) => m.isCorrect).length})`,
                },
                {
                  key: 'unattempted',
                  label: `Skipped (${attempt.mistakes.filter((m) => m.isUnattempted).length})`,
                },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setMistakeFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mistakeFilter === f.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500">
              Showing {filteredMistakes.length} Questions
            </span>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {filteredMistakes.map((item, idx) => {
              const isExpanded = expandedMistakeIds.has(item.questionId);
              const q = item.question;
              const selectedOpt = q.options.find((o) => o.id === item.selectedOptionId);
              const correctOpt = q.options.find((o) => o.id === item.correctOptionId);

              return (
                <div
                  key={item.questionId}
                  id={`review-question-card-${item.questionId}`}
                  className={`rounded-2xl border transition-all bg-white p-5 md:p-6 space-y-4 ${
                    item.isCorrect
                      ? 'border-emerald-200/80 shadow-xs'
                      : item.isUnattempted
                      ? 'border-slate-200'
                      : 'border-rose-200/90 shadow-xs'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => toggleMistakeExpand(item.questionId)}
                    className="cursor-pointer flex items-start justify-between gap-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {item.subjectName}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{item.topicName}</span>

                      {/* Status Badges */}
                      {item.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Correct (+{isEcat ? '4' : '1'})
                        </span>
                      ) : item.isUnattempted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          Skipped (0)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3" /> Wrong ({isEcat ? '-1 Penalty' : '0'})
                        </span>
                      )}

                      {item.isMarkedForReview && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          <Flag className="w-3 h-3 fill-purple-600" /> Marked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{item.timeSpentSeconds}s</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-medium text-slate-900 leading-relaxed">
                    {q.content || q.questionText}
                  </p>

                  {/* Expandable Solutions & Option Analysis */}
                  {isExpanded && (
                    <div className="space-y-4 pt-3 border-t border-slate-100">
                      {/* Option List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt) => {
                          const isStudentChoice = opt.id === item.selectedOptionId;
                          const isCorrectOption = opt.id === item.correctOptionId;

                          let badgeColor = 'border-slate-200 bg-slate-50 text-slate-700';
                          if (isCorrectOption) {
                            badgeColor = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold';
                          } else if (isStudentChoice && !isCorrectOption) {
                            badgeColor = 'border-rose-300 bg-rose-50 text-rose-900';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${badgeColor}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{opt.optionKey}.</span>
                                <span>{opt.text || opt.optionText}</span>
                              </div>
                              <div className="shrink-0">
                                {isCorrectOption && (
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                                    Correct
                                  </span>
                                )}
                                {isStudentChoice && !isCorrectOption && (
                                  <span className="text-[10px] font-bold text-rose-700 uppercase">
                                    Your Pick
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Comprehensive Explanation */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Official Step-by-Step Explanation</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {item.explanation}
                        </p>
                      </div>

                      {/* High Yield Tip/Shortcut */}
                      {item.tipOrShortcut && (
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Exam Speed Shortcut:</span>
                            <span>{item.tipOrShortcut}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 6: AI Coach Recommendations */}
      {activeTab === 'recommendations' && (
        <div id="tab-content-recommendations" className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Personalized AI Improvement Directives
              </h3>
              <p className="text-xs text-slate-500">
                Tailored high-impact study steps synthesized directly from your mock exam errors
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {attempt.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-purple-100 text-purple-700">
                        {rec.subjectName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          rec.severity === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {rec.severity} priority
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{rec.title}</h4>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  {rec.actionType === 'learning_unit' && onNavigateToTopic && rec.topicId ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToTopic(rec.topicId!, rec.subjectId)}
                      className="cursor-pointer shrink-0 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-center"
                    >
                      <span>{rec.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : rec.actionType === 'practice_drill' && onNavigateToPractice ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToPractice(rec.subjectId, rec.topicId)}
                      className="cursor-pointer shrink-0 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-center"
                    >
                      <span>{rec.actionLabel}</span>
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

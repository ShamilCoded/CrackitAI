'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Target,
  ShieldCheck,
  Zap,
  BookOpen,
  Info,
  ChevronRight,
  Layers,
} from 'lucide-react';
import type {
  DiagnosticAttempt,
  TopicPerformance,
  TopicClassification,
  DifficultyLevel,
} from '@/types';

interface DiagnosticResultsViewProps {
  attempt: DiagnosticAttempt;
  onRetake: () => void;
  onSelectTopic?: (topicId: string) => void;
}

export function DiagnosticResultsView({
  attempt,
  onRetake,
  onSelectTopic,
}: DiagnosticResultsViewProps) {
  const router = useRouter();
  const [topicFilter, setTopicFilter] = useState<'all' | TopicClassification>('all');

  const isEcat = attempt.examType === 'ECAT';

  // Format time
  const totalMins = Math.floor(attempt.timePerformance.totalTimeSpentSeconds / 60);
  const totalSecs = attempt.timePerformance.totalTimeSpentSeconds % 60;

  // Filter topics
  const allTopicsList = Object.values(attempt.topicBreakdown);
  const filteredTopics =
    topicFilter === 'all'
      ? allTopicsList
      : allTopicsList.filter((t) => t.classification === topicFilter);

  const handleOpenTopicLearningUnit = (topicId: string) => {
    if (onSelectTopic) {
      onSelectTopic(topicId);
    } else {
      router.push(`/student/learn/${topicId}`);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-4 px-2" id="diagnostic-results-view">
      {/* Top Header & Retake */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Diagnostic Complete
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {attempt.examType} Baseline Knowledge Assessment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Diagnostic Performance & Gap Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student: <strong>{attempt.studentName || 'Student'}</strong> &bull; Completed:{' '}
            {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <button
          type="button"
          id="btn-retake-diagnostic"
          onClick={onRetake}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors self-start sm:self-auto shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Retake Diagnostic</span>
        </button>
      </div>

      {/* Hero Performance Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Scaled Score */}
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Scaled Score
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {attempt.totalScore}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ {attempt.maxScore}</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1">
              {isEcat ? 'ECAT (+4 / -1 rules)' : 'MDCAT standard'}
            </span>
          </div>

          {/* Overall Accuracy */}
          <div className="flex flex-col sm:pl-4 pt-3 sm:pt-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Overall Accuracy
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black tracking-tight text-emerald-600">
                {attempt.overallAccuracy}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1">
              {attempt.answers.filter((a) => a.isCorrect).length || Math.round((attempt.overallAccuracy * attempt.attemptedQuestions) / 100)} of{' '}
              {attempt.attemptedQuestions} correct
            </span>
          </div>

          {/* Questions Attempted */}
          <div className="flex flex-col sm:pl-4 pt-3 sm:pt-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Question Count
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {attempt.attemptedQuestions}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ {attempt.totalQuestions}</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1">
              {attempt.totalQuestions - attempt.attemptedQuestions === 0
                ? '100% Attempt Rate'
                : `${attempt.totalQuestions - attempt.attemptedQuestions} unattempted`}
            </span>
          </div>

          {/* Time Pacing */}
          <div className="flex flex-col sm:pl-4 pt-3 sm:pt-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Time Performance
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {totalMins}m {totalSecs}s
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1">
              Avg {attempt.timePerformance.averageTimePerQuestionSeconds}s / MCQ ({attempt.timePerformance.pacingStanding})
            </span>
          </div>
        </div>

        {/* Percentile Banner */}
        {attempt.percentileEstimate && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 text-xs text-indigo-900 font-medium">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>
                Estimated Standing: <strong>{attempt.percentileEstimate}th Percentile</strong> among all registered {attempt.examType} applicants.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-indigo-600 font-semibold uppercase">
              Predictive Model
            </span>
          </div>
        )}
      </div>

      {/* RECOMMENDED NEXT STEP HERO CARD */}
      {attempt.recommendedNextStep && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden" id="card-recommended-next-step">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Target className="w-48 h-48 text-white" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                Recommended Next Step
              </span>
              <span className="text-xs text-indigo-200 font-medium">
                Highest Yield Remediation Priority
              </span>
            </div>

            <div className="space-y-1 max-w-2xl">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                {attempt.recommendedNextStep.subjectName} &bull; {attempt.recommendedNextStep.chapterName || 'Core Syllabus'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {attempt.recommendedNextStep.topicName}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed pt-1">
                {attempt.recommendedNextStep.reason}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Est. Mastery: {attempt.recommendedNextStep.estimatedMinutesToMastery} Mins</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Baseline Accuracy: {attempt.recommendedNextStep.currentAccuracy}%</span>
              </div>
            </div>

            <div className="pt-3">
              <Link
                href={attempt.recommendedNextStep.learningUnitUrl}
                id="btn-launch-recommended-unit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>Launch Learning Unit: {attempt.recommendedNextStep.topicName}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AI Diagnostic Synthesis */}
      {attempt.aiDiagnosticSummary && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3" id="ai-diagnostic-summary-card">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              AI Diagnostic Tutor Insights
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Gemini 2.5 Flash
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            {attempt.aiDiagnosticSummary}
          </p>
        </div>
      )}

      {/* TOPIC CLASSIFICATION & MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6" id="topic-classification-matrix">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Topic-Level Performance & Classification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict classification based on pedagogical accuracy thresholds.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              type="button"
              id="filter-topic-all"
              onClick={() => setTopicFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                topicFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allTopicsList.length})
            </button>
            <button
              type="button"
              id="filter-topic-weak"
              onClick={() => setTopicFilter('weak')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                topicFilter === 'weak'
                  ? 'bg-white text-rose-700 shadow-sm font-semibold'
                  : 'text-rose-600 hover:text-rose-900'
              }`}
            >
              Weak ({attempt.weakTopics.length})
            </button>
            <button
              type="button"
              id="filter-topic-developing"
              onClick={() => setTopicFilter('developing')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                topicFilter === 'developing'
                  ? 'bg-white text-amber-700 shadow-sm font-semibold'
                  : 'text-amber-600 hover:text-amber-900'
              }`}
            >
              Developing ({attempt.developingTopics.length})
            </button>
            <button
              type="button"
              id="filter-topic-strong"
              onClick={() => setTopicFilter('strong')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                topicFilter === 'strong'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                  : 'text-emerald-600 hover:text-emerald-900'
              }`}
            >
              Strong ({attempt.strongTopics.length})
            </button>
          </div>
        </div>

        {/* Classification Rule Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-700"><strong>Strong:</strong> ≥ 75% accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-700"><strong>Developing:</strong> 50%–74% accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-700"><strong>Weak:</strong> &lt; 50% accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
            <span className="text-slate-700"><strong>Unknown:</strong> 0 questions</span>
          </div>
        </div>

        {/* Topics List Grid */}
        <div className="space-y-3">
          {filteredTopics.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No topics in this category.
            </p>
          ) : (
            filteredTopics.map((topic) => {
              const badgeStyles = {
                strong: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                developing: 'bg-amber-50 text-amber-800 border-amber-200',
                weak: 'bg-rose-50 text-rose-800 border-rose-200',
                unknown: 'bg-slate-50 text-slate-700 border-slate-200',
              }[topic.classification];

              return (
                <div
                  key={topic.topicId}
                  id={`topic-row-${topic.topicId}`}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeStyles}`}>
                          {topic.classification}
                        </span>
                        {topic.severity !== 'none' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            topic.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {topic.severity} gap
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-500">
                          {topic.subjectName}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {topic.topicName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {topic.chapterName || 'General Topic'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900 block">
                          {topic.accuracy}%
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {topic.correct} / {topic.attempted} correct
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenTopicLearningUnit(topic.topicId)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                      >
                        <span>Study Unit</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Accuracy Bar & Telemetry Details */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          topic.classification === 'strong'
                            ? 'bg-emerald-500'
                            : topic.classification === 'developing'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${topic.accuracy}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>Avg Response Time: {topic.averageTimeSeconds}s / question</span>
                      <span>
                        Confidence ratings: High ({topic.confidenceDistribution.high}), Med ({topic.confidenceDistribution.medium}), Low ({topic.confidenceDistribution.low})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SUBJECT BREAKDOWN & DIFFICULTY BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Breakdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Subject Accuracy & Scores
            </h3>
          </div>

          <div className="space-y-3 pt-1">
            {Object.values(attempt.subjectBreakdown).map((subj) => (
              <div key={subj.subjectId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{subj.subjectName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {subj.score} / {subj.maxScore} marks
                    </span>
                    <span className="text-xs font-black text-indigo-600">({subj.accuracy}%)</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${subj.accuracy}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{subj.correctCount} of {subj.attemptedQuestions} correct</span>
                  <span>{subj.topics.length} syllabus topics evaluated</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Breakdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Difficulty Tier Performance
            </h3>
          </div>

          <div className="space-y-3 pt-1">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => {
              const data = attempt.difficultyBreakdown[level];
              if (!data || data.total === 0) return null;

              const label = {
                easy: 'Easy (Foundational Recall)',
                medium: 'Medium (Application & Numericals)',
                hard: 'Hard (Complex Multi-Step)',
                exam_level: 'Exam Level (Past Paper Trap Questions)',
              }[level];

              return (
                <div key={level} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{label}</span>
                    <span className="font-bold text-purple-700">{data.accuracy}%</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${data.accuracy}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{data.correct} of {data.attempted} correct</span>
                    <span>{data.total} total questions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONFIDENCE & PACING TELEMETRY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metacognitive Calibration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Confidence Calibration
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200">
              {attempt.confidenceBreakdown.calibrationStatus.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-[11px] text-emerald-800 block font-medium">High Certainty</span>
              <span className="text-base font-bold text-emerald-700 mt-0.5 block">
                {attempt.confidenceBreakdown.highConfidenceAccuracy}%
              </span>
              <span className="text-[10px] text-emerald-600">
                {attempt.confidenceBreakdown.highConfidenceCount} questions
              </span>
            </div>

            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-[11px] text-amber-800 block font-medium">Medium</span>
              <span className="text-base font-bold text-amber-700 mt-0.5 block">
                {attempt.confidenceBreakdown.mediumConfidenceAccuracy}%
              </span>
              <span className="text-[10px] text-amber-600">
                {attempt.confidenceBreakdown.mediumConfidenceCount} questions
              </span>
            </div>

            <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100">
              <span className="text-[11px] text-rose-800 block font-medium">Low (Guess)</span>
              <span className="text-base font-bold text-rose-700 mt-0.5 block">
                {attempt.confidenceBreakdown.lowConfidenceAccuracy}%
              </span>
              <span className="text-[10px] text-rose-600">
                {attempt.confidenceBreakdown.lowConfidenceCount} questions
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed">
            {attempt.confidenceBreakdown.insightText}
          </p>
        </div>

        {/* Time Performance & Speed Pacing */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Exam Pacing Analytics
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              {attempt.timePerformance.pacingStanding} Pacing
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Average Per Question</span>
              <span className="text-base font-bold text-slate-800 mt-0.5 block">
                {attempt.timePerformance.averageTimePerQuestionSeconds} seconds
              </span>
              <span className="text-[10px] text-slate-400">
                Benchmark: {attempt.timePerformance.recommendedPacingSeconds}s
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Fastest / Slowest</span>
              <span className="text-base font-bold text-slate-800 mt-0.5 block">
                {attempt.timePerformance.fastestQuestionSeconds}s / {attempt.timePerformance.slowestQuestionSeconds}s
              </span>
              <span className="text-[10px] text-slate-400">Speed variation</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed">
            {attempt.timePerformance.pacingStanding === 'optimal'
              ? 'Your average speed is well-aligned with official exam pacing, allowing adequate time to verify numerical calculations.'
              : attempt.timePerformance.pacingStanding === 'rushed'
              ? 'You answered very quickly. Consider allocating more time to double-check tricky sign conventions and complex units.'
              : 'You spent above-average time on several questions. Focus on mental math shortcuts and formula memorization.'}
          </p>
        </div>
      </div>
    </div>
  );
}

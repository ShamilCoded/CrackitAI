'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { parentService, type ParentStudentSummary } from '@/services/parent/parent.service';
import type { ExamType } from '@/types';
import { useExam } from '@/lib/context/exam-context';
import {
  ShieldCheck,
  Award,
  TrendingUp,
  Target,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  User,
  Heart,
  Lock,
  Printer,
  RefreshCw,
  Layers,
  ArrowUpRight,
  Flame,
  BarChart3,
  HelpCircle,
  Check,
} from 'lucide-react';

interface ParentDashboardViewProps {
  initialExam?: ExamType;
}

export function ParentDashboardView({ initialExam = 'ECAT' }: ParentDashboardViewProps) {
  const { selectedExam, setSelectedExam } = useExam();
  const [data, setData] = useState<ParentStudentSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'strengths_weaknesses' | 'history'>('overview');

  useEffect(() => {
    let isMounted = true;
    parentService
      .getStudentSummaryForParent(undefined, selectedExam)
      .then((summary) => {
        if (isMounted) {
          setData(summary);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load parent student summary:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedExam]);

  const handleExamChange = (exam: ExamType) => {
    setSelectedExam(exam);
    setIsLoading(true);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    parentService
      .getStudentSummaryForParent(undefined, selectedExam)
      .then((summary) => {
        setData(summary);
      })
      .catch((err) => {
        console.error('Failed to refresh student records:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (isLoading && !data) {
    return (
      <div className="py-16 sm:py-24 flex flex-col items-center justify-center space-y-4 p-4 sm:p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-pulse shadow-sm">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Loading Student Progress Overview...
          </h3>
          <p className="text-xs text-stone-700 dark:text-stone-300">
            Compiling syllabus mastery, assessment history, and study consistency.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 my-6">
        <AlertCircle className="w-10 h-10 text-amber-700 dark:text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Unable to load student profile</h3>
        <p className="text-sm text-stone-700 dark:text-stone-300 mt-1 mb-4">
          We could not retrieve progress data for this student.
        </p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 print:p-0 print:space-y-4">
      {/* 1. TOP HEADER & STUDENT PROFILE BAR */}
      <div
        id="parent-header-card"
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Student Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0">
              {data.studentName.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  {data.studentName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Enrolled Candidate
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-700 dark:text-stone-300">
                <span className="flex items-center gap-1 font-medium text-stone-900 dark:text-stone-200">
                  <Target className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
                  Target: {data.targetExam} Entrance Exam ({data.examYear})
                </span>
                <span className="hidden sm:inline text-stone-300 dark:text-stone-700">•</span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  {data.streakDays} Day Study Streak
                </span>
              </div>
            </div>
          </div>

          {/* Right: Controls (Exam Switcher, Refresh, Print) */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleExamChange('ECAT')}
                id="parent-select-ecat-btn"
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedExam === 'ECAT'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                ECAT View
              </button>
              <button
                type="button"
                onClick={() => handleExamChange('MDCAT')}
                id="parent-select-mdcat-btn"
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedExam === 'MDCAT'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                MDCAT View
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isPending}
              id="parent-refresh-data-btn"
              title="Refresh student records"
              className="p-2 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handlePrint}
              id="parent-print-report-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl border border-stone-200 dark:border-stone-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Read-Only Notice Banner */}
        <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-700 dark:text-stone-300">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>Read-focused Parent Portal • Student data is verified against official curriculum standards</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
            <Lock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Private tutor dialogues remain confidential</span>
          </div>
        </div>
      </div>

      {/* 2. OVERALL MASTERY & KEY METRICS HERO */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Overall Mastery Gauge Card */}
        <div
          id="parent-overall-mastery-card"
          className="md:col-span-7 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Syllabus Mastery Score
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  data.overallMasteryPercentage >= 75
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : data.overallMasteryPercentage >= 55
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {data.masteryStatusLabel}
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {data.overallMasteryPercentage}%
              </span>
              <span className="text-xs text-stone-700 dark:text-stone-300">
                across {data.assessedTopicsCount} tested syllabus topics
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed pt-1">
              {data.masteryStatusDescription}
            </p>
          </div>

          {/* Progress Bar & Breakdown */}
          <div className="pt-6 space-y-3">
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(data.masteredTopicsCount / data.totalTopicsCount) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`Mastered: ${data.masteredTopicsCount} topics`}
              />
              <div
                style={{ width: `${(data.strongTopicsCount / data.totalTopicsCount) * 100}%` }}
                className="bg-sky-500 h-full"
                title={`Solid Competence: ${data.strongTopicsCount} topics`}
              />
              <div
                style={{ width: `${(data.developingTopicsCount / data.totalTopicsCount) * 100}%` }}
                className="bg-amber-400 h-full"
                title={`Developing: ${data.developingTopicsCount} topics`}
              />
              <div
                style={{ width: `${(data.weakTopicsCount / data.totalTopicsCount) * 100}%` }}
                className="bg-rose-400 h-full"
                title={`Needs Review: ${data.weakTopicsCount} topics`}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-stone-700 dark:text-stone-300 font-medium">Mastered ({data.masteredTopicsCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <span className="text-stone-700 dark:text-stone-300 font-medium">Solid ({data.strongTopicsCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-stone-700 dark:text-stone-300 font-medium">Developing ({data.developingTopicsCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                <span className="text-stone-700 dark:text-stone-300 font-medium">Needs Attention ({data.weakTopicsCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Study Consistency & Habit Card */}
        <div
          id="parent-consistency-card"
          className="md:col-span-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Study Consistency
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Flame className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                {data.studyConsistency.consistencyRating} Habit
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3 border border-stone-100 dark:border-stone-800">
                <div className="text-xs text-stone-700 dark:text-stone-300">Active Streak</div>
                <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {data.streakDays} Days
                </div>
              </div>
              <div className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3 border border-stone-100 dark:border-stone-800">
                <div className="text-xs text-stone-700 dark:text-stone-300">Study Days (Month)</div>
                <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {data.studyConsistency.activeDaysThisMonth} Days
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed mt-3">
              {data.studyConsistency.consistencyAdvice}
            </p>
          </div>

          {/* 7-Day Activity Mini Visualizer */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80">
            <div className="text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-2">
              Past 7 Days Activity Rhythm
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {data.studyConsistency.weeklyActivityMap.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-full h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                      d.active
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                    title={`${d.day}: ${d.minutesStudied} minutes, ${d.activitiesCompleted} tasks`}
                  >
                    {d.active ? <Check className="w-3 h-3" /> : '—'}
                  </div>
                  <span className="text-[10px] text-stone-700 dark:text-stone-300 font-medium">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUBJECT MASTERY CARDS */}
      <div id="parent-subject-mastery-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              Subject-Wise Mastery Breakdown
            </h2>
            <p className="text-xs text-stone-700 dark:text-stone-300">
              Clear performance across every mandatory subject in the {data.targetExam} syllabus.
            </p>
          </div>
          <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
            {data.subjectMasteries.length} Subjects Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.subjectMasteries.map((subject) => (
            <div
              key={subject.subjectId}
              id={`parent-subject-card-${subject.subjectCode}`}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    {subject.subjectName}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 shrink-0">
                    {subject.statusLabel}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                    {subject.masteryPercentage}%
                  </span>
                  <span className="text-xs text-stone-700 dark:text-stone-300">
                    {subject.masteredCount} of {subject.totalCount} topics mastered
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${subject.masteryPercentage}%` }}
                    className={`h-full ${subject.colorScheme.bar}`}
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
                <span>Practice Accuracy:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{subject.accuracyPercentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. STRONGEST VS WEAKEST AREAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strongest Areas */}
        <div
          id="parent-strongest-areas-card"
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Strongest Areas (High Confidence)
              </h2>
              <p className="text-xs text-stone-700 dark:text-stone-300">
                Topics where your student consistently achieves top marks under exam conditions.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {data.strongestAreas.map((topic, idx) => (
              <div
                key={topic.topicId || idx}
                className="bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 rounded-xl p-3.5 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      {topic.subjectName}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {topic.topicName}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {topic.masteryPercentage}%
                    </span>
                    <div className="text-[10px] text-stone-700 dark:text-stone-300">{topic.accuracyPercentage}% accuracy</div>
                  </div>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{topic.parentNote}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weakest Areas & Encouragement */}
        <div
          id="parent-weakest-areas-card"
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Focus Areas (Needs Reinforcement)
              </h2>
              <p className="text-xs text-stone-700 dark:text-stone-300">
                Constructive priorities where targeted practice will yield the fastest score jump.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {data.weakestAreas.map((topic, idx) => (
              <div
                key={topic.topicId || idx}
                className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-3.5 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      {topic.subjectName}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {topic.topicName}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {topic.masteryPercentage}%
                    </span>
                    <div className="text-[10px] text-stone-700 dark:text-stone-300">{topic.accuracyPercentage}% accuracy</div>
                  </div>
                </div>
                <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1 pt-1">
                  <p className="text-stone-800 dark:text-stone-200 font-medium">Why it matters: {topic.whyItMatters}</p>
                  <p className="text-stone-700 dark:text-stone-300 italic">How to help: {topic.recommendedParentSupport}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. RECENT IMPROVEMENT & PROGRESS TIMELINE */}
      <div
        id="parent-recent-improvement-card"
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Recent Improvement & Score Trajectory
            </h2>
            <p className="text-xs text-stone-700 dark:text-stone-300">
              Measurable progress across successive diagnostic assessments and timed mock exams.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
            {data.recentImprovement.improvementHeadline}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          {data.recentImprovement.summaryDescription}
        </p>

        {/* Visual score progression milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {data.recentImprovement.scoreTimeline.map((item, index) => (
            <div
              key={index}
              className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-4 border border-stone-100 dark:border-stone-800 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
                  <span>{item.date}</span>
                  <span className="font-semibold text-indigo-700 dark:text-indigo-400">{item.label}</span>
                </div>
                <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">
                  {item.activityName}
                </div>
              </div>
              <div className="pt-3 flex items-baseline justify-between border-t border-stone-200/50 dark:border-stone-700/50 mt-3">
                <span className="text-xs text-stone-700 dark:text-stone-300">Test Accuracy</span>
                <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  {item.scorePercentage}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Topics that recently advanced */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
          <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
            Topics With Strongest Recent Level-Ups
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.recentImprovement.improvedTopics.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs"
              >
                <div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                    {item.subjectName}
                  </span>
                  <div className="font-semibold text-stone-900 dark:text-stone-100">{item.topicName}</div>
                </div>
                <div className="text-right font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <span>+{item.deltaScore}%</span>
                  <span className="text-stone-700 dark:text-stone-300 text-[10px] font-normal">
                    ({item.previousScore}% → {item.currentScore}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. UPCOMING PRIORITIES (WHAT'S NEXT) */}
      <div
        id="parent-upcoming-priorities-card"
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              Upcoming Study Priorities
            </h2>
            <p className="text-xs text-stone-700 dark:text-stone-300">
              The automated study plan has prioritized these tasks to maximize score growth this week.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Current Week Focus
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {data.upcomingPriorities.map((item) => (
            <div
              key={item.id}
              className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-4 border border-stone-200 dark:border-stone-700 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 font-semibold text-stone-700 dark:text-stone-300">
                    Priority #{item.priorityOrder}
                  </span>
                  <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300 font-medium">
                    <Clock className="w-3 h-3" />
                    {item.estimatedMinutes}m
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase">
                    {item.subjectName}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {item.parentExplanation}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
                <span>Recommended format:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{item.actionLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. COMPLETED STUDY ACTIVITIES (CONCRETE LOG) */}
      <div
        id="parent-completed-activities-card"
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Completed Study Activities Log
            </h2>
            <p className="text-xs text-stone-700 dark:text-stone-300">
              Verified record of completed mock exams, diagnostic tests, and interactive practice drills.
            </p>
          </div>
          <span className="text-xs text-stone-700 dark:text-stone-300">
            {data.completedActivities.length} Milestones Recorded
          </span>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {data.completedActivities.map((act) => (
            <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 uppercase">
                    {act.typeLabel}
                  </span>
                  <span className="text-stone-700 dark:text-stone-300 font-medium">{act.formattedDate}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {act.title}
                </h3>
                <div className="text-[11px] text-stone-700 dark:text-stone-300">{act.subjectName}</div>
              </div>

              <div className="flex items-center gap-3 sm:self-center">
                {act.scoreOrResult && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
                    {act.scoreOrResult}
                  </span>
                )}
                <span className="text-stone-700 dark:text-stone-300 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {act.timeSpentMinutes} min
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                    act.statusBadge === 'passed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400'
                  }`}
                >
                  {act.statusBadge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. STUDENT PRIVACY & SAFETY ASSURANCE FOOTER */}
      <div
        id="parent-privacy-notice-footer"
        className="rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-stone-700 dark:text-stone-300"
      >
        <div className="w-10 h-10 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-rose-500" />
        </div>
        <div className="space-y-0.5">
          <div className="font-semibold text-stone-800 dark:text-stone-200">
            Student Confidentiality & Learning Trust Safeguard
          </div>
          <p className="leading-relaxed">
            Direct student AI tutor conversations, scratchpad notes, and exploratory question drafts are kept
            confidential to encourage uninhibited inquiry and independent problem-solving. This Parent Dashboard
            focuses strictly on syllabus mastery, test accuracy, and study consistency.
          </p>
        </div>
      </div>
    </div>
  );
}

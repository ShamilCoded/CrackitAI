'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type {
  ExamType,
  PersonalizedStudyPlanResult,
  StudyPlanItemDetailed,
  WhyExplanation,
  AdaptivePracticeSetResult,
} from '@/types';
import { personalizationService } from '@/services/study-plan/personalization.service';
import { WhyExplanationModal } from './WhyExplanationModal';
import {
  Sparkles,
  Target,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Zap,
  Flame,
  Award,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface StudyPlanContainerProps {
  studentId: string;
  examType: ExamType;
  onNavigateToPractice?: (topicId: string) => void;
  onNavigateToLearn?: (topicId: string) => void;
  onLaunchAdaptivePractice?: (practiceSet: AdaptivePracticeSetResult) => void;
}

export function StudyPlanContainer({
  studentId,
  examType,
  onNavigateToPractice,
  onNavigateToLearn,
  onLaunchAdaptivePractice,
}: StudyPlanContainerProps) {
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [planResult, setPlanResult] = useState<PersonalizedStudyPlanResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedWhyExplanation, setSelectedWhyExplanation] = useState<WhyExplanation | null>(null);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState<boolean>(false);
  const [generatingPractice, setGeneratingPractice] = useState<boolean>(false);

  // Load initial plan
  useEffect(() => {
    let isCancelled = false;

    async function fetchPlan() {
      try {
        let res = await personalizationService.getActiveStudyPlan(studentId, examType);
        if (!res) {
          res = await personalizationService.generateStudyPlan(studentId, {
            examType,
            dailyAvailableMinutes: dailyMinutes,
          });
        }
        if (!isCancelled) {
          setPlanResult(res);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load study plan:', err);
          setLoading(false);
        }
      }
    }

    fetchPlan();

    return () => {
      isCancelled = true;
    };
  }, [studentId, examType, dailyMinutes]);

  const handleTimeChange = async (minutes: number) => {
    setDailyMinutes(minutes);
    setRefreshing(true);
    try {
      const res = await personalizationService.generateStudyPlan(studentId, {
        examType,
        dailyAvailableMinutes: minutes,
      });
      setPlanResult(res);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshPlan = async () => {
    setRefreshing(true);
    try {
      const res = await personalizationService.generateStudyPlan(studentId, {
        examType,
        dailyAvailableMinutes: dailyMinutes,
      });
      setPlanResult(res);
    } finally {
      setRefreshing(false);
    }
  };

  const handleItemStatusToggle = async (itemId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'in_progress'
        ? 'completed'
        : currentStatus === 'pending'
        ? 'in_progress'
        : 'in_progress';

    await personalizationService.updatePlanItemStatus(itemId, nextStatus);
    const updatedPlan = await personalizationService.getActiveStudyPlan(studentId, examType);
    if (updatedPlan) {
      setPlanResult(updatedPlan);
    }
  };

  const handleOpenWhy = async (item: StudyPlanItemDetailed) => {
    if (item.whyExplanation) {
      setSelectedWhyExplanation(item.whyExplanation);
      setIsWhyModalOpen(true);
    } else {
      const explanation = await personalizationService.getWhyExplanation(
        studentId,
        item.topicId,
        examType
      );
      setSelectedWhyExplanation(explanation);
      setIsWhyModalOpen(true);
    }
  };

  const handleStartAdaptivePractice = async () => {
    setGeneratingPractice(true);
    try {
      const practiceSet = await personalizationService.getAdaptivePracticeSet(studentId, {
        examType,
        targetQuestionCount: 6,
      });
      if (onLaunchAdaptivePractice) {
        onLaunchAdaptivePractice(practiceSet);
      }
    } finally {
      setGeneratingPractice(false);
    }
  };

  if (loading && !planResult) {
    return (
      <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
        <p className="text-xs text-stone-600 font-medium">Synthesizing personalized study plan...</p>
      </div>
    );
  }

  const plan = planResult?.plan;
  const items = planResult?.items || [];
  const nextActivity = planResult?.nextBestActivity;
  const completedItems = items.filter((it) => it.status === 'completed').length;
  const progressPercent = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER: NEXT BEST ACTIVITY (1-CLICK RECOMMENDED TASK) */}
      {nextActivity && (
        <div className="bg-gradient-to-r from-emerald-900 to-stone-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-36 h-36 text-emerald-400" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  Next Best Activity
                </span>
                <span className="text-xs text-stone-300">
                  {nextActivity.subjectName} • {nextActivity.estimatedMinutes} mins
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {nextActivity.title}
              </h3>
              <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                {nextActivity.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedWhyExplanation(nextActivity.whyExplanation);
                  setIsWhyModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white text-xs font-semibold border border-white/10 transition flex items-center gap-1.5 shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Why this?</span>
              </button>

              <Link
                href={nextActivity.actionUrl}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-98"
              >
                <span>Start Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN STUDY PLAN CONTROLS & TIME BUDGET SELECTOR */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {examType} Adaptive Sprint
              </span>
              <span className="text-xs text-stone-500">
                Target Date: <strong className="text-stone-800">{plan?.goalExamDate || 'July 2026'}</strong>
              </span>
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-1">
              {plan?.title || 'Personalized Daily Study Plan'}
            </h3>
          </div>

          {/* Daily Time Budget Selector */}
          <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200/80">
            <span className="text-[11px] font-semibold text-stone-600 pl-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>Budget:</span>
            </span>
            {[30, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleTimeChange(mins)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  dailyMinutes === mins
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* AI Personalized Coach Note */}
        {planResult?.coachingAdvice && (
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs text-stone-700">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-950">AI Coach Sprint Strategy:</span>
              <p className="text-stone-700 leading-relaxed">{planResult.coachingAdvice}</p>
            </div>
          </div>
        )}

        {/* Plan Progress Bar */}
        <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">Today&apos;s Sprint:</span>
            <span>
              {completedItems} of {items.length} tasks completed ({progressPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshPlan}
              disabled={refreshing}
              className="text-stone-500 hover:text-stone-800 text-xs font-medium flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Plan</span>
            </button>
          </div>
        </div>

        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 3. STUDY PLAN ITEM LIST (SCHEDULED TASKS) */}
        <div className="space-y-3 pt-2">
          {items.map((item) => {
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';

            const activityLabel =
              item.recommendedActivity === 'learning_unit'
                ? 'Learning Unit'
                : item.recommendedActivity === 'spaced_repetition'
                ? 'Retention Review'
                : item.recommendedActivity === 'mastery_test'
                ? 'Mastery Test'
                : 'Practice Drill';

            const activityColor =
              item.recommendedActivity === 'learning_unit'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : item.recommendedActivity === 'spaced_repetition'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-stone-50/60 border-stone-200 opacity-80'
                    : isInProgress
                    ? 'bg-white border-emerald-300 ring-1 ring-emerald-200 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                } flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                {/* Left info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isInProgress
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {isCompleted ? '✓' : item.priorityOrder}
                    </span>

                    <h4
                      className={`font-bold text-sm ${
                        isCompleted ? 'line-through text-stone-500' : 'text-stone-900'
                      }`}
                    >
                      {item.topicName || item.topicId.replace('topic-', '').replace(/-/g, ' ')}
                    </h4>

                    {/* Activity Type Badge */}
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${activityColor}`}
                    >
                      {activityLabel}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 pl-7 leading-relaxed">{item.priorityReason}</p>
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto pl-7 md:pl-0 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{item.estimatedMinutes}m</span>
                  </div>

                  {/* Why am I seeing this trigger */}
                  <button
                    type="button"
                    onClick={() => handleOpenWhy(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition flex items-center gap-1"
                    title="Inspect why this topic was scheduled"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Why this?</span>
                  </button>

                  {/* Toggle Status (Mark Completed) */}
                  <button
                    type="button"
                    onClick={() => handleItemStatusToggle(item.id, item.status)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                    }`}
                    title={isCompleted ? 'Mark as In Progress' : 'Mark as Completed'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'Done' : 'Mark Done'}</span>
                  </button>

                  {/* Direct Launch Action */}
                  <Link
                    href={
                      item.recommendedActivity === 'learning_unit'
                        ? `/student/learn/${item.topicId}`
                        : `/student/practice?topicId=${item.topicId}`
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs"
                  >
                    <span>{item.recommendedActivity === 'learning_unit' ? 'Study' : 'Practice'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ADAPTIVE PRACTICE LAUNCHER SECTION */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase">
              Dynamic Scaffolded Session
            </span>
            <span className="text-xs text-stone-500">
              Targeted across your top {items.length} focus topics
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-stone-900">
            Launch Adaptive 6-Question Practice Drill
          </h4>
          <p className="text-xs text-stone-600">
            Generates a calibrated set starting from core mechanics and stepping up to exam-level pacing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartAdaptivePractice}
          disabled={generatingPractice}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs shrink-0"
        >
          <PlayCircle className="w-4 h-4" />
          <span>{generatingPractice ? 'Generating Set...' : 'Launch Adaptive Set'}</span>
        </button>
      </div>

      {/* 5. "WHY AM I SEEING THIS?" MODAL */}
      <WhyExplanationModal
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
        explanation={selectedWhyExplanation}
        onStartPractice={(topicId) => {
          if (onNavigateToPractice) {
            onNavigateToPractice(topicId);
          }
        }}
      />
    </div>
  );
}

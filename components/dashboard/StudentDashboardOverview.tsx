'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { masteryService } from '@/services/mastery/mastery.service';
import { personalizationService } from '@/services/study-plan/personalization.service';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { questionService } from '@/services/question/question.service';
import { demoService } from '@/services/demo/demo.service';
import { useExam } from '@/lib/context/exam-context';
import { examConfigService } from '@/services/exam/exam-config.service';
import type {
  ExamType,
  TopicMastery,
  PersonalizedStudyPlanResult,
  StudyPlanItemDetailed,
  QuestionAttempt,
  TopicMasteryHistoryEntry,
  NextBestActivity,
} from '@/types';
import {
  Sparkles,
  Target,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  Award,
  Calendar,
  Brain,
  ShieldCheck,
  PlayCircle,
  Zap,
  RotateCcw,
  ChevronRight,
  BarChart3,
  Layers,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface StudentDashboardOverviewProps {
  selectedExam: ExamType;
  onExamChange: (exam: ExamType) => void;
  onNavigateToTab: (tab: string, context?: { topicId?: string; subjectId?: string }) => void;
  onNavigateToLearningUnit: (topicId: string) => void;
  onNavigateToAdaptivePractice: (topicId?: string) => void;
  onNavigateToAiTutor: (topicId?: string) => void;
  onNavigateToDiagnostic: () => void;
  onNavigateToMockExam?: () => void;
}

export function StudentDashboardOverview({
  selectedExam,
  onExamChange,
  onNavigateToTab,
  onNavigateToLearningUnit,
  onNavigateToAdaptivePractice,
  onNavigateToAiTutor,
  onNavigateToDiagnostic,
  onNavigateToMockExam,
}: StudentDashboardOverviewProps) {
  const { profile, isDemo } = useAuth();
  const { selectedExam: globalExam, setSelectedExam: setGlobalExam } = useExam();
  const activeExam = selectedExam || globalExam;
  const studentId = profile?.id || '00000000-0000-0000-0000-000000000001';

  // State
  const [studyPlanResult, setStudyPlanResult] = useState<PersonalizedStudyPlanResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>('all');

  // Derive active subject tab ensuring it belongs to active exam
  const currentSubjectTab =
    activeSubjectTab === 'all' || examConfigService.isSubjectAllowed(activeSubjectTab, activeExam)
      ? activeSubjectTab
      : 'all';

  // Fetch live student study plan
  useEffect(() => {
    let isCancelled = false;

    async function loadDashboardData() {
      setLoading(true);
      try {
        const plan = await personalizationService.getActiveStudyPlan(studentId, activeExam);
        if (!isCancelled && plan) {
          setStudyPlanResult(plan);
        }
      } catch (err) {
        console.error('Failed to load study plan for dashboard:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isCancelled = true;
    };
  }, [studentId, activeExam, refreshTrigger]);

  // Derived real data from Mastery Engine (Single Source of Truth)
  const masterySummary = useMemo(() => {
    if (refreshTrigger < 0) return null;
    return masteryService.getStudentMastery(studentId, { examType: activeExam });
  }, [studentId, activeExam, refreshTrigger]);

  // Weak Topics ranked by priority & severity
  const weakTopics = useMemo(() => {
    if (refreshTrigger < 0) return [];
    return masteryService.getWeakTopics(studentId, { examType: activeExam, limit: 4 });
  }, [studentId, activeExam, refreshTrigger]);

  // Subject-level masteries calculated accurately from topic weights
  const subjectsHierarchy = useMemo(() => {
    const subjects = curriculumService.getSubjectsForExamSync(activeExam);
    return subjects.map((subj) => {
      const subjTopics = curriculumService.getTopicsForSubject(subj.id);
      const studentTopics = (masterySummary?.topics || []).filter((t) => t.subjectId === subj.id);

      const assessedCount = studentTopics.filter((t) => t.status && t.status !== 'unassessed').length;
      const totalScore = studentTopics.reduce((sum, t) => sum + (t.masteryScore || 0), 0);
      const averageScore = studentTopics.length > 0 ? Math.round(totalScore / studentTopics.length) : 0;

      const weakCount = studentTopics.filter((t) => t.status === 'weak').length;
      const masteredCount = studentTopics.filter((t) => t.status === 'mastered').length;

      return {
        subject: subj,
        totalTopics: subjTopics.length,
        assessedCount,
        averageScore,
        weakCount,
        masteredCount,
        topics: studentTopics,
      };
    });
  }, [activeExam, masterySummary]);

  // Recent Question Attempts
  const recentAttempts: QuestionAttempt[] = useMemo(() => {
    if (refreshTrigger < 0) return [];
    const all = questionService.getStudentAttemptsSync(studentId);
    return all.slice(0, 5);
  }, [studentId, refreshTrigger]);

  // Historical Mastery Changes Timeline
  const masteryHistory: TopicMasteryHistoryEntry[] = useMemo(() => {
    if (refreshTrigger < 0) return [];
    const hist = masteryService.getMasteryHistory(studentId);
    return hist.slice(0, 5);
  }, [studentId, refreshTrigger]);

  // Current In-Progress or Most Urgent Learning Unit (for Continue Learning widget)
  const continueLearningTopic = useMemo(() => {
    // 1. Check if Today's Study Plan has an in-progress or recommended learning unit matching the active exam
    const candidatePlanItem =
      studyPlanResult?.items.find(
        (it) =>
          it.subjectId &&
          examConfigService.isSubjectAllowed(it.subjectId, activeExam) &&
          (it.status === 'in_progress' || it.recommendedActivity === 'learning_unit')
      ) ||
      studyPlanResult?.items.find((it) =>
        Boolean(it.subjectId && examConfigService.isSubjectAllowed(it.subjectId, activeExam))
      );

    if (candidatePlanItem) {
      const topicMeta = curriculumService.getTopicByIdSync(candidatePlanItem.topicId);
      const subjectId = candidatePlanItem.subjectId || topicMeta?.subjectId || '';
      const subjectMeta = curriculumService.getSubjectByIdSync(subjectId);
      const unit = curriculumService.getLearningUnitByTopicId(candidatePlanItem.topicId);
      return {
        topicId: candidatePlanItem.topicId,
        topicName:
          candidatePlanItem.topicName ||
          topicMeta?.name ||
          candidatePlanItem.topicId.replace('topic-', '').replace(/-/g, ' '),
        subjectName:
          candidatePlanItem.subjectName ||
          subjectMeta?.name ||
          (activeExam === 'MDCAT' ? 'Biology' : 'Physics'),
        masteryScore: candidatePlanItem.masteryScore ?? (activeExam === 'MDCAT' ? 78 : 38),
        estimatedMinutes:
          candidatePlanItem.estimatedMinutes || topicMeta?.estimatedStudyMinutes || 25,
        keyFormulasCount: unit?.keyFormulas?.length || 3,
        keyConceptsCount: unit?.keyConcepts?.length || 3,
        conceptSummary:
          unit?.summary ||
          (activeExam === 'MDCAT'
            ? 'Analyze the fluid mosaic model, organelle ultrastructure, and ATP bioenergetics for MDCAT.'
            : 'Core dynamics, force vectors, and entrance exam shortcuts.'),
      };
    }

    // 2. Exam-aware weak topics prioritizing active exam's highest weight subjects
    if (weakTopics.length > 0) {
      const sortedWeak = [...weakTopics].sort((a, b) => {
        const weightA =
          examConfigService.getSubjectConfig(a.subjectId, activeExam)?.weightPercentage || 0;
        const weightB =
          examConfigService.getSubjectConfig(b.subjectId, activeExam)?.weightPercentage || 0;
        return weightB - weightA || a.masteryScore - b.masteryScore;
      });
      const topWeak = sortedWeak[0];
      const topicMeta = curriculumService.getTopicByIdSync(topWeak.topicId);
      const subjectMeta = curriculumService.getSubjectByIdSync(topWeak.subjectId);
      const unit = curriculumService.getLearningUnitByTopicId(topWeak.topicId);
      return {
        topicId: topWeak.topicId,
        topicName: topicMeta?.name || topWeak.topicId.replace('topic-', '').replace(/-/g, ' '),
        subjectName:
          subjectMeta?.name || (activeExam === 'MDCAT' ? 'Biology' : 'Physics'),
        masteryScore: topWeak.masteryScore,
        estimatedMinutes: topicMeta?.estimatedStudyMinutes || 25,
        keyFormulasCount: unit?.keyFormulas?.length || 3,
        keyConceptsCount: unit?.keyConcepts?.length || 2,
        conceptSummary:
          unit?.summary || 'Core dynamics, force vectors, and entrance exam shortcuts.',
      };
    }

    // 3. Fallback derived from active exam configuration
    const defaultTopicId =
      activeExam === 'MDCAT' ? 'topic-bio-cell-structure' : 'topic-phy-centripetal-force';
    const defaultTopic = curriculumService.getTopicByIdSync(defaultTopicId);
    const defaultSubject = defaultTopic
      ? curriculumService.getSubjectByIdSync(defaultTopic.subjectId)
      : null;
    const defaultUnit = curriculumService.getLearningUnitByTopicId(defaultTopicId);

    return {
      topicId: defaultTopicId,
      topicName:
        defaultTopic?.name ||
        (activeExam === 'MDCAT'
          ? 'Cell Structure'
          : 'Centripetal Force & Banking of Roads'),
      subjectName:
        defaultSubject?.name || (activeExam === 'MDCAT' ? 'Biology' : 'Physics'),
      masteryScore: activeExam === 'MDCAT' ? 78 : 38,
      estimatedMinutes: defaultTopic?.estimatedStudyMinutes || 35,
      keyFormulasCount: defaultUnit?.keyFormulas?.length || 2,
      keyConceptsCount: defaultUnit?.keyConcepts?.length || 3,
      conceptSummary:
        defaultUnit?.summary ||
        (activeExam === 'MDCAT'
          ? 'Analyze the fluid mosaic model, endomembrane trafficking, and mitochondrial cristae chemiosmotic ATP synthesis for MDCAT.'
          : 'Circular motion fundamentals, banking equations, and velocity thresholds.'),
    };
  }, [studyPlanResult, weakTopics, activeExam]);

  // Next Best Activity from Study Plan
  const nextBestActivity: NextBestActivity | undefined = studyPlanResult?.nextBestActivity;

  // Handle plan item toggle
  const handleTogglePlanItem = async (itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await personalizationService.updatePlanItemStatus(itemId, nextStatus);
    setRefreshTrigger((v) => v + 1);
  };

  const overallMastery = masterySummary?.averageMasteryScore || 54;
  const examDaysRemaining = 126; // Target exam countdown
  const examDateDisplay = 'July 15, 2026';

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. HEADER: STUDENT IDENTITY, EXAM COUNTDOWN & OVERALL MASTERY */}
      {/* ========================================================================= */}
      <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-50/60 via-stone-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Student Greeting & Exam Goal */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                {selectedExam} Preparation Hub
              </span>
              {isDemo && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  Populated Demo Profile
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Welcome back, {profile?.fullName || 'Shamil'}
            </h1>

            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Targeting <strong className="text-stone-900 font-semibold">{selectedExam} 2026</strong> • Target Score:{' '}
              <strong className="text-emerald-700 font-semibold">
                {profile?.targetScore || (selectedExam === 'ECAT' ? 360 : 180)}/
                {selectedExam === 'ECAT' ? 400 : 200}
              </strong>{' '}
              • Baseline:{' '}
              <span className="font-semibold text-stone-700">
                {profile?.baselineScore || (selectedExam === 'ECAT' ? 240 : 120)}
              </span>
            </p>
          </div>

          {/* Right: Quick Exam Switcher, Streak & Exam Date */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Exam Toggle */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => onExamChange('ECAT')}
                className={`px-3.5 py-2 rounded-xl font-bold transition ${
                  selectedExam === 'ECAT'
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                ECAT (UET)
              </button>
              <button
                type="button"
                onClick={() => onExamChange('MDCAT')}
                className={`px-3.5 py-2 rounded-xl font-bold transition ${
                  selectedExam === 'MDCAT'
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                MDCAT (PMDC)
              </button>
            </div>

            {/* Exam Date & Countdown */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 text-xs">
              <Calendar className="w-4 h-4 text-stone-500" />
              <div>
                <div className="font-bold text-stone-900">{examDateDisplay}</div>
                <div className="text-[10px] text-stone-500 font-medium">{examDaysRemaining} days remaining</div>
              </div>
            </div>

            {/* Active Streak */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
              <span>{profile?.streakDays || 4} Day Streak</span>
            </div>

            {/* Mock Exam Launch Button */}
            {onNavigateToMockExam && (
              <button
                id="btn-dash-take-mock-exam"
                type="button"
                onClick={onNavigateToMockExam}
                className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Take Mock Exam</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 4 CORE ORIENTATION QUESTIONS (EXECUTIVE SUMMARY) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Q1: HOW AM I DOING? */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">1. How am I doing?</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                overallMastery >= 70
                  ? 'bg-emerald-100 text-emerald-800'
                  : overallMastery >= 45
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {overallMastery >= 70 ? 'Strong' : overallMastery >= 45 ? 'Developing' : 'Needs Focus'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-stone-900 tracking-tight">{overallMastery}%</span>
              <span className="text-xs text-stone-500 font-medium">Overall Mastery</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${overallMastery}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 flex items-center justify-between">
            <span>{masterySummary?.assessedTopics || 10} / {masterySummary?.totalTopics || 12} topics assessed</span>
            <button
              onClick={() => onNavigateToTab('mastery')}
              className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              View matrix <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Q2: WHAT SHOULD I STUDY TODAY? */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">2. What to study today?</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
              Top Priority
            </span>
          </div>

          <div>
            <div className="font-bold text-stone-900 text-sm line-clamp-1">
              {nextBestActivity?.title || 'Targeted Practice: Circular Motion'}
            </div>
            <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{nextBestActivity?.estimatedMinutes || 25} min daily target</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (nextBestActivity?.topicId) {
                if (nextBestActivity.activityType === 'learning_unit') {
                  onNavigateToLearningUnit(nextBestActivity.topicId);
                } else {
                  onNavigateToAdaptivePractice(nextBestActivity.topicId);
                }
              } else {
                onNavigateToTab('study-plan');
              }
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Start Today&apos;s Focus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Q3: WHAT AM I WEAK AT? */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">3. What am I weak at?</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-rose-100 text-rose-800">
              {weakTopics.length} Identified
            </span>
          </div>

          <div>
            {weakTopics.length > 0 ? (
              <div>
                <div className="font-bold text-stone-900 text-sm line-clamp-1">
                  {curriculumService.getTopicByIdSync(weakTopics[0].topicId)?.name || 'Circular Dynamics'}
                </div>
                <div className="text-xs text-rose-600 font-semibold mt-0.5">
                  {weakTopics[0].masteryScore}% Mastery • Critical yield
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-500">All assessed topics are in developing or strong bands.</div>
            )}
          </div>

          <button
            onClick={() => {
              if (weakTopics[0]) {
                onNavigateToAdaptivePractice(weakTopics[0].topicId);
              } else {
                onNavigateToTab('practice');
              }
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <span>Drill Weakest Topic</span>
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Q4: AM I IMPROVING? */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">4. Am I improving?</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +14% Momentum
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-stone-900">
                {masteryHistory.length > 0 && masteryHistory[0].delta > 0
                  ? `+${masteryHistory[0].delta}%`
                  : '+14%'}
              </span>
              <span className="text-xs text-stone-500">latest adaptive delta</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
              {masteryHistory.length > 0 && masteryHistory[0].note
                ? masteryHistory[0].note
                : 'Adaptive practice drills verified'}
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('mastery')}
            className="w-full py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <span>View Growth History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HERO: CONTINUE LEARNING (FAST RESUME LEARNING UNIT) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-6 sm:p-7 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
              Continue Learning
            </span>
            <span className="text-xs text-stone-300 font-medium">
              Subject: <strong className="text-white">{continueLearningTopic.subjectName}</strong>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {continueLearningTopic.topicName}
          </h2>

          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            {continueLearningTopic.conceptSummary}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-300 pt-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {continueLearningTopic.estimatedMinutes} min unit
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              {continueLearningTopic.keyFormulasCount} Key Formulas
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              Current Mastery: <strong className="text-emerald-300">{continueLearningTopic.masteryScore}%</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToAiTutor(continueLearningTopic.topicId)}
            className="px-4 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-stone-700"
          >
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Ask AI Tutor</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToLearningUnit(continueLearningTopic.topicId)}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Resume Learning Unit</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN 2-COLUMN GRID: TODAY'S PLAN (LEFT) & AI COACH + WEAK TOPICS (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: TODAY'S STUDY PLAN (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Plan Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">Today&apos;s Study Plan</h2>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Personalized daily syllabus based on your weakest past-paper topics
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToTab('study-plan')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Full Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress Bar for Today */}
            {studyPlanResult && (
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-stone-700">Daily Study Target Progress</span>
                  <span className="text-emerald-700 font-mono font-bold">
                    {studyPlanResult.items.filter((it) => it.status === 'completed').length} of{' '}
                    {studyPlanResult.items.length} Completed (
                    {studyPlanResult.plan.overallProgressPercentage || 50}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${studyPlanResult.plan.overallProgressPercentage || 50}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Plan Items List */}
            <div className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-xs text-stone-400">Loading daily schedule...</div>
              ) : !studyPlanResult || studyPlanResult.items.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  No active tasks. Take a diagnostic test to generate your plan.
                </div>
              ) : (
                studyPlanResult.items.map((item: StudyPlanItemDetailed) => {
                  const isCompleted = item.status === 'completed';
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-stone-50 border-stone-200 opacity-75'
                          : 'bg-white border-stone-200 hover:border-emerald-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleTogglePlanItem(item.id, item.status)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 hover:border-emerald-500 bg-white'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                isCompleted ? 'line-through text-stone-500' : 'text-stone-900'
                              }`}
                            >
                              {item.topicName || item.topicId.replace('topic-', '').replace(/-/g, ' ')}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-stone-100 text-stone-600">
                              {item.subjectName || 'Core'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                item.priorityOrder === 1
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.priorityOrder === 2
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {item.priorityOrder === 1 ? 'High' : item.priorityOrder === 2 ? 'Medium' : 'Standard'}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-500 line-clamp-1">{item.priorityReason}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-stone-800">{item.estimatedMinutes || 25} mins</div>
                          <div className="text-[10px] text-stone-400 capitalize">
                            {(item.recommendedActivity || 'practice').replace('_', ' ')}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (item.recommendedActivity === 'learning_unit') {
                              onNavigateToLearningUnit(item.topicId);
                            } else {
                              onNavigateToAdaptivePractice(item.topicId);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                            isCompleted
                              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                          }`}
                        >
                          <span>{isCompleted ? 'Review' : 'Start'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Practice Launcher */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onNavigateToAdaptivePractice()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Launch Adaptive Practice Arena</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToDiagnostic()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4 text-stone-500" />
                <span>Retake Diagnostic Test</span>
              </button>
            </div>
          </div>

          {/* Subject-Level & Topic-Level Mastery Summary */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">Subject Mastery Breakdown</h2>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Calculated from verified past paper diagnostic and practice attempts
                </p>
              </div>

              {/* Subject Tab Filter */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setActiveSubjectTab('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    currentSubjectTab === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  All Subjects
                </button>
                {subjectsHierarchy.map((s) => (
                  <button
                    key={s.subject.id}
                    onClick={() => setActiveSubjectTab(s.subject.id)}
                    className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                      currentSubjectTab === s.subject.id
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {s.subject.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjectsHierarchy
                .filter((s) => currentSubjectTab === 'all' || s.subject.id === currentSubjectTab)
                .map((subjItem) => (
                  <div
                    key={subjItem.subject.id}
                    className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-white hover:shadow-xs transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm">{subjItem.subject.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          subjItem.averageScore >= 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : subjItem.averageScore >= 45
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {subjItem.averageScore >= 70 ? 'Strong' : subjItem.averageScore >= 45 ? 'Developing' : 'Weak'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="text-stone-500 font-medium">Mastery Score</span>
                        <span className="font-extrabold text-stone-900 text-sm font-mono">
                          {subjItem.averageScore}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${subjItem.averageScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                      <span>{subjItem.weakCount} weak topics</span>
                      <button
                        onClick={() => onNavigateToTab('mastery', { subjectId: subjItem.subject.id })}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        View Topics →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI COACH, WEAK TOPICS & RECENT PROGRESS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI COACH CARD */}
          <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-stone-900 text-white rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm tracking-tight text-white uppercase">AI Exam Coach Insight</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-800/60 text-purple-200 border border-purple-700">
                Personalized
              </span>
            </div>

            <p className="text-purple-100 text-xs sm:text-sm leading-relaxed">
              {studyPlanResult?.coachingAdvice ||
                (activeExam === 'MDCAT'
                  ? `🎯 Focus on Cell Structure and membrane transport today. Biology carries 34% of MDCAT marks—solidify organelle mechanisms and fluid mosaic model principles before your next drill.`
                  : `🎯 Focus on circular motion sign conventions and Le Chatelier's equilibrium shifts today. Your recent physics accuracy is trending up (+14%)—solidify the formulas before the mock exam.`)}
            </p>

            <div className="pt-1 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onNavigateToAiTutor()}
                className="w-full py-2 px-3.5 rounded-xl bg-white text-stone-950 hover:bg-stone-100 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Open Socratic AI Tutor</span>
              </button>
            </div>
          </div>

          {/* TOP PRIORITY WEAK TOPICS */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider">
                  Top Priority Weaknesses
                </h3>
              </div>
              <span className="text-xs text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {weakTopics.length} Critical
              </span>
            </div>

            {weakTopics.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                No critical weak topics detected. Great job!
              </div>
            ) : (
              <div className="space-y-3">
                {weakTopics.map((wt) => {
                  const topicMeta = curriculumService.getTopicByIdSync(wt.topicId);
                  const subjectMeta = curriculumService.getSubjectByIdSync(wt.subjectId);
                  return (
                    <div
                      key={wt.id}
                      className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/80 transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-stone-900 text-xs sm:text-sm">
                            {topicMeta?.name || wt.topicId.replace('topic-', '').replace(/-/g, ' ')}
                          </div>
                          <div className="text-[11px] text-stone-500 font-medium">
                            {subjectMeta?.name || 'Subject'} • Mastery:{' '}
                            <strong className="text-rose-700 font-mono">{wt.masteryScore}%</strong>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-rose-100 text-rose-800 shrink-0">
                          {topicMeta?.importanceRating || 5}/5 Yield
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-rose-100">
                        <button
                          type="button"
                          onClick={() => onNavigateToLearningUnit(wt.topicId)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-semibold text-[11px] transition flex items-center justify-center gap-1"
                        >
                          <BookOpen className="w-3 h-3 text-stone-500" />
                          <span>Start Learning</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigateToAdaptivePractice(wt.topicId)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Zap className="w-3 h-3 text-white" />
                          <span>Practice Drill</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RECENT PROGRESS & ATTEMPTS */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-500" />
                <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider">Recent Progress</h3>
              </div>
              <span className="text-xs text-stone-400 font-mono">{recentAttempts.length} attempts</span>
            </div>

            {recentAttempts.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                No recent attempts logged yet. Answer your first question!
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAttempts.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100/70 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {att.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-stone-800 font-mono text-[11px] line-clamp-1">
                          {att.questionId}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          Time: {att.timeSpentSeconds || att.timeTaken}s • Conf:{' '}
                          <span className="capitalize">{att.confidence || 'med'}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        att.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {att.isCorrect ? '+4 Marks' : '-1 Mark'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

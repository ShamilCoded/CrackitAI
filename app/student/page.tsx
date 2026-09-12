'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useExam } from '@/lib/context/exam-context';
import { examConfigService } from '@/services/exam/exam-config.service';
import { demoService } from '@/services/demo/demo.service';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { questionService } from '@/services/question/question.service';
import { masteryService } from '@/services/mastery/mastery.service';
import { MCQ } from '@/components/common/MCQ';
import { DiagnosticContainer } from '@/components/diagnostic';
import { StudyPlanContainer } from '@/components/personalization/StudyPlanContainer';
import { AiTutorContainer } from '@/components/tutor/AiTutorContainer';
import { AdaptivePracticeArena } from '@/components/adaptive/AdaptivePracticeArena';
import { StudentDashboardOverview } from '@/components/dashboard/StudentDashboardOverview';
import { MockExamContainer } from '@/components/mock-exam';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import type { ExamType, Question, SubmitAnswerResult, AdaptivePracticeSetResult } from '@/types';
import {
  Sparkles,
  BookOpen,
  Target,
  BarChart3,
  Calendar,
  Brain,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Send,
  Zap,
  Award,
  Layers,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';

type TabKey =
  | 'dashboard'
  | 'curriculum'
  | 'diagnostic'
  | 'mock-exam'
  | 'mastery'
  | 'study-plan'
  | 'practice'
  | 'ai-tutor'
  | 'progress';

export default function StudentPortalPage() {
  const { profile, isDemo, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const { selectedExam, setSelectedExam } = useExam();

  // Demo Data State
  const [diagnosticResult, setDiagnosticResult] = useState(() => demoService.getDemoDiagnosticResult());
  const [masteryVersion, setMasteryVersion] = useState<number>(0);
  const topicMasteries = useMemo(() => {
    if (masteryVersion < 0) return [];
    return masteryService.getStudentMastery(profile?.id || '00000000-0000-0000-0000-000000000001', {
      examType: selectedExam,
    }).topics;
  }, [profile?.id, selectedExam, masteryVersion]);

  const [masterySubjectFilter, setMasterySubjectFilter] = useState<string>('all');
  const [masteryStatusFilter, setMasteryStatusFilter] = useState<string>('all');
  const [inspectHistoryTopicId, setInspectHistoryTopicId] = useState<string | null>(null);

  // Curriculum state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    selectedExam === 'MDCAT' ? 'subj-biology' : 'subj-physics'
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    selectedExam === 'MDCAT' ? 'topic-bio-cell-structure' : 'topic-phy-centripetal-force'
  );

  // Active curriculum navigation derived for currently selected exam
  const examTree = curriculumService.getExamCurriculumTree(selectedExam);

  const activeSubjectId = useMemo(() => {
    if (examTree.subjects.some((s) => s.id === selectedSubjectId)) {
      return selectedSubjectId;
    }
    return examTree.subjects[0]?.id || 'subj-physics';
  }, [examTree.subjects, selectedSubjectId]);

  const activeTopicId = useMemo(() => {
    const currentSubj = examTree.subjects.find((s) => s.id === activeSubjectId);
    const topics = currentSubj?.chapters.flatMap((c) => c.topics) || [];
    if (topics.some((t) => t.id === selectedTopicId)) {
      return selectedTopicId;
    }
    return topics[0]?.id || 'topic-phy-centripetal-force';
  }, [examTree.subjects, activeSubjectId, selectedTopicId]);

  const activeMasterySubjectFilter =
    masterySubjectFilter === 'all' || examConfigService.isSubjectAllowed(masterySubjectFilter, selectedExam)
      ? masterySubjectFilter
      : 'all';

  const handleSimulateMasteryAttempt = (topicId: string, isCorrect: boolean) => {
    masteryService.recordPracticeAttempt({
      studentId: profile?.id || '00000000-0000-0000-0000-000000000001',
      topicId,
      isCorrect,
      difficulty: 'medium',
      timeSpentSeconds: 55,
      confidence: isCorrect ? 'high' : 'medium',
      sourceContext: 'practice',
    });
    setMasteryVersion((v) => v + 1);
  };
  const [studyPlanData, setStudyPlanData] = useState(demoService.getDemoStudyPlan());

  // Practice state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [practiceSubmitted, setPracticeSubmitted] = useState<boolean>(false);
  const [adaptivePracticeSet, setAdaptivePracticeSet] = useState<AdaptivePracticeSetResult | null>(null);
  const [adaptiveQuestionIndex, setAdaptiveQuestionIndex] = useState<number>(0);

  const currentLearningUnit = curriculumService.getLearningUnitByTopicId(activeTopicId);

  const defaultQuestion: Question = {
    id: 'q-demo-default',
    subjectId: 'subj-physics',
    chapterId: 'chap-phy-circular-motion',
    topicId: 'topic-phy-centripetal-force',
    type: 'multiple_choice',
    difficulty: 'medium',
    content:
      'A car of mass 1200 kg rounds an unbanked circular curve of radius 50 m on a horizontal road. If the coefficient of static friction between tires and road is 0.5, what is the maximum speed the car can round the curve without skidding? (Take g = 9.8 m/s²)',
    options: [
      { id: 'opt-1', text: '12.2 m/s', isCorrect: false },
      { id: 'opt-2', text: '15.65 m/s', isCorrect: true },
      { id: 'opt-3', text: '24.5 m/s', isCorrect: false },
      { id: 'opt-4', text: '9.8 m/s', isCorrect: false },
    ],
    correctOptionId: 'opt-2',
    comprehensiveExplanation:
      'On an unbanked horizontal curve, centripetal force is provided solely by static friction: f_s = μ · m · g. Setting μ · m · g = m · v² / r, we get v = √(μ · g · r) = √(0.5 × 9.8 × 50) = √245 ≈ 15.65 m/s.',
    applicableExams: ['ECAT', 'MDCAT'],
    isActive: true,
    createdAt: '2026-01-01',
  };

  const topicQuestions = questionService.getQuestionsByTopicSync(activeTopicId);
  const [topicQuestionIndex, setTopicQuestionIndex] = useState(0);

  // Use adaptive question if in an active adaptive practice set
  const isAdaptiveMode = Boolean(adaptivePracticeSet && adaptivePracticeSet.questions.length > 0);
  const practiceQuestion: Question = isAdaptiveMode
    ? adaptivePracticeSet!.questions[adaptiveQuestionIndex] || defaultQuestion
    : topicQuestions[topicQuestionIndex] ||
      topicQuestions[0] ||
      curriculumService.getQuestionsForTopic(activeTopicId)[0] ||
      defaultQuestion;

  const handleExamToggle = (exam: ExamType) => {
    setSelectedExam(exam);
    if (isDemo) {
      demoService.setDemoTargetExam(exam);
      refreshProfile();
    }
  };

  const handleAttemptRecorded = (res: SubmitAnswerResult) => {
    const activePracticeTopicId = practiceQuestion.topicId || activeTopicId;
    masteryService.recordPracticeAttempt({
      studentId: profile?.id || '00000000-0000-0000-0000-000000000001',
      topicId: activePracticeTopicId,
      isCorrect: res.isCorrect,
      difficulty: practiceQuestion.difficulty || 'medium',
      timeSpentSeconds: 55,
      confidence: res.isCorrect ? 'high' : 'medium',
      sourceContext: 'practice',
    });
    setMasteryVersion((v) => v + 1);
  };

  const handleNextTopicQuestion = () => {
    if (isAdaptiveMode && adaptivePracticeSet) {
      if (adaptiveQuestionIndex + 1 < adaptivePracticeSet.questions.length) {
        setAdaptiveQuestionIndex((prev) => prev + 1);
      } else {
        // Finished adaptive set
        setAdaptivePracticeSet(null);
        setAdaptiveQuestionIndex(0);
      }
    } else if (topicQuestions.length > 0) {
      setTopicQuestionIndex((prev) => (prev + 1) % topicQuestions.length);
    }
  };

  const handleLaunchAdaptivePractice = (practiceSet: AdaptivePracticeSetResult) => {
    if (practiceSet.questions && practiceSet.questions.length > 0) {
      setAdaptivePracticeSet(practiceSet);
      setAdaptiveQuestionIndex(0);
      if (practiceSet.questions[0].topicId) {
        setSelectedTopicId(practiceSet.questions[0].topicId);
      }
      setActiveTab('practice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs for All Capabilities */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-stone-200 text-xs font-semibold text-stone-600">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 transition whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostic')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 transition whitespace-nowrap ${
            activeTab === 'diagnostic'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Diagnostic Result</span>
        </button>

        <button
          id="tab-btn-mock-exam"
          onClick={() => setActiveTab('mock-exam')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 transition whitespace-nowrap ${
            activeTab === 'mock-exam'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>Mock Exam Arena</span>
        </button>

        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 transition whitespace-nowrap ${
            activeTab === 'curriculum'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curriculum & Learning Units</span>
        </button>

        <button
          onClick={() => setActiveTab('mastery')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 transition whitespace-nowrap ${
            activeTab === 'mastery'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Topic Mastery</span>
        </button>

        <button
          onClick={() => setActiveTab('study-plan')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 transition whitespace-nowrap ${
            activeTab === 'study-plan'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Personalized Plan</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 transition whitespace-nowrap ${
            activeTab === 'practice'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Practice Question</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-tutor')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 transition whitespace-nowrap ${
            activeTab === 'ai-tutor'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>AI Tutor Session</span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg border-b-2 transition whitespace-nowrap ${
            activeTab === 'progress'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Progress & Trajectory</span>
        </button>
      </div>

      <ErrorBoundary
        resetKey={activeTab}
        title="Student Section Error"
        fallbackMessage="An unexpected issue occurred while rendering this section. You can try again or switch to another section."
      >
        {/* TAB 0: MAIN STUDENT DASHBOARD */}
        {activeTab === 'dashboard' && (
        <StudentDashboardOverview
          selectedExam={selectedExam}
          onExamChange={handleExamToggle}
          onNavigateToTab={(tab, context) => {
            if (context?.topicId) {
              setSelectedTopicId(context.topicId);
            }
            if (context?.subjectId) {
              setSelectedSubjectId(context.subjectId);
            }
            setActiveTab(tab as TabKey);
          }}
          onNavigateToLearningUnit={(topicId) => {
            setSelectedTopicId(topicId);
            setActiveTab('curriculum');
          }}
          onNavigateToAdaptivePractice={(topicId) => {
            if (topicId) {
              setSelectedTopicId(topicId);
            }
            setActiveTab('practice');
          }}
          onNavigateToAiTutor={(topicId) => {
            if (topicId) {
              setSelectedTopicId(topicId);
            }
            setActiveTab('ai-tutor');
          }}
          onNavigateToDiagnostic={() => {
            setActiveTab('diagnostic');
          }}
          onNavigateToMockExam={() => {
            setActiveTab('mock-exam');
          }}
        />
      )}

      {/* TAB 1: DIAGNOSTIC RESULT */}
      {activeTab === 'diagnostic' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-xs">
          <DiagnosticContainer initialExamType={selectedExam} />
        </div>
      )}

      {/* TAB: HIGH-STAKES MOCK EXAM ARENA */}
      {activeTab === 'mock-exam' && (
        <MockExamContainer
          initialExam={selectedExam}
          onNavigateToTopic={(topicId, subjectId) => {
            if (topicId) setSelectedTopicId(topicId);
            if (subjectId) setSelectedSubjectId(subjectId);
            setActiveTab('curriculum');
          }}
          onNavigateToPractice={(subjectId, topicId) => {
            if (subjectId) setSelectedSubjectId(subjectId);
            if (topicId) setSelectedTopicId(topicId);
            setActiveTab('practice');
          }}
        />
      )}

      {/* TAB 2: CURRICULUM & REUSABLE LEARNING UNITS */}
      {activeTab === 'curriculum' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>{selectedExam} Data-Driven Curriculum</span>
              </h3>
              <p className="text-xs text-stone-500">
                Shared subject hierarchy across ECAT and MDCAT with fine-grained subtopics and Bloom&apos;s learning objectives.
              </p>
            </div>
            <Link
              href="/student/curriculum"
              id="btn-open-curriculum-explorer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition shrink-0 shadow-xs"
            >
              <span>Explore Complete Hierarchy</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Subject and Chapter Tree */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                {selectedExam} Syllabus Tree
              </h3>
              <div className="space-y-2">
                {examTree.subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSubjectId(s.id);
                      if (s.chapters[0]?.topics[0]) {
                        setSelectedTopicId(s.chapters[0].topics[0].id);
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      activeSubjectId === s.id
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-80">{s.weightPercentage}% weight</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-200">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Topics in selected subject
                </span>
                <div className="mt-2 space-y-1">
                  {examTree.subjects
                    .find((s) => s.id === activeSubjectId)
                    ?.chapters.flatMap((c) => c.topics)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTopicId(t.id)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between ${
                          activeTopicId === t.id
                            ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                            : 'text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Reusable Learning Unit Display */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                    Learning Unit
                  </span>
                  <h2 className="text-base font-bold text-stone-900 mt-1">
                    {currentLearningUnit?.title || 'Rotational Motion & Centripetal Dynamics'}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-stone-500">Est. Time</span>
                  <div className="text-sm font-bold text-stone-800">
                    {currentLearningUnit?.estimatedMinutes || 45} mins
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {currentLearningUnit?.summary}
                </p>

                {/* Key Concepts */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Key Pedagogical Concepts</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-stone-700 pl-4 list-disc">
                    {currentLearningUnit?.keyConcepts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Key Formulas */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span>High-Yield Exam Formulas</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentLearningUnit?.keyFormulas.map((f, i) => (
                      <div
                        key={i}
                        className="bg-white border border-stone-200 rounded-lg p-2 font-mono text-xs text-stone-800 font-semibold shadow-2xs"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Pitfalls */}
                <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Common Exam Pitfalls & Trap Answers</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-rose-950 pl-4 list-disc">
                    {currentLearningUnit?.commonPitfalls.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                {/* Launch Full Learning Unit CTA */}
                <div className="pt-2">
                  <Link
                    href={`/student/learn/${activeTopicId}`}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Launch Full Interactive Learning Unit (Learn • Examples • Practice • AI Tutor • Revision • Mastery)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOPIC MASTERY */}
      {activeTab === 'mastery' && (
        <div className="space-y-6">
          {/* 1. Header & Transparent Formula Explainer */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Centralized Engine
                  </span>
                  <span className="text-xs text-stone-500">Single Source of Truth</span>
                </div>
                <h2 className="text-lg font-bold text-stone-900 mt-1">
                  Topic Mastery Progress Matrix
                </h2>
                <p className="text-xs text-stone-600">
                  Calculated from multi-signal empirical evidence: overall accuracy, question difficulty, attempt recency, and confidence calibration.
                </p>
              </div>

              {/* Formula Blueprint Pill */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-700 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Active Scoring Blueprint (Bounded 0–100)
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-emerald-700 font-bold">50% Acc</span>
                  <span>+</span>
                  <span className="text-blue-700 font-bold">25% Diff</span>
                  <span>+</span>
                  <span className="text-amber-700 font-bold">15% Recency</span>
                  <span>+</span>
                  <span className="text-purple-700 font-bold">10% Conf/Time</span>
                </div>
              </div>
            </div>

            {/* 2. High-Level Aggregated KPI Cards */}
            {(() => {
              const studentSummary = masteryService.getStudentMastery(
                profile?.id || '00000000-0000-0000-0000-000000000001',
                { examType: selectedExam }
              );
              const weakTopics = masteryService.getWeakTopics(
                profile?.id || '00000000-0000-0000-0000-000000000001',
                { examType: selectedExam }
              );
              const strongTopics = masteryService.getStrongTopics(
                profile?.id || '00000000-0000-0000-0000-000000000001',
                { examType: selectedExam }
              );

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-semibold text-stone-500 uppercase">Average Mastery</span>
                      <div className="text-xl font-bold text-stone-900 mt-0.5">
                        {studentSummary.averageMasteryScore}%
                      </div>
                      <span className="text-[10px] text-stone-500">{studentSummary.assessedTopics} topics evaluated</span>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-semibold text-emerald-800 uppercase">Mastered (≥85%)</span>
                      <div className="text-xl font-bold text-emerald-900 mt-0.5">
                        {studentSummary.countsByStatus.mastered}
                      </div>
                      <span className="text-[10px] text-emerald-700">Exam-ready</span>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-semibold text-blue-800 uppercase">Strong (70–84%)</span>
                      <div className="text-xl font-bold text-blue-900 mt-0.5">
                        {studentSummary.countsByStatus.strong}
                      </div>
                      <span className="text-[10px] text-blue-700">High competence</span>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-semibold text-amber-800 uppercase">Developing (45–69%)</span>
                      <div className="text-xl font-bold text-amber-900 mt-0.5">
                        {studentSummary.countsByStatus.developing}
                      </div>
                      <span className="text-[10px] text-amber-700">Needs review</span>
                    </div>

                    <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-semibold text-rose-800 uppercase">Weak (&lt;45%)</span>
                      <div className="text-xl font-bold text-rose-900 mt-0.5">
                        {studentSummary.countsByStatus.weak}
                      </div>
                      <span className="text-[10px] text-rose-700">High priority gap</span>
                    </div>
                  </div>

                  {/* 3. Priority Weak Topics Alert Banner */}
                  {weakTopics.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-rose-950">
                            Immediate Remediation Required: {weakTopics.length} Weak Topic{weakTopics.length > 1 ? 's' : ''} Flagged
                          </h4>
                          <p className="text-xs text-rose-800 mt-0.5">
                            Identified gap: <span className="font-semibold">{weakTopics[0].topicId.replace('topic-', '').replace(/-/g, ' ')}</span> ({weakTopics[0].masteryScore}% mastery). Prioritize practice to prevent exam trap errors.
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/student/practice?topicId=${weakTopics[0].topicId}`}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Drill Weakest Topic</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 4. Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-stone-500">Status:</span>
                {['all', 'weak', 'developing', 'strong', 'mastered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setMasteryStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                      masteryStatusFilter === st
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500">Subject:</span>
                <select
                  value={activeMasterySubjectFilter}
                  onChange={(e) => setMasterySubjectFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-medium text-stone-800"
                >
                  <option value="all">All Subjects</option>
                  {curriculumService.getSubjectsForExamSync(selectedExam).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Matrix Grid of Topic Masteries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {topicMasteries
                .filter((m) => {
                  if (masteryStatusFilter !== 'all' && m.status !== masteryStatusFilter) return false;
                  if (activeMasterySubjectFilter !== 'all' && m.subjectId !== activeMasterySubjectFilter) return false;
                  return true;
                })
                .map((m) => {
                  const statusColors = {
                    mastered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    strong: 'bg-blue-100 text-blue-800 border-blue-200',
                    developing: 'bg-amber-100 text-amber-800 border-amber-200',
                    weak: 'bg-rose-100 text-rose-800 border-rose-200',
                    unassessed: 'bg-stone-100 text-stone-600 border-stone-200',
                  };

                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3 hover:border-stone-300 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                              {m.subjectId.replace('subj-', '')}
                            </span>
                            {m.needsReview && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                Needs Review
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-stone-900 capitalize mt-0.5">
                            {m.topicId.replace('topic-', '').replace(/-/g, ' ')}
                          </h4>
                          <span className="text-[10px] text-stone-500">
                            {m.correctCount} / {m.totalAttempted} correct ({m.accuracyPercentage}%) • Streak: {m.streakCount}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${
                            statusColors[m.status || 'unassessed'] || statusColors.unassessed
                          }`}
                        >
                          {m.status || 'unassessed'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-stone-600">Mastery Score</span>
                          <span className="text-stone-900 font-bold">{m.masteryScore}%</span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              m.masteryScore >= 85
                                ? 'bg-emerald-500'
                                : m.masteryScore >= 70
                                ? 'bg-blue-500'
                                : m.masteryScore >= 45
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${m.masteryScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Timestamps & Telemetry */}
                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-200/60">
                        <span>Last assessed: {m.lastAssessedAt ? new Date(m.lastAssessedAt).toLocaleDateString() : 'Pending diagnostic'}</span>
                        <span>Last practiced: {m.lastPracticedAt ? new Date(m.lastPracticedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                      </div>

                      {/* Interactive Actions & Simulation Tester */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/student/practice?topicId=${m.topicId}`}
                            className="px-2.5 py-1 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                          >
                            <Target className="w-3 h-3 text-emerald-600" />
                            <span>Practice</span>
                          </Link>

                          <Link
                            href={`/student/learn/${m.topicId}`}
                            className="px-2.5 py-1 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                          >
                            <BookOpen className="w-3 h-3 text-blue-600" />
                            <span>Unit</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setInspectHistoryTopicId(inspectHistoryTopicId === m.topicId ? null : m.topicId)}
                            className={`px-2 py-1 border rounded-lg text-xs font-medium transition ${
                              inspectHistoryTopicId === m.topicId
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                            }`}
                            title="View historical changes for this topic"
                          >
                            Timeline ({m.history?.length || 0})
                          </button>
                        </div>

                        {/* Instant Engine Simulation Buttons for Testing Practice -> Mastery Updates */}
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-[10px] text-stone-500 mr-1">Simulate:</span>
                          <button
                            type="button"
                            onClick={() => handleSimulateMasteryAttempt(m.topicId, true)}
                            className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-bold transition shadow-2xs"
                            title="Simulate correct practice attempt"
                          >
                            + Correct
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulateMasteryAttempt(m.topicId, false)}
                            className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold transition shadow-2xs"
                            title="Simulate incorrect practice attempt"
                          >
                            - Miss
                          </button>
                        </div>
                      </div>

                      {/* Expandable History Drawer */}
                      {inspectHistoryTopicId === m.topicId && (
                        <div className="mt-3 p-3 bg-white border border-stone-200 rounded-lg space-y-2 text-xs">
                          <div className="flex items-center justify-between font-bold text-stone-900 border-b border-stone-100 pb-1.5">
                            <span>Auditable Mastery Timeline</span>
                            <span className="text-[10px] font-normal text-stone-500">Progress Visualization</span>
                          </div>
                          {m.history && m.history.length > 0 ? (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {m.history.map((h, i) => (
                                <div
                                  key={h.id || i}
                                  className="flex items-center justify-between p-1.5 bg-stone-50 rounded border border-stone-100 text-[11px]"
                                >
                                  <div>
                                    <span className="font-semibold capitalize text-stone-800">
                                      {h.sourceContext.replace('_', ' ')}:
                                    </span>{' '}
                                    <span className="text-stone-500 font-mono">
                                      {h.previousScore}% → <strong className="text-stone-900">{h.newScore}%</strong>
                                    </span>
                                    {h.note && <div className="text-[10px] text-stone-500 italic">{h.note}</div>}
                                  </div>
                                  <div className="text-right">
                                    <span
                                      className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                        h.delta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {h.delta >= 0 ? `+${h.delta}%` : `${h.delta}%`}
                                    </span>
                                    <div className="text-[9px] text-stone-500">
                                      {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-stone-500 text-[11px] italic">No prior assessments recorded for this topic yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERSONALIZED STUDY PLAN */}
      {activeTab === 'study-plan' && (
        <StudyPlanContainer
          studentId={profile?.id || '00000000-0000-0000-0000-000000000001'}
          examType={selectedExam}
          onNavigateToPractice={(topicId) => {
            setSelectedTopicId(topicId);
            setAdaptivePracticeSet(null);
            setActiveTab('practice');
          }}
          onLaunchAdaptivePractice={handleLaunchAdaptivePractice}
        />
      )}

      {/* TAB 5: PRACTICE QUESTION (POWERED BY ADAPTIVE QUESTION ENGINE & REUSABLE MCQ) */}
      {activeTab === 'practice' && (
        <div className="space-y-5">
          {isAdaptiveMode ? (
            <div className="space-y-5">
              {/* Top Banner with Adaptive Mode Info */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200 uppercase tracking-wider">
                      Study Plan Adaptive Set
                    </span>
                    <span className="text-xs text-purple-700 font-semibold">
                      Question {adaptiveQuestionIndex + 1} of {adaptivePracticeSet!.questions.length}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    {adaptivePracticeSet!.rationale}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdaptivePracticeSet(null)}
                    className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition"
                  >
                    Switch to Full Adaptive Arena
                  </button>
                  <Link
                    href="/student/practice"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <span>Full Practice Arena</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Reusable MCQ Component */}
              <MCQ
                key={`${practiceQuestion.id}-${adaptiveQuestionIndex}`}
                question={practiceQuestion}
                studentId={profile?.id || '00000000-0000-0000-0000-000000000001'}
                sourceContext="practice"
                onAttemptRecorded={handleAttemptRecorded}
                onNext={handleNextTopicQuestion}
              />
            </div>
          ) : (
            <AdaptivePracticeArena
              initialTopicId={activeTopicId}
              initialExamType={selectedExam}
              onNavigateToLearningUnit={(topicId) => {
                setSelectedTopicId(topicId);
                setActiveTab('curriculum');
              }}
              onNavigateToAiTutor={(topicId) => {
                setSelectedTopicId(topicId);
                setActiveTab('ai-tutor');
              }}
            />
          )}
        </div>
      )}

      {/* TAB 6: AI TUTOR SESSION (FULL CONTEXT-AWARE SOCRATIC ENGINE) */}
      {activeTab === 'ai-tutor' && (
        <AiTutorContainer
          studentId={profile?.id || '00000000-0000-0000-0000-000000000001'}
          initialExam={selectedExam}
          initialTopicId={activeTopicId}
          onNavigateToPractice={(topicId) => {
            setSelectedTopicId(topicId);
            setAdaptivePracticeSet(null);
            setActiveTab('practice');
          }}
        />
      )}

      {/* TAB 7: PROGRESS & TRAJECTORY */}
      {activeTab === 'progress' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Current Score Estimate
              </span>
              <div className="text-3xl font-extrabold text-stone-900">
                {profile?.currentScoreEstimate || 268} / 400
              </div>
              <p className="text-xs text-emerald-700 font-semibold">
                +28 marks improvement from baseline (240)
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Syllabus Mastery Index
              </span>
              <div className="text-3xl font-extrabold text-stone-900">58%</div>
              <p className="text-xs text-stone-500">
                18 of 31 Core Learning Units reviewed
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Exam Readiness Probability
              </span>
              <div className="text-3xl font-extrabold text-emerald-700">74%</div>
              <p className="text-xs text-stone-500">
                On track for top engineering university merit cutoff
              </p>
            </div>
          </div>
        </div>
      )}
      </ErrorBoundary>
    </div>
  );
}

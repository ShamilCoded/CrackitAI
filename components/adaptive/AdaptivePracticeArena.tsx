'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { adaptiveQuestionService } from '@/services/question/adaptive-question.service';
import { questionService } from '@/services/question/question.service';
import { masteryService } from '@/services/mastery/mastery.service';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { useExam } from '@/lib/context/exam-context';
import { examConfigService } from '@/services/exam/exam-config.service';
import { MCQ } from '@/components/common/MCQ';
import type {
  ExamType,
  Question,
  DifficultyLevel,
  SubmitAnswerResult,
  TopicMastery,
} from '@/types';
import type {
  ActiveAdaptiveSession,
  AdaptiveQuestionRecommendation,
  MasteryComparisonResult,
  PedagogicalStage,
} from '@/types/adaptive';
import {
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  RefreshCw,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Brain,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  MessageSquare,
  ChevronRight,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';

interface AdaptivePracticeArenaProps {
  initialTopicId?: string;
  initialExamType?: ExamType;
  initialMode?: 'practice' | 'retest';
  onNavigateToLearningUnit?: (topicId: string) => void;
  onNavigateToAiTutor?: (topicId: string) => void;
}

export function AdaptivePracticeArena({
  initialTopicId = 'topic-phy-centripetal-force',
  initialExamType,
  initialMode = 'practice',
  onNavigateToLearningUnit,
  onNavigateToAiTutor,
}: AdaptivePracticeArenaProps) {
  const { profile } = useAuth();
  const studentId = profile?.id || '00000000-0000-0000-0000-000000000001';
  const { selectedExam, setSelectedExam } = useExam();
  const examType = selectedExam;
  const setExamType = setSelectedExam;

  // Topic Selection
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId);
  const [sessionType, setSessionType] = useState<'adaptive_practice' | 'mastery_retest'>(
    initialMode === 'retest' ? 'mastery_retest' : 'adaptive_practice'
  );

  // Active Session State
  const [activeSession, setActiveSession] = useState<ActiveAdaptiveSession | null>(null);
  const [currentQuestionRec, setCurrentQuestionRec] = useState<AdaptiveQuestionRecommendation | null>(null);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [lastAnswerResult, setLastAnswerResult] = useState<SubmitAnswerResult | null>(null);
  const [sessionCompletedResult, setSessionCompletedResult] = useState<MasteryComparisonResult | null>(null);
  const [masteryVersion, setMasteryVersion] = useState<number>(0);

  // Derive activeTopicId ensuring it is strictly valid for the currently active exam
  const activeTopicId = useMemo(() => {
    const meta = curriculumService.getTopicByIdSync(selectedTopicId);
    if (meta && examConfigService.isSubjectAllowed(meta.subjectId, examType)) {
      return selectedTopicId;
    }
    const allowedSubjects = examConfigService.getAllowedSubjects(examType);
    if (allowedSubjects.length > 0) {
      const firstSubjectTopics = curriculumService.getTopicsForSubject(allowedSubjects[0].subjectId);
      if (firstSubjectTopics.length > 0) {
        return firstSubjectTopics[0].id;
      }
    }
    return selectedTopicId;
  }, [selectedTopicId, examType]);

  // All Weak/Developing Topics list for easy selection
  const weakAndDevelopingTopics = useMemo(() => {
    // Reference masteryVersion to trigger recalculation on session updates
    if (masteryVersion < 0) return [];
    const studentMastery = masteryService.getStudentMastery(studentId, { examType });
    const topics = studentMastery.topics.map((t) => {
      const meta = curriculumService.getTopicByIdSync(t.topicId);
      const subject = curriculumService.getSubjectByIdSync(t.subjectId);
      return {
        ...t,
        topicName: meta?.name || t.topicId.replace('topic-', '').replace(/-/g, ' '),
        subjectName: subject?.name || 'Physics',
      };
    });

    // Sort by lowest mastery first
    return topics.sort((a, b) => a.masteryScore - b.masteryScore);
  }, [studentId, examType, masteryVersion]);

  // Derived current topic mastery
  const currentMastery = useMemo(() => {
    if (masteryVersion < 0) return null;
    const studentMastery = masteryService.getStudentMastery(studentId, { examType });
    return studentMastery.topics.find((t) => t.topicId === activeTopicId) || null;
  }, [studentId, activeTopicId, examType, masteryVersion]);

  // Start or reset session
  const handleStartSession = async (type: 'adaptive_practice' | 'mastery_retest') => {
    setSessionType(type);
    setSessionCompletedResult(null);
    setLastAnswerResult(null);
    setIsAnswering(true);

    try {
      const { session, firstQuestion } = await adaptiveQuestionService.startSession({
        studentId,
        topicId: activeTopicId,
        examType,
        sessionType: type,
      });

      setActiveSession(session);
      setCurrentQuestionRec(firstQuestion);
    } finally {
      setIsAnswering(false);
    }
  };

  // Answer handler
  const handleAttemptRecorded = async (res: SubmitAnswerResult) => {
    setLastAnswerResult(res);
    if (!activeSession || !currentQuestionRec) return;

    try {
      const outcome = await adaptiveQuestionService.recordSessionAnswer({
        sessionId: activeSession.sessionId,
        questionId: currentQuestionRec.question.id,
        selectedOptionId: res.selectedOptionId,
        timeSpentSeconds: res.timeSpentSeconds || 60,
        confidence: res.isCorrect ? 'high' : 'medium',
      });

      setMasteryVersion((v) => v + 1);

      if (outcome.isSessionComplete && outcome.comparisonResult) {
        setSessionCompletedResult(outcome.comparisonResult);
        setActiveSession(null);
        setCurrentQuestionRec(null);
      } else {
        setCurrentQuestionRec(outcome.nextQuestion);
      }
    } catch (err) {
      console.error('Failed to record adaptive session answer:', err);
    }
  };

  // Next question handler
  const handleNextQuestion = () => {
    setLastAnswerResult(null);
  };

  // Restart / Reset
  const handleReset = () => {
    setActiveSession(null);
    setCurrentQuestionRec(null);
    setSessionCompletedResult(null);
    setLastAnswerResult(null);
  };

  const getStageBadge = (stage: PedagogicalStage) => {
    switch (stage) {
      case 'foundation':
        return {
          label: 'Foundational Scaffolding',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'reinforcement':
        return {
          label: 'Concept Reinforcement',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'mistake_remediation':
        return {
          label: 'Mistake Remediation',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'mastery_verification':
        return {
          label: 'Mastery Verification',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      default:
        return {
          label: 'Adaptive Selection',
          color: 'bg-stone-50 text-stone-800 border-stone-200',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOPIC SELECTOR & ADAPTIVE ENGINE CONTROLLER */}
      {!activeSession && !sessionCompletedResult && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  Adaptive Practice Engine
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  Dynamic difficulty & real-time mastery loop
                </span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                Targeted Weak-Topic Practice & Retest
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
                Select any weak or developing topic. The system automatically retrieves questions, adjusts difficulty based on your momentum, tracks your attempts, and prepares a short mastery retest to measure tangible improvement.
              </p>
            </div>

            {/* Exam Switcher */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs font-semibold text-stone-500">Exam:</span>
              <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setExamType('ECAT')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    examType === 'ECAT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  ECAT
                </button>
                <button
                  type="button"
                  onClick={() => setExamType('MDCAT')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    examType === 'MDCAT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  MDCAT
                </button>
              </div>
            </div>
          </div>

          {/* Quick Select Weak Topics Carousel / Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Select Weak or Developing Topic to Practice:
              </span>
              <span className="text-xs text-stone-500">
                {weakAndDevelopingTopics.length} syllabus topics tracked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {weakAndDevelopingTopics.slice(0, 6).map((topic) => {
                const isSelected = activeTopicId === topic.topicId;
                const statusColor =
                  topic.masteryScore >= 70
                    ? 'bg-emerald-100 text-emerald-800'
                    : topic.masteryScore >= 40
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800';

                return (
                  <button
                    key={topic.topicId}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.topicId)}
                    className={`p-4 rounded-xl border text-left transition relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                        : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100/80 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          {topic.subjectName}
                        </span>
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1 mt-0.5">
                          {topic.topicName}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusColor}`}>
                        {topic.masteryScore}%
                      </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-3 w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          topic.masteryScore >= 70
                            ? 'bg-emerald-500'
                            : topic.masteryScore >= 40
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(5, topic.masteryScore)}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                      <span>{topic.totalAttempted} attempts</span>
                      <span className="capitalize">{topic.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Target Topic Summary Card */}
          {currentMastery && (
            <div className="p-4 sm:p-5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-500">Active Topic:</span>
                  <span className="text-sm font-bold text-stone-900">
                    {weakAndDevelopingTopics.find((t) => t.topicId === activeTopicId)?.topicName ||
                      activeTopicId.replace('topic-', '').replace(/-/g, ' ')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      currentMastery.masteryScore >= 70
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentMastery.masteryScore >= 40
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Current Mastery: {currentMastery.masteryScore}% ({currentMastery.status})
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  {currentMastery.masteryScore < 40
                    ? 'Engine will start with foundational Easy questions and step up difficulty as you get answers right.'
                    : currentMastery.masteryScore < 70
                    ? 'Engine will present balanced Medium questions targeting specific skill gaps and past mistakes.'
                    : 'Engine will challenge with Hard and Exam-Level questions to verify peak retention and speed.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleStartSession('adaptive_practice')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-emerald-200" />
                  <span>Start Adaptive Practice</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartSession('mastery_retest')}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>3-Question Retest</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. ACTIVE ADAPTIVE PRACTICE OR RETEST SESSION */}
      {activeSession && currentQuestionRec && (
        <div className="space-y-4">
          {/* Adaptive Live Telemetry Bar */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider flex items-center gap-1.5 ${
                    activeSession.sessionType === 'mastery_retest'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {activeSession.sessionType === 'mastery_retest' ? 'Mastery Retest' : 'Adaptive Practice'}
                </span>

                <span className="text-xs font-bold text-stone-800">
                  {activeSession.topicName}
                </span>

                <span className="text-xs text-stone-400">•</span>

                <span className="text-xs text-stone-500 font-medium">
                  Baseline: <strong>{activeSession.baselineMasteryScore}%</strong>
                </span>
              </div>

              {/* Difficulty & Stage Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase ${
                    getStageBadge(currentQuestionRec.pedagogicalStage).color
                  }`}
                >
                  {getStageBadge(currentQuestionRec.pedagogicalStage).label}
                </span>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize ${
                    currentQuestionRec.targetDifficulty === 'easy'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentQuestionRec.targetDifficulty === 'medium'
                      ? 'bg-blue-100 text-blue-800'
                      : currentQuestionRec.targetDifficulty === 'hard'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {currentQuestionRec.targetDifficulty.replace('_', ' ')}
                </span>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded transition"
                  title="Exit Session"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calibration Reason Live Banner */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs flex items-start gap-2.5">
              <Brain className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-stone-800">Adaptive Selection Reason:</span>
                <p className="text-stone-600 leading-relaxed">
                  {currentQuestionRec.reason}
                </p>
              </div>
            </div>
          </div>

          {/* MCQ Question Display */}
          <MCQ
            key={`${activeSession.sessionId}-${currentQuestionRec.question.id}`}
            question={currentQuestionRec.question}
            studentId={studentId}
            sourceContext="practice"
            onAttemptRecorded={handleAttemptRecorded}
            onNext={handleNextQuestion}
          />
        </div>
      )}

      {/* 3. RETEST / IMPROVEMENT COMPARISON MATRIX (BEFORE VS AFTER) */}
      {sessionCompletedResult && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 mb-1">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Adaptive Practice & Retest Results
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {sessionCompletedResult.summaryFeedback}
            </p>
          </div>

          {/* Before vs After Metric Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Before Mastery */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Before Mastery
              </span>
              <div className="text-3xl font-extrabold text-stone-700">
                {sessionCompletedResult.beforeMasteryScore}%
              </div>
              <span className="text-[11px] font-semibold text-stone-500 capitalize">
                Status: {sessionCompletedResult.statusBefore}
              </span>
            </div>

            {/* After Mastery (High Contrast) */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-500 text-center space-y-1 relative">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                After Mastery
              </span>
              <div className="text-4xl font-extrabold text-emerald-700">
                {sessionCompletedResult.afterMasteryScore}%
              </div>
              <span className="text-[11px] font-bold text-emerald-800 capitalize">
                Status: {sessionCompletedResult.statusAfter}
              </span>

              {sessionCompletedResult.delta > 0 && (
                <div className="absolute top-3 right-3 text-xs font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                  +{sessionCompletedResult.delta}%
                </div>
              )}
            </div>

            {/* Session Accuracy & Verified Status */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Session Accuracy
              </span>
              <div className="text-3xl font-extrabold text-stone-900">
                {sessionCompletedResult.sessionAccuracy}%
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                {sessionCompletedResult.correctCountInSession} of{' '}
                {sessionCompletedResult.totalAttemptsInSession} correct
              </span>
            </div>
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {sessionCompletedResult.strengths.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Demonstrated Strengths</span>
                </div>
                <ul className="text-xs text-stone-700 space-y-1.5 list-disc list-inside">
                  {sessionCompletedResult.strengths.map((s, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sessionCompletedResult.growthAreas.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Focus & Growth Areas</span>
                </div>
                <ul className="text-xs text-stone-700 space-y-1.5 list-disc list-inside">
                  {sessionCompletedResult.growthAreas.map((g, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Next Recommended Step Actions */}
          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleStartSession('mastery_retest')}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retest Again</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/student/learn/${sessionCompletedResult.topicId}`}
                className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Review Learning Unit</span>
              </Link>

              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Continue to Next Weak Topic</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

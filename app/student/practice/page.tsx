'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { questionService } from '@/services/question/question.service';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { MCQ } from '@/components/common/MCQ';
import { AdaptivePracticeArena } from '@/components/adaptive/AdaptivePracticeArena';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useExam } from '@/lib/context/exam-context';
import { examConfigService } from '@/services/exam/exam-config.service';
import type {
  Question,
  DifficultyLevel,
  QuestionAttempt,
  ExamType,
  SubmitAnswerResult,
} from '@/types';
import {
  Sparkles,
  BookOpen,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Layers,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Target,
} from 'lucide-react';

export default function PracticeArenaPage() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const currentStudentId = profile?.id || '00000000-0000-0000-0000-000000000001';

  // URL Query Params
  const queryTopicId = searchParams.get('topicId') || 'topic-phy-centripetal-force';
  const queryMode = searchParams.get('mode') === 'bank' ? 'bank' : 'adaptive';

  // Primary Mode Switch: 'adaptive' (Weak Topic Practice & Retest Loop) vs 'bank' (Manual Question Bank Explorer)
  const [arenaMode, setArenaMode] = useState<'adaptive' | 'bank'>(queryMode);

  // Filters State for Manual Bank
  const { selectedExam, setSelectedExam } = useExam();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(queryTopicId || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('all');

  // Curriculum Data
  const subjects = useMemo(
    () => curriculumService.getSubjectsForExamSync(selectedExam),
    [selectedExam]
  );

  // Derived effective filters that stay consistent with current exam
  const effectiveSubjectId =
    selectedSubjectId === 'all' || examConfigService.isSubjectAllowed(selectedSubjectId, selectedExam)
      ? selectedSubjectId
      : 'all';

  // Queue & Active Question State for Manual Bank
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [attemptsHistory, setAttemptsHistory] = useState<QuestionAttempt[]>(() =>
    questionService.getStudentAttemptsSync(currentStudentId, { limit: 10 })
  );

  const availableTopics = useMemo(() => {
    if (effectiveSubjectId === 'all') {
      const allowedSubjectIds = subjects.map((s) => s.id);
      return curriculumService.getAllTopics().filter((t) => allowedSubjectIds.includes(t.subjectId));
    }
    return curriculumService.getTopicsForSubject(effectiveSubjectId);
  }, [effectiveSubjectId, subjects]);

  const effectiveTopicId = useMemo(() => {
    if (selectedTopicId === 'all') return 'all';
    return availableTopics.some((t) => t.id === selectedTopicId) ? selectedTopicId : 'all';
  }, [selectedTopicId, availableTopics]);

  const availableSkills = useMemo(() => {
    if (effectiveTopicId !== 'all') {
      return curriculumService.getSkillsForTopic(effectiveTopicId);
    }
    if (effectiveSubjectId !== 'all') {
      return curriculumService.getSkillsForSubject(effectiveSubjectId);
    }
    return curriculumService.getAllSkills();
  }, [effectiveSubjectId, effectiveTopicId]);

  const effectiveSkillId = useMemo(() => {
    if (selectedSkillId === 'all') return 'all';
    return availableSkills.some((sk) => sk.id === selectedSkillId) ? selectedSkillId : 'all';
  }, [selectedSkillId, availableSkills]);

  // Compute Questions according to filters
  const questionsQueue = useMemo(() => {
    let questions: Question[] = [];

    // Filter by Topic specifically if selected
    if (effectiveTopicId !== 'all') {
      questions = questionService.getQuestionsByTopicSync(effectiveTopicId, {
        difficulty: selectedDifficulty !== 'all' ? (selectedDifficulty as DifficultyLevel) : undefined,
        skillId: effectiveSkillId !== 'all' ? effectiveSkillId : undefined,
      });
    } else if (effectiveSkillId !== 'all') {
      questions = questionService.getQuestionsBySkillSync(effectiveSkillId, {
        difficulty: selectedDifficulty !== 'all' ? (selectedDifficulty as DifficultyLevel) : undefined,
      });
    } else if (selectedDifficulty !== 'all') {
      questions = questionService.getQuestionsByDifficultySync(
        selectedDifficulty as DifficultyLevel
      );
    } else {
      // Default: randomized set for current exam
      questions = questionService.getRandomPracticeQuestionsSync({
        examType: selectedExam,
        subjectId: effectiveSubjectId !== 'all' ? effectiveSubjectId : undefined,
        limit: 15,
      });
    }

    // Secondary filtering by subject and exam if not already constrained
    if (effectiveSubjectId !== 'all') {
      questions = questions.filter((q) => q.subjectId === effectiveSubjectId);
    }
    questions = questions.filter(
      (q) => q.applicableExams.includes(selectedExam) && examConfigService.isSubjectAllowed(q.subjectId, selectedExam)
    );

    // If user randomized set, trigger shuffle
    if (randomSeed > 0) {
      return [...questions].sort((a, b) => (a.id.localeCompare(b.id) ^ randomSeed) ? -1 : 1);
    }

    return questions;
  }, [
    selectedExam,
    effectiveSubjectId,
    effectiveTopicId,
    selectedDifficulty,
    effectiveSkillId,
    randomSeed,
  ]);

  // Reset index when filter changes if needed
  const safeCurrentIndex = Math.min(currentIndex, Math.max(0, questionsQueue.length - 1));

  // Handlers
  const handleRandomizeSet = () => {
    setRandomSeed((prev) => prev + 1);
    setCurrentIndex(0);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questionsQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Refresh or loop
      setCurrentIndex(0);
    }
  };

  const handleAttemptRecorded = () => {
    setAttemptsHistory(
      questionService.getStudentAttemptsSync(currentStudentId, { limit: 10 })
    );
  };

  const activeQuestion = questionsQueue[safeCurrentIndex];

  return (
    <div className="w-full space-y-6">
      {/* Top Breadcrumb & Hero Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <Link
                href="/student"
                className="hover:text-emerald-700 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Student Portal</span>
              </Link>
              <span>/</span>
              <span className="text-stone-900 font-semibold">Question Practice Arena</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              High-Yield Practice & Question Engine
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Practice official-standard MCQs filtered by topic, difficulty, and skill with instant telemetry and comprehensive explanations.
            </p>
          </div>

          {/* Exam Selector Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-semibold text-stone-500">Exam Track:</span>
            <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedExam('ECAT')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedExam === 'ECAT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ECAT
              </button>
              <button
                type="button"
                onClick={() => setSelectedExam('MDCAT')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedExam === 'MDCAT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                MDCAT
              </button>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 pt-4 mt-4 border-t border-stone-200 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setArenaMode('adaptive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition whitespace-nowrap ${
              arenaMode === 'adaptive'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>⚡ Adaptive Practice & Retest Engine</span>
            <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded font-mono">
              Primary Flow
            </span>
          </button>

          <button
            type="button"
            onClick={() => setArenaMode('bank')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition whitespace-nowrap ${
              arenaMode === 'bank'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Filter className="w-4 h-4 text-emerald-500" />
            <span>Manual Question Bank Filters</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="w-full">
        <ErrorBoundary
          resetKey={arenaMode}
          title="Practice Engine Error"
          fallbackMessage="An unexpected issue occurred while loading this practice session. Click Try Again to reload questions."
        >
          {arenaMode === 'adaptive' ? (
          <AdaptivePracticeArena
            initialTopicId={queryTopicId}
            initialExamType={selectedExam}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLS: Question Arena */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filter Bar Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                    <Filter className="w-4 h-4 text-emerald-600" />
                    <span>Question Bank Filters</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRandomizeSet}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Randomize 10 Questions</span>
                  </button>
                </div>

              {/* Filter Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Subject */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-600">Subject</label>
                  <select
                    value={effectiveSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedTopicId('all');
                      setSelectedSkillId('all');
                    }}
                    className="w-full p-2 rounded-lg border border-stone-300 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-600">Topic</label>
                  <select
                    value={effectiveTopicId}
                    onChange={(e) => {
                      setSelectedTopicId(e.target.value);
                      setSelectedSkillId('all');
                    }}
                    className="w-full p-2 rounded-lg border border-stone-300 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">All Topics</option>
                    {availableTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-600">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="exam_level">Exam Level</option>
                  </select>
                </div>

                {/* Skill */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-600">Specific Skill</label>
                  <select
                    value={effectiveSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">All Skills</option>
                    {availableSkills.map((sk) => (
                      <option key={sk.id} value={sk.id}>
                        {sk.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Question Card Display */}
            {activeQuestion ? (
              <div className="space-y-3">
                {/* Queue Progress Bar */}
                <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                  <span>
                    Question <strong className="text-stone-900">{safeCurrentIndex + 1}</strong> of{' '}
                    <strong className="text-stone-900">{questionsQueue.length}</strong>
                  </span>
                  <span>{questionsQueue.length - safeCurrentIndex - 1} remaining in queue</span>
                </div>

                {/* Reusable MCQ Component */}
                <MCQ
                  key={activeQuestion.id}
                  question={activeQuestion}
                  studentId={currentStudentId}
                  sourceContext="practice"
                  onAttemptRecorded={handleAttemptRecorded}
                  onNext={handleNextQuestion}
                />
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-xs space-y-3">
                <HelpCircle className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">No Questions Match These Filters</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Try broadening your search criteria or switch to another subject/topic to explore more practice questions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId('all');
                    setSelectedTopicId('all');
                    setSelectedDifficulty('all');
                    setSelectedSkillId('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COL: Telemetry & Attempts History */}
          <div className="space-y-6">
            {/* Quick Engine Telemetry */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Session Telemetry</span>
                </div>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                  Live Sync Active
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-xl font-extrabold text-stone-900">
                    {attemptsHistory.length}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">Recorded Attempts</div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-xl font-extrabold text-emerald-600">
                    {attemptsHistory.filter((a) => a.isCorrect).length}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">Correct Answers</div>
                </div>
              </div>

              {/* Duplicate Prevention Guarantee */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-stone-800 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Idempotency & Duplicate Guard</span>
                </div>
                <p className="text-stone-500 text-[11px] leading-relaxed">
                  Every submission generates a cryptographic client token. Double-clicks or re-submissions never double-record marks or skew mastery metrics.
                </p>
              </div>
            </div>

            {/* Recent Attempts History */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span>Recent Question Attempts</span>
                </div>
                <span className="text-xs text-stone-400 font-mono">
                  {attemptsHistory.length} total
                </span>
              </div>

              {attemptsHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No attempts recorded yet. Answer your first question!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {attemptsHistory.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/70 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {att.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-stone-800 font-mono text-[11px]">
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
                          att.isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
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
      )}
        </ErrorBoundary>
      </div>
    </div>
  );
}

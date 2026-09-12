'use client';

import React, { useState } from 'react';
import {
  Layers,
  Database,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Atom,
  FlaskConical,
  Binary,
  Dna,
  BrainCircuit,
  Sliders,
  Shield,
  FileCode,
  GraduationCap,
  HelpCircle,
  Clock,
  Zap,
} from 'lucide-react';
import type { ExamType } from '@/types';
import { useExam } from '@/lib/context/exam-context';
import { SEED_EXAMS, SEED_SUBJECTS, SEED_EXAM_SUBJECT_MAPPINGS, SEED_QUESTIONS } from '@/database/seed-data';

export function ArchitectureInspector() {
  const { selectedExam, setSelectedExam } = useExam();
  const [activeTab, setActiveTab] = useState<'loop' | 'curriculum' | 'questions' | 'schema' | 'services'>('loop');

  const currentExam = SEED_EXAMS.find((e) => e.code === selectedExam);
  const examMappings = SEED_EXAM_SUBJECT_MAPPINGS.filter(
    (m) => m.examId === currentExam?.id
  );

  const loopSteps = [
    { step: '1', title: 'Student', desc: 'Auth & Profile with Target Exam (ECAT/MDCAT)' },
    { step: '2', title: 'Diagnostic', desc: 'Baseline Assessment with timed MCQs & penalties' },
    { step: '3', title: 'Weakness Detection', desc: 'Granular topic & skill accuracy analysis' },
    { step: '4', title: 'Personalized Plan', desc: 'AI-prioritized study agenda and time allocation' },
    { step: '5', title: 'Learning Unit', desc: 'Reusable topic module with formulas & pitfalls' },
    { step: '6', title: 'Adaptive Practice', desc: 'Difficulty-calibrated questions & hints' },
    { step: '7', title: 'AI Tutor', desc: 'Socratic dialogue isolating misconceptions' },
    { step: '8', title: 'Retest', desc: 'Targeted verification quizzes' },
    { step: '9', title: 'Updated Mastery', desc: 'Real-time Novice → Mastered state transitions' },
    { step: '10', title: 'Progress', desc: 'Projected percentile & readiness analytics' },
  ];

  const getSubjectIcon = (code: string) => {
    switch (code) {
      case 'PHY':
        return <Atom className="w-5 h-5 text-blue-600" />;
      case 'CHEM':
        return <FlaskConical className="w-5 h-5 text-emerald-600" />;
      case 'ENG':
        return <BookOpen className="w-5 h-5 text-purple-600" />;
      case 'MATH':
        return <Binary className="w-5 h-5 text-amber-600" />;
      case 'BIO':
        return <Dna className="w-5 h-5 text-pink-600" />;
      case 'LOGIC':
        return <BrainCircuit className="w-5 h-5 text-cyan-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-stone-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Architecture Summary Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Hackathon MVP Foundation Established
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3">
            Adaptive CrackIt.ai Architecture
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
            Foundation established with strict TypeScript domain types, data-driven curriculum engine sharing Physics, Chemistry, and English across ECAT and MDCAT, isolated Gemini AI services, and production-grade PostgreSQL Supabase schema with Row Level Security.
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-xs text-stone-400 block">Domain Entities</span>
              <span className="text-lg font-bold text-white">18 Typed</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-xs text-stone-400 block">Shared Subjects</span>
              <span className="text-lg font-bold text-emerald-400">Physics, Chem, Eng</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-xs text-stone-400 block">Database Tables</span>
              <span className="text-lg font-bold text-teal-400">18 RLS Schema</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-xs text-stone-400 block">AI Layer</span>
              <span className="text-lg font-bold text-white">Server Isolated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setActiveTab('loop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'loop'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Core Product Loop (10 Steps)
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'curriculum'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Data-Driven Curriculum (ECAT vs MDCAT)
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'questions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Question Engine (Module 03)
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'schema'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <Database className="w-4 h-4" />
          PostgreSQL & Supabase RLS
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'services'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI Services & Security
        </button>
      </div>

      {/* Tab 1: Core Product Loop */}
      {activeTab === 'loop' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900">The 10-Phase Adaptive Learning Loop</h2>
              <p className="text-sm text-stone-500">
                End-to-end telemetry architecture mapping every user milestone to state changes.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Architecturally Wired
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {loopSteps.map((item, index) => (
              <div
                key={item.step}
                className="relative bg-stone-50 hover:bg-stone-100/80 transition-colors border border-stone-200 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    {index < loopSteps.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-stone-400 hidden lg:block" />
                    )}
                  </div>
                  <h3 className="font-semibold text-stone-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Data-Driven Curriculum & Shared Subject Architecture */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Shared Subject & Exam Mapping Engine
                </h2>
                <p className="text-sm text-stone-500">
                  Demonstrating rule 12 & 13: ECAT and MDCAT dynamically share Physics, Chemistry, and English without hard-coding subjects.
                </p>
              </div>

              {/* Exam Selector */}
              <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start">
                <button
                  onClick={() => setSelectedExam('ECAT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedExam === 'ECAT'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  UET ECAT (Engineering)
                </button>
                <button
                  onClick={() => setSelectedExam('MDCAT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedExam === 'MDCAT'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  PMDC MDCAT (Medical)
                </button>
              </div>
            </div>

            {/* Exam Details Card */}
            {currentExam && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-stone-500 block">Total Marks:</span>
                    <span className="font-bold text-stone-900 text-sm">{currentExam.totalMarks} Marks</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Duration:</span>
                    <span className="font-bold text-stone-900 text-sm">{currentExam.durationMinutes} Minutes</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Marking Rules:</span>
                    <span className="font-bold text-stone-900 text-sm">
                      {currentExam.negativeMarking ? `+4 Correct, -${currentExam.negativeMarkingPenalty} Penalty` : '+1 Correct, 0 Penalty'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Passing Benchmark:</span>
                    <span className="font-bold text-stone-900 text-sm">{currentExam.passingPercentage}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Subject Distribution for Selected Exam */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Configured Subjects for {selectedExam}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {examMappings.map((map) => {
                  const subj = SEED_SUBJECTS.find((s) => s.id === map.subjectId);
                  const isShared = ['PHY', 'CHEM', 'ENG'].includes(subj?.code || '');
                  return (
                    <div
                      key={map.id}
                      className="border border-stone-200 rounded-xl p-4 bg-white hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                            {getSubjectIcon(subj?.code || '')}
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-900 text-sm">{subj?.name}</h4>
                            <span className="text-xs text-stone-500">{subj?.code}</span>
                          </div>
                        </div>
                        {isShared ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Shared Subject
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Exam Specific
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-2 mb-3">
                        {subj?.description}
                      </p>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 text-stone-500 font-medium">
                        <span>{map.questionCount} Questions</span>
                        <span className="text-emerald-700 font-bold">{map.weightPercentage}% Weight</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reusable Learning Unit Contract Showcase */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-stone-900 text-base">
                Reusable Learning Unit Architecture (Rule 15)
              </h3>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Every topic in the curriculum dynamically renders into a standardized, pedagogical Learning Unit format containing concepts, formulas, and pitfalls:
            </p>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs font-mono text-stone-800 space-y-1 overflow-x-auto">
              <div><span className="text-emerald-700 font-bold">interface LearningUnit</span> &#123;</div>
              <div className="pl-4">id: <span className="text-purple-600">string</span>;</div>
              <div className="pl-4">topicId: <span className="text-purple-600">string</span>; <span className="text-stone-400">{'// Reusable for ANY topic'}</span></div>
              <div className="pl-4">title: <span className="text-purple-600">string</span>;</div>
              <div className="pl-4">summary: <span className="text-purple-600">string</span>;</div>
              <div className="pl-4">keyConcepts: <span className="text-purple-600">string[]</span>;</div>
              <div className="pl-4">keyFormulas: <span className="text-purple-600">string[]</span>;</div>
              <div className="pl-4">commonPitfalls: <span className="text-purple-600">string[]</span>;</div>
              <div className="pl-4">estimatedMinutes: <span className="text-amber-600">number</span>;</div>
              <div className="pl-4">recommendedPracticeQuestionIds: <span className="text-purple-600">string[]</span>;</div>
              <div>&#125;</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Question Engine (Module 03) */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Question Engine Architecture (Module 03)
              </h2>
              <p className="text-sm text-stone-500">
                Data-driven question bank, normalized MCQ options, idempotent attempt recording, and step-by-step explanations.
              </p>
            </div>
            <a
              href="/student/practice"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
            >
              <span>Launch Practice Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Entity 1: questions */}
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">public.questions</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Core Bank
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Curriculum-linked questions supporting text, topic, skill, LO, difficulty, source, and lifecycle status.
              </p>
              <div className="text-[11px] text-stone-500 space-y-1 pt-1 border-t border-stone-200">
                <div>• <strong>Difficulties:</strong> easy, medium, hard, exam_level</div>
                <div>• <strong>Statuses:</strong> draft, review, approved, archived</div>
                <div>• <strong>Timing:</strong> estimated_time_seconds</div>
              </div>
            </div>

            {/* Entity 2: question_options */}
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">public.question_options</span>
                <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                  Normalized
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Supports options A, B, C, D with individual distractor explanations, ordering, and correctness flags.
              </p>
              <div className="text-[11px] text-stone-500 space-y-1 pt-1 border-t border-stone-200">
                <div>• <strong>option_key:</strong> A, B, C, D</div>
                <div>• <strong>explanation:</strong> distractor breakdown</div>
                <div>• <strong>Foreign Key:</strong> questions(id) ON DELETE CASCADE</div>
              </div>
            </div>

            {/* Entity 3: question_attempts */}
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">public.question_attempts</span>
                <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                  Telemetry & RLS
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Student attempts recording selected answer, correctness, time spent, confidence, and duplicate guard.
              </p>
              <div className="text-[11px] text-stone-500 space-y-1 pt-1 border-t border-stone-200">
                <div>• <strong>Confidence:</strong> low, medium, high</div>
                <div>• <strong>client_token:</strong> Idempotent double-click guard</div>
                <div>• <strong>Context:</strong> practice, diagnostic, mock_exam</div>
              </div>
            </div>
          </div>

          {/* Engine Capabilities */}
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Verified Question Engine Capabilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1. Filter by Topic</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>2. Filter by Difficulty</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>3. Filter by Skill</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>4. Randomized Practice</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>5. Record Attempts & Time</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>6. Duplicate Guard (client_token)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>7. Step-by-Step Explanations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>8. Student Attempt History</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Schema & Database */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                PostgreSQL & Supabase Migration Architecture
              </h2>
              <p className="text-sm text-stone-500">
                Full relational integrity with foreign keys, compound indexes, and Row Level Security (RLS).
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              SQL Migration Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                1. Core Entities
              </h4>
              <ul className="text-xs space-y-1.5 text-stone-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">profiles</span> (auth.users extension)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">exams</span> (ECAT, MDCAT)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">subjects</span> & <span className="font-mono">exam_subjects</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">chapters</span>, <span className="font-mono">topics</span>, <span className="font-mono">subtopics</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">learning_units</span> (1:1 per topic)
                </li>
              </ul>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                2. Assessment & Questions
              </h4>
              <ul className="text-xs space-y-1.5 text-stone-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">questions</span> (Universal bank)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">question_attempts</span> (Fine telemetry)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">diagnostics</span> & <span className="font-mono">diagnostic_attempts</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">mock_exams</span> & <span className="font-mono">mock_attempts</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">topic_masteries</span> (Adaptive engine)
                </li>
              </ul>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                3. Tutoring & Adaptation
              </h4>
              <ul className="text-xs space-y-1.5 text-stone-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">study_plans</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">study_plan_items</span> (Ranked queue)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">tutor_sessions</span> (Interactive logs)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">Row Level Security</span> enabled on all student tables
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-stone-900 rounded-xl p-4 text-stone-300 text-xs font-mono">
            <div className="text-emerald-400 mb-1">-- Migration location:</div>
            <div>/supabase/migrations/20260910000000_initial_schema.sql</div>
          </div>
        </div>
      )}

      {/* Tab 4: AI Services & Security */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                AI Service Layer Isolation & Security Boundaries
              </h2>
              <p className="text-sm text-stone-500">
                Complying with rules 8, 9, 10 & 16: AI & secret keys are strictly isolated server-side.
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-medium">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              Zero Browser Secret Leakage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
              <div className="flex items-center gap-2 mb-2 font-bold text-stone-900 text-sm">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Gemini AI Service Interface
              </div>
              <p className="text-xs text-stone-600 mb-3">
                All Gemini interactions run through <code className="text-stone-800 font-mono bg-stone-200/60 px-1 py-0.5 rounded">services/ai/gemini.service.ts</code> with lazy initialization and structured JSON outputs:
              </p>
              <ul className="text-xs space-y-1.5 text-stone-700">
                <li>• <strong>analyzeDiagnosticWeaknesses</strong>: Detects gaps & sets severity</li>
                <li>• <strong>generatePersonalizedStudyPlan</strong>: Balances hours/week</li>
                <li>• <strong>chatWithAiTutor</strong>: Socratic tutor for ECAT/MDCAT concepts</li>
                <li>• <strong>explainQuestionStepByStep</strong>: Deconstructs past paper questions</li>
              </ul>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
              <div className="flex items-center gap-2 mb-2 font-bold text-stone-900 text-sm">
                <FileCode className="w-4 h-4 text-blue-600" />
                Supabase Client / Server Split
              </div>
              <p className="text-xs text-stone-600 mb-3">
                Strict separation of browser and server access:
              </p>
              <ul className="text-xs space-y-1.5 text-stone-700">
                <li>• <code className="font-mono text-stone-800">lib/supabase/client.ts</code>: Browser client with Anon Key & RLS</li>
                <li>• <code className="font-mono text-stone-800">lib/supabase/server.ts</code>: Server client with cookie session handling</li>
                <li>• <code className="font-mono text-stone-800">lib/supabase/admin.ts</code>: Protected by <code className="font-mono text-rose-700">server-only</code>, prevents service role leakage</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Header } from '@/components/common/Header';
import { ArchitectureInspector } from '@/components/common/ArchitectureInspector';
import { useAuth } from '@/lib/auth/auth-context';
import { useExam } from '@/lib/context/exam-context';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Target,
  Brain,
  Layers,
  BookOpen,
  Calendar,
  AlertCircle,
  Database,
  Lock,
  Key,
  ChevronDown,
  ChevronUp,
  Users,
  Atom,
  FlaskConical,
  Binary,
  Dna,
  BrainCircuit,
  Zap,
  TrendingUp,
  BarChart3,
  Bot,
  HelpCircle,
  Check,
  Award,
} from 'lucide-react';
import Link from 'next/link';

function HomePageContent() {
  const {
    user,
    profile,
    isDemo,
    isAdmin,
    isLoading,
    error,
    signInWithGoogle,
    signInWithDemo,
    signInWithDemoAdmin,
    signInWithDemoParent,
    signOut,
    clearError,
  } = useAuth();
  const { selectedExam, setSelectedExam } = useExam();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dismissNotice, setDismissNotice] = useState<boolean>(false);
  const [dismissCallbackError, setDismissCallbackError] = useState<boolean>(false);
  const [showArchInspector, setShowArchInspector] = useState<boolean>(false);
  const [activeLoopStep, setActiveLoopStep] = useState<number>(0);

  const authRequiredNotice = !dismissNotice && searchParams.get('auth_required') === 'true';
  const rawAuthError = searchParams.get('auth_error');
  const callbackError = !dismissCallbackError && rawAuthError ? decodeURIComponent(rawAuthError) : null;

  const handleGoogleClick = async () => {
    clearError();
    await signInWithGoogle();
  };

  const handleDemoClick = async () => {
    clearError();
    await signInWithDemo('student');
    router.push('/student');
  };

  const handleDemoAdminClick = async () => {
    clearError();
    await signInWithDemoAdmin();
    router.push('/admin');
  };

  const handleDemoParentClick = async () => {
    clearError();
    await signInWithDemoParent();
    router.push('/parent');
  };

  const isEcat = selectedExam === 'ECAT';

  const loopPhases = [
    {
      id: 'diagnose',
      step: '01',
      title: 'Diagnose Baseline',
      subtitle: 'Timed multi-subject drill',
      description: 'Pinpoints exact starting accuracy and pacing under real exam constraints with realistic negative marking penalty calculation (+4 / -1).',
      badge: 'Speed Drill',
      icon: Target,
      color: 'emerald',
    },
    {
      id: 'detect',
      step: '02',
      title: 'Detect Weakness',
      subtitle: 'Skill-level gap isolation',
      description: 'Algorithmic classification sorts syllabus gaps into Critical, Moderate, and Minor severities based on historical yield and question accuracy.',
      badge: 'Gap Matrix',
      icon: AlertCircle,
      color: 'amber',
    },
    {
      id: 'plan',
      step: '03',
      title: 'Personalized Plan',
      subtitle: 'Dynamic recovery sprint',
      description: 'Generates a tailored daily study plan prioritizing high-ROI chapters and estimated study minutes to maximize score velocity.',
      badge: 'Study Sprint',
      icon: Calendar,
      color: 'blue',
    },
    {
      id: 'tutor',
      step: '04',
      title: 'Learn & AI Tutor',
      subtitle: 'Concept review & Socratic help',
      description: 'Review focused formulas, common exam traps, and engage in multi-turn Socratic reasoning with Gemini 2.5 when stuck on tricky derivations.',
      badge: 'Socratic AI',
      icon: Bot,
      color: 'purple',
    },
    {
      id: 'mastery',
      step: '05',
      title: 'Practice & Retest',
      subtitle: 'Continuous mastery ladder',
      description: 'Targeted verification quizzes advance your mastery from Novice → Developing → Proficient → Mastered with projected percentile tracking.',
      badge: 'Mastery',
      icon: TrendingUp,
      color: 'emerald',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Header />

      {/* Notifications / Auth Errors */}
      {(authRequiredNotice || callbackError || error) && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">
                  {authRequiredNotice
                    ? 'Authentication Required'
                    : 'Authentication Notice'}
                </span>
                <p className="text-amber-800">
                  {authRequiredNotice
                    ? 'Student areas are strictly protected. Please continue with Google or enter with One-Click Demo.'
                    : callbackError || error}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setDismissNotice(true);
                setDismissCallbackError(true);
                clearError();
              }}
              className="text-amber-700 hover:text-amber-900 font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION (Product Experience First) */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12 space-y-10">
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          {/* Exam Track Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Targeted for {selectedExam === 'ECAT' ? 'UET ECAT Engineering' : 'PMDC MDCAT Medical'} 2026</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-tight">
            CrackIt.ai
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl font-serif text-emerald-800 italic font-medium">
            &ldquo;Diagnose. Learn. Practice. Improve.&rdquo;
          </p>

          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
            The intelligent entrance test preparation platform designed specifically for competitive admissions in Pakistan. Identify syllabus blind spots, follow an adaptive high-yield study plan, and master tough concepts with a step-by-step Socratic AI tutor.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {user || isDemo ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/student"
                  id="landing-portal-cta"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Enter Student Portal</span>
                  {isDemo && (
                    <span className="text-[10px] bg-amber-400 text-stone-950 px-1.5 py-0.5 rounded font-bold">
                      Demo
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    id="landing-admin-cta"
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-amber-500/15 text-amber-900 border border-amber-300 font-bold text-sm hover:bg-amber-500/25 transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Admin CMS</span>
                  </Link>
                )}

                <button
                  onClick={() => signOut()}
                  className="w-full sm:w-auto px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-stone-700 font-semibold text-sm hover:bg-stone-100 transition"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <>
                {/* 1. Continue with Google */}
                <button
                  onClick={handleGoogleClick}
                  disabled={isLoading}
                  id="landing-google-signin-btn"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white border border-stone-300 text-stone-800 font-semibold text-sm hover:bg-stone-50 hover:border-stone-400 active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-3"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* 2. Try Demo (Student Experience) */}
                <button
                  onClick={handleDemoClick}
                  disabled={isLoading}
                  id="landing-try-demo-btn"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 active:scale-[0.99] transition shadow-sm flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
                  <span>Student Demo</span>
                  <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded font-mono text-emerald-100">
                    1-Click
                  </span>
                </button>

                {/* 3. Parent Portal */}
                <button
                  onClick={handleDemoParentClick}
                  disabled={isLoading}
                  id="landing-try-parent-btn"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm hover:bg-indigo-100 active:scale-[0.99] transition shadow-sm flex items-center justify-center gap-2 border border-indigo-200 group"
                >
                  <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span>Parent Portal</span>
                  <span className="text-[10px] bg-indigo-200/60 text-indigo-800 border border-indigo-300 px-1.5 py-0.5 rounded font-mono">
                    Guardian
                  </span>
                </button>

                {/* 4. Demo Admin CMS */}
                <button
                  onClick={handleDemoAdminClick}
                  disabled={isLoading}
                  id="landing-try-admin-btn"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-stone-900 text-amber-300 font-semibold text-sm hover:bg-stone-800 active:scale-[0.99] transition shadow-sm flex items-center justify-center gap-2 border border-amber-500/30 group"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Admin CMS</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                    Staff
                  </span>
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-stone-400">
            Select <strong className="text-stone-700 font-semibold">&ldquo;Student Demo&rdquo;</strong> to test the diagnostic, study plan, & Socratic tutor immediately.
          </p>
        </div>

        {/* 2. EXAM TRACK SELECTOR & SUBJECT OVERVIEW */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Exam Track Customization
              </span>
              <h2 className="text-xl font-bold text-stone-900 mt-1">
                Tailored for Pakistan&apos;s Most Competitive Entrance Exams
              </h2>
            </div>
            {/* Exam Toggle Buttons */}
            <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl border border-stone-200 text-xs font-bold shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setSelectedExam('ECAT')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                  isEcat
                    ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>UET ECAT</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${isEcat ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                  400 Marks
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedExam('MDCAT')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                  !isEcat
                    ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>PMDC MDCAT</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${!isEcat ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                  200 Marks
                </span>
              </button>
            </div>
          </div>

          {/* Subject Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isEcat ? (
              <>
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Binary className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">30% (120 M)</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">Mathematics</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Calculus, integration, conic sections, trigonometric identities, vectors, and matrices.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Atom className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">30% (120 M)</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">Physics</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Rotational dynamics, electrostatics, electromagnetic induction, wave optics, & thermodynamics.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">30% (120 M)</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">Chemistry</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Reaction kinetics, chemical equilibria, Le Chatelier shifts, organic mechanisms, & thermochemistry.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">10% (40 M)</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">English Comprehension</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Subject-verb concord, conditional clause rules, high-frequency lexicon, & sentence synthesis.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                      <Dna className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-pink-800 bg-pink-100 px-2 py-0.5 rounded-full">34% (68 M)</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">Biology</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Cell structure, bioenergetics, Mendelian genetics, human physiology, nervous coordination, & biotechnology.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">27% (54 M)</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">Chemistry</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Physical chemistry, organic reaction mechanisms, functional groups, atomic structure, & acid-base equilibria.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Atom className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">27% (54 M)</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">Physics</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Force and motion, work & energy, waves and sound, current electricity, electromagnetism, & nuclear physics.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">12% (24 M)</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">English & Logical Reasoning</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Critical deduction, syllogisms, pattern series, cause & effect, and grammar analysis.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. THE CONTINUOUS LEARNING LOOP */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Pedagogical Loop
              </span>
              <h2 className="text-xl font-bold text-stone-900 mt-0.5">
                The Complete 5-Step Mastery Cycle
              </h2>
            </div>
            <span className="text-xs text-stone-500 font-mono">
              Diagnose → Detect → Plan → Learn → Retest
            </span>
          </div>

          {/* Interactive Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {loopPhases.map((phase, idx) => {
              const IconComp = phase.icon;
              const isSelected = activeLoopStep === idx;
              return (
                <button
                  key={phase.id}
                  onClick={() => setActiveLoopStep(idx)}
                  className={`text-left p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100/80'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {phase.step}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-emerald-200/70 text-emerald-900' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {phase.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-xs sm:text-sm">{phase.title}</h3>
                      <p className="text-[11px] text-stone-500 mt-0.5">{phase.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 mt-3 line-clamp-3 leading-relaxed">
                    {phase.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. PRODUCT / DASHBOARD PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Topic Mastery Engine Teaser */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Adaptive Intelligence
                </span>
                <span className="text-xs font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 font-semibold">
                  Live Mastery Tracker
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                Granular Syllabus Mastery States
              </h3>
              <p className="text-xs text-stone-500">
                Topics dynamically advance across 4 proficiency tiers as you answer calibrated questions correctly.
              </p>
            </div>

            {/* Simulated Live Mastery List */}
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {isEcat ? 'Rotational Dynamics & Moment of Inertia' : 'Cell Structure & Organelle Function'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      Proficient (78%)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                    {isEcat ? 'Physics • Angular Momentum & Rolling' : 'Biology • Membrane Transport & Ultrastructure'}
                  </p>
                </div>
                <div className="w-16 text-right shrink-0">
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '78%' }} />
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">14/18 MCQs</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {isEcat ? 'Chemical Equilibrium & Le Chatelier Shifts' : 'Enzymes, Catalysis & Bioenergetics'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                      Needs Review (42%)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                    {isEcat ? 'Chemistry • Pressure & Temperature Shifts' : 'Biology • Competitive vs Non-Competitive'}
                  </p>
                </div>
                <div className="w-16 text-right shrink-0">
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '42%' }} />
                  </div>
                  <span className="text-[10px] text-amber-600 font-mono font-semibold">Priority #1</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {isEcat ? 'Integration & Area Under the Curve' : 'Categorical Syllogisms & Venn Logic'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      Mastered (94%)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                    {isEcat ? 'Mathematics • Substitution & Parts' : 'Logical Reasoning • Deduction Rules'}
                  </p>
                </div>
                <div className="w-16 text-right shrink-0">
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '94%' }} />
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">Streak: 6</span>
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Adaptive difficulty calibration
              </span>
              <button
                onClick={handleDemoClick}
                className="text-emerald-700 font-bold hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Explore Full Tracker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Socratic AI Tutor Dialogue Preview */}
          <div className="lg:col-span-5 bg-stone-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Socratic AI Tutor
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 rounded-full text-stone-300">
                  Gemini 2.5
                </span>
              </div>
              <h3 className="text-base font-bold text-white pt-1">
                Step-by-Step Reasoning Coach
              </h3>
              <p className="text-xs text-stone-400">
                Never gives away the answer blindly. Guides you through the derivation like a top academy professor.
              </p>
            </div>

            {/* Chat bubbles preview */}
            <div className="space-y-2.5 text-xs">
              <div className="bg-stone-800/90 border border-stone-700/80 rounded-2xl p-3 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold">Student Query</span>
                <p className="text-stone-300">
                  &ldquo;Why does decreasing the container volume shift the Haber process equilibrium toward NH₃?&rdquo;
                </p>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-3 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Tutor Explanation
                </span>
                <p className="text-stone-300 leading-relaxed">
                  &ldquo;Consider Le Chatelier&apos;s principle. Decreasing volume increases total pressure. The system relieves pressure by shifting toward the side with fewer gas moles: N₂ + 3H₂ (4 moles) ⇌ 2NH₃ (2 moles).&rdquo;
                </p>
              </div>
            </div>

            <button
              onClick={handleDemoClick}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Test AI Tutor with Sample MCQs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. PRIMARY STUDENT CTA BANNER */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Start in 10 Seconds
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Ready to verify your {selectedExam} readiness?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              Take the 30-question diagnostic drill or explore the full interactive curriculum with pre-loaded demo mastery data.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={handleDemoClick}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-emerald-950 font-bold text-sm hover:bg-emerald-50 transition shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Launch Student Demo</span>
            </button>
            <button
              onClick={handleGoogleClick}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-emerald-900/60 text-white border border-emerald-500/40 font-semibold text-sm hover:bg-emerald-900 transition flex items-center justify-center gap-2"
            >
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>

        {/* 6. TECHNICAL ARCHITECTURE (Judge-Friendly Secondary Section) */}
        <div className="pt-6 border-t border-stone-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                  Technical Architecture
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                  For technical reviewers
                </span>
              </div>
              <p className="text-xs text-stone-500 max-w-2xl">
                Data-driven curriculum engine, Supabase PostgreSQL, Row Level Security, and isolated Gemini AI services.
              </p>
            </div>

            {/* Expand / Collapse Button */}
            <button
              onClick={() => setShowArchInspector(!showArchInspector)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-300 hover:border-stone-400 text-stone-800 text-xs font-semibold transition shadow-2xs self-start sm:self-auto"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{showArchInspector ? 'Hide technical details' : 'View technical details'}</span>
              {showArchInspector ? (
                <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              )}
            </button>
          </div>

          {/* High-Level Judge Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase PostgreSQL</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                18 relational tables with Row Level Security (RLS) ensuring strict multi-tenant student isolation.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <Brain className="w-4 h-4 text-purple-600" />
                <span>Gemini 2.5 AI Engine</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Server-side `@google/genai` integration for multi-turn Socratic dialogue and study plan heuristics.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Curriculum Hierarchy</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                7-tier unified syllabus (Exam → Subject → Chapter → Topic → Subtopic → Objective → Skill).
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Secure Demo Sandbox</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Zero-setup 1-click evaluation account with state isolation that never writes to live production tables.
              </p>
            </div>
          </div>

          {/* Collapsible Module 00 Architecture Inspector */}
          {showArchInspector && (
            <div className="border border-stone-200 bg-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    Module 00 Foundations
                  </span>
                  <h3 className="text-base font-bold text-stone-900 mt-0.5">
                    Foundational Curriculum & Schema Architecture
                  </h3>
                </div>
                <span className="text-xs font-mono text-stone-500">
                  Full System Verification
                </span>
              </div>

              <ArchitectureInspector />
            </div>
          )}
        </div>

        {/* 7. SECURE BY DESIGN (Compact Trust Section) */}
        <div className="bg-stone-100 border border-stone-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Secure by Design</h4>
                <p className="text-xs text-stone-500">Built with enterprise data isolation and security standards</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              RLS Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-stone-600">
            <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-stone-200/60">
              <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-900 block">Google OAuth + Supabase Auth</span>
                <span className="text-[11px] text-stone-500">Encrypted token validation & persistent HTTP-only cookies.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-stone-200/60">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-900 block">Row Level Security</span>
                <span className="text-[11px] text-stone-500">Students access only their own diagnostic results and progress.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-stone-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-900 block">Isolated Demo Sandbox</span>
                <span className="text-[11px] text-stone-500">One-click evaluation runs safely in an isolated state store.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        CrackIt.ai • Adaptive Preparation for ECAT & MDCAT • Hackathon MVP Foundation
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-stone-500 text-xs">
          Loading CrackIt.ai...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}


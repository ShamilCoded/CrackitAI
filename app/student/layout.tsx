'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  GraduationCap,
  LogOut,
  Sparkles,
  ShieldCheck,
  Flame,
  BookOpen,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Award,
  Users,
} from 'lucide-react';
import Link from 'next/link';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, isDemo, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !isDemo) {
      router.replace('/?auth_required=true');
    }
  }, [isLoading, user, isDemo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center animate-pulse shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-stone-900">Verifying Student Session</h3>
            <p className="text-xs text-stone-500">Checking authenticated credentials & RLS authorization...</p>
          </div>
          <div className="w-48 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-emerald-600 rounded-full animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user && !isDemo) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-md w-full shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-stone-900">Protected Student Area</h2>
            <p className="text-xs text-stone-600">
              This route is protected by Supabase Auth and Row Level Security. Unauthenticated users cannot access student records.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition shadow-sm"
            >
              <span>Return to Public Landing Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/student" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
                  CrackIt.ai
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 font-semibold">
                    Portal
                  </span>
                </span>
              </div>
            </Link>

            <span className="text-stone-300 hidden sm:inline">/</span>

            <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-stone-600 shrink-0">
              <Link
                href="/student"
                className="px-2.5 py-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition whitespace-nowrap"
              >
                Dashboard
              </Link>
              <Link
                href="/student/diagnostic"
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 transition flex items-center gap-1 font-semibold whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Diagnostic</span>
              </Link>
              <Link
                href="/student/mock-exam"
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 transition flex items-center gap-1 font-semibold whitespace-nowrap"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Mock Exam</span>
              </Link>
              <Link
                href="/student/curriculum"
                className="px-2.5 py-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition whitespace-nowrap"
              >
                Curriculum
              </Link>
              <Link
                href="/student/learn/topic-phy-kinematics"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 transition flex items-center gap-1 whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Learning Unit</span>
              </Link>
              <Link
                href="/student/practice"
                className="px-2.5 py-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition whitespace-nowrap"
              >
                Practice
              </Link>
              <Link
                href="/parent"
                id="student-nav-parent-link"
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 transition flex items-center gap-1 font-semibold whitespace-nowrap"
                title="Open read-focused parent portal"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Parent View</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  id="admin-cms-nav-link"
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-900 border border-amber-300/80 font-bold hover:bg-amber-500/25 transition flex items-center gap-1 whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Admin CMS</span>
                </Link>
              )}
            </nav>

            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{profile?.targetExam || 'ECAT'} {profile?.examYear || 2026}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            {isDemo && (
              <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium whitespace-nowrap shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-semibold hidden sm:inline">Demo Sandbox Active</span>
                <span className="font-semibold sm:hidden text-[11px]">Demo</span>
                <span className="text-[10px] hidden xl:inline text-amber-700">
                  (RLS-isolated)
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-stone-200 shrink-0">
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden shrink-0">
                {profile?.fullName ? profile.fullName.charAt(0) : 'S'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-stone-900 truncate max-w-[120px]">
                  {profile?.fullName || 'Student'}
                </span>
                <span className="text-[10px] text-stone-500 truncate max-w-[120px]">
                  {profile?.email || user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              id="student-logout-button"
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition whitespace-nowrap shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1 px-3 py-1.5 border-t border-stone-200 bg-stone-50/80 overflow-x-auto scrollbar-none text-xs font-semibold text-stone-600">
          <Link
            href="/student"
            className="px-2.5 py-1 rounded-md whitespace-nowrap hover:bg-stone-200 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/student/diagnostic"
            className="px-2.5 py-1 rounded-md whitespace-nowrap bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Diagnostic</span>
          </Link>
          <Link
            href="/student/mock-exam"
            className="px-2.5 py-1 rounded-md whitespace-nowrap bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1"
          >
            <Award className="w-3 h-3 text-amber-600" />
            <span>Mock Exam</span>
          </Link>
          <Link
            href="/student/curriculum"
            className="px-2.5 py-1 rounded-md whitespace-nowrap hover:bg-stone-200 transition"
          >
            Curriculum
          </Link>
          <Link
            href="/student/learn/topic-phy-kinematics"
            className="px-2.5 py-1 rounded-md whitespace-nowrap bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3 text-emerald-600" />
            <span>Learning Unit</span>
          </Link>
          <Link
            href="/student/practice"
            className="px-2.5 py-1 rounded-md whitespace-nowrap hover:bg-stone-200 transition"
          >
            Practice
          </Link>
          <Link
            href="/parent"
            className="px-2.5 py-1 rounded-md whitespace-nowrap bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1"
          >
            <Users className="w-3 h-3 text-indigo-600" />
            <span>Parent</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

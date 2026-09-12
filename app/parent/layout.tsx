'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  LogOut,
  ArrowLeft,
  UserCheck,
  Heart,
  Users,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, isDemo, isParent, signInWithDemoParent, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-900 dark:text-stone-100">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center animate-pulse shadow-lg shadow-indigo-600/20">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Verifying Parent Portal Authorization
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Securing student records and privacy safeguards...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ACCESS BARRIER FOR UNAUTHORIZED USERS (e.g. students or unauthenticated)
  if (!isParent) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 max-w-lg w-full shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Parent & Guardian Authorization Required
            </div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Parent Progress Portal
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              This dashboard is protected for parents and guardians to review aggregated syllabus progress,
              study consistency, and mock exam milestones while preserving student conversation privacy.
            </p>
          </div>

          {profile && (
            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="text-stone-600 dark:text-stone-400 font-medium flex items-center justify-between">
                <span>Active Account:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{profile.fullName}</span>
              </div>
              <div className="text-stone-600 dark:text-stone-400 font-medium flex items-center justify-between">
                <span>Current Role:</span>
                <span className="font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60">
                  {profile.role || 'student'}
                </span>
              </div>
              <div className="text-stone-600 dark:text-stone-400 font-medium flex items-center justify-between">
                <span>Account Email:</span>
                <span className="text-stone-600 dark:text-stone-400 truncate max-w-[200px]">{profile.email}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={async () => {
                await signInWithDemoParent();
                router.refresh();
              }}
              id="switch-demo-parent-btn"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20"
            >
              <UserCheck className="w-4 h-4" />
              <span>Switch to Demo Parent Persona (Testing Mode)</span>
            </button>

            <Link
              href="/student"
              id="return-student-portal-btn"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition border border-stone-200 dark:border-stone-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Student Learning Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col">
      {/* PARENT PORTAL TOP NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  CrackIt.ai
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
                  Parent Portal
                </span>
              </div>
              <div className="text-[11px] text-stone-600 dark:text-stone-400 hidden sm:block">
                Read-only student progress, mastery & consistency telemetry
              </div>
            </div>
          </div>

          {/* User Status & Navigation Actions */}
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden md:flex flex-col text-right text-xs">
                <span className="font-semibold text-stone-900 dark:text-stone-200">{profile.fullName}</span>
                <span className="text-stone-600 dark:text-stone-400 capitalize">{profile.role || 'Parent / Guardian'}</span>
              </div>
            )}

            <Link
              href="/student"
              id="parent-nav-student-portal-link"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition"
              title="Navigate to student learning view"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Student Portal</span>
            </Link>

            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              id="parent-logout-btn"
              title="Sign Out"
              className="p-2 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-6 px-4 sm:px-6 text-center text-xs text-stone-600 dark:text-stone-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CrackIt.ai • Protected Parent & Guardian Portal</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" /> Read-Only Safeguard Active
            </span>
            <span>•</span>
            <Link href="/student" className="hover:underline text-indigo-700 dark:text-indigo-400">
              Student View
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

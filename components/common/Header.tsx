'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  LogOut,
  ArrowRight,
  BookOpen,
  Users,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useExam } from '@/lib/context/exam-context';

export function Header() {
  const { user, profile, isDemo, signOut, signInWithDemo } = useAuth();
  const { selectedExam, setSelectedExam } = useExam();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Brand & Exam Toggle */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-700 transition">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-900 text-base sm:text-lg tracking-tight">CrackIt.ai</span>
              </div>
              <p className="text-[11px] text-stone-500 hidden lg:block leading-tight">
                Diagnose. Learn. Practice. Improve.
              </p>
            </div>
          </Link>

          {/* Global Exam Track Toggle */}
          <div className="flex items-center bg-stone-100 p-0.5 sm:p-1 rounded-xl border border-stone-200 text-xs font-bold shadow-2xs shrink-0">
            <button
              type="button"
              id="header-toggle-ecat"
              onClick={() => setSelectedExam('ECAT')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition ${
                selectedExam === 'ECAT'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              ECAT
            </button>
            <button
              type="button"
              id="header-toggle-mdcat"
              onClick={() => setSelectedExam('MDCAT')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition ${
                selectedExam === 'MDCAT'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              MDCAT
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3">
          <Link
            href="/student/curriculum"
            id="nav-curriculum-link"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition text-xs font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Curriculum Explorer</span>
          </Link>

          <Link
            href="/parent"
            id="nav-parent-portal-link"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-800 hover:text-indigo-950 hover:bg-indigo-100 transition text-xs font-semibold"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Parent Portal</span>
          </Link>

          <Link
            href="/student/practice"
            id="nav-practice-link"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Practice Arena</span>
          </Link>
        </div>

        {/* Right Actions & Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user || isDemo ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/student"
                className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition shadow-xs"
              >
                <span>Student Portal</span>
                {isDemo && (
                  <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded hidden sm:inline">
                    Demo
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => signOut()}
                className="py-1.5 px-2 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition text-xs font-medium flex items-center gap-1"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => signInWithDemo()}
                id="header-try-demo-btn"
                className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Try Demo</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/student/curriculum"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Curriculum Explorer</span>
          </Link>

          <Link
            href="/parent"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs font-semibold text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 transition"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Parent Portal</span>
          </Link>

          <Link
            href="/student/practice"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Practice Arena</span>
          </Link>
        </div>
      )}
    </header>
  );
}

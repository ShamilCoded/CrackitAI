'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  FileQuestion,
  LayoutDashboard,
  Layers,
  LogOut,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, isDemo, isAdmin, signInWithDemoAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-stone-100">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center animate-pulse shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Verifying Admin CMS Authorization</h3>
            <p className="text-xs text-stone-400">Evaluating role permissions & security policies...</p>
          </div>
          <div className="w-48 h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-amber-500 rounded-full animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  // ACCESS DENIED BARRIER FOR NON-ADMINS (STUDENTS OR UNAUTHENTICATED)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-center p-6">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Access Restricted • 403 Forbidden
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Curriculum CMS Admin Privileges Required
            </h1>
            <p className="text-xs text-stone-400 leading-relaxed">
              Student accounts are strictly prohibited from viewing or modifying syllabus definitions,
              draft question pipelines, editorial review states, and authoring modules.
            </p>
          </div>

          {profile && (
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="text-stone-400 font-medium flex items-center justify-between">
                <span>Active Account:</span>
                <span className="font-semibold text-stone-300">{profile.fullName}</span>
              </div>
              <div className="text-stone-400 font-medium flex items-center justify-between">
                <span>Current Role:</span>
                <span className="font-semibold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10">
                  {profile.role || 'student'}
                </span>
              </div>
              <div className="text-stone-400 font-medium flex items-center justify-between">
                <span>Email:</span>
                <span className="text-stone-400 truncate max-w-[200px]">{profile.email}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={async () => {
                await signInWithDemoAdmin();
                router.refresh();
              }}
              id="switch-demo-admin-btn"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-lg shadow-amber-500/20"
            >
              <UserCheck className="w-4 h-4" />
              <span>Switch to Demo Admin Persona (Testing Mode)</span>
            </button>

            <Link
              href="/student"
              id="back-to-student-btn"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Student Portal</span>
            </Link>
          </div>

          <div className="text-[11px] text-stone-500 border-t border-stone-800/80 pt-4">
            Security enforced via Supabase Row-Level Security (RLS) & server-side authorization.
          </div>
        </div>
      </div>
    );
  }

  // NAVIGATION ITEMS
  const navItems = [
    {
      href: '/admin',
      label: 'Overview',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      href: '/admin/questions',
      label: 'Question Bank',
      icon: FileQuestion,
      active: pathname.startsWith('/admin/questions'),
    },
    {
      href: '/admin/curriculum',
      label: 'Curriculum Hierarchy',
      icon: Layers,
      active: pathname.startsWith('/admin/curriculum'),
    },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/admin" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black tracking-tight shadow-md group-hover:bg-amber-400 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white tracking-tight">CrackIt.ai</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    CMS ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">ECAT & MDCAT Curriculum & Item Authoring</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-stone-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      item.active
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/student"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 transition"
              title="Preview the application from the student perspective"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              <span>Student View</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold">
                AD
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-stone-200 leading-tight">
                  {profile?.fullName || 'Admin User'}
                </p>
                <p className="text-[10px] text-amber-400 font-mono">Curriculum SME</p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center px-4 py-2 border-t border-stone-800/80 bg-stone-900 space-x-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium transition ${
                  item.active
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>

      {/* Admin Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950 py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CrackIt.ai Protected CMS &bull; ECAT & MDCAT Authoring System</span>
          <span className="font-mono text-[11px] text-stone-600">
            RLS Enforcement: Active &bull; Service Role Protection: Secure
          </span>
        </div>
      </footer>
    </div>
  );
}

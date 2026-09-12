'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';

export default function StudentErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Student portal error caught by app/student/error.tsx:', error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div
        id="student-error-boundary-card"
        className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm text-center"
      >
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 id="student-error-title" className="text-xl font-bold text-slate-900">
          Student Portal Encountered an Issue
        </h2>
        <p id="student-error-desc" className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          We encountered an issue while loading your learning data. Your saved answers, diagnostic scores, and practice records are safe.
        </p>

        <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
          <button
            id="student-error-retry-btn"
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry View
          </button>

          <Link
            id="student-error-overview-btn"
            href="/student"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>

        {error.message && (
          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 font-mono text-left max-w-md mx-auto truncate">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
}

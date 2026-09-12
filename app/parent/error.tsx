'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Users } from 'lucide-react';

export default function ParentErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Parent portal error caught by app/parent/error.tsx:', error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div
        id="parent-error-boundary-card"
        className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm text-center"
      >
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 id="parent-error-title" className="text-xl font-bold text-slate-900">
          Parent Portal Error
        </h2>
        <p id="parent-error-desc" className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          An error occurred while loading student analytics and readiness summaries.
        </p>

        <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
          <button
            id="parent-error-retry-btn"
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload Analytics
          </button>

          <Link
            id="parent-error-hub-btn"
            href="/parent"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Parent Dashboard
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

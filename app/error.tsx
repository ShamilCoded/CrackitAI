'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Compass, ChevronDown, ChevronUp } from 'lucide-react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    console.error('Unhandled route exception caught by app/error.tsx:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
      <div
        id="app-error-container"
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 id="app-error-title" className="text-xl font-bold text-slate-900">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-500">
              An unexpected error occurred while loading this view.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-sm text-slate-600 leading-relaxed">
          Your diagnostic progress, practice history, and study plan data are safe. You can retry loading
          this page or navigate back to the student dashboard.
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            id="app-error-try-again-btn"
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </button>

          <Link
            id="app-error-dashboard-link"
            href="/student"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Compass className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Student Dashboard
          </Link>

          <Link
            id="app-error-home-link"
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Home className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Landing Page
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            id="app-error-toggle-tech-btn"
            type="button"
            onClick={() => setShowTechnicalDetails((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <span>{showTechnicalDetails ? 'Hide Diagnostic Details' : 'Show Diagnostic Details'}</span>
            {showTechnicalDetails ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>

          {showTechnicalDetails && (
            <div
              id="app-error-tech-panel"
              className="mt-3 rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-44"
            >
              <p className="text-rose-400 font-semibold mb-1">
                {error.name || 'Error'}: {error.message || 'Unknown error occurred'}
              </p>
              {error.digest && (
                <p className="text-slate-400">Digest: {error.digest}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

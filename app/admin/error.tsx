'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin CMS error caught by app/admin/error.tsx:', error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div
        id="admin-error-boundary-card"
        className="rounded-2xl border border-amber-200 bg-white p-8 shadow-sm text-center"
      >
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 id="admin-error-title" className="text-xl font-bold text-slate-900">
          Admin Portal Error
        </h2>
        <p id="admin-error-desc" className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          An error occurred while loading CMS curriculum records or question banks.
        </p>

        <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
          <button
            id="admin-error-retry-btn"
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload CMS View
          </button>

          <Link
            id="admin-error-hub-btn"
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Shield className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Admin Overview
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

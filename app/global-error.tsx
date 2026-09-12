'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans text-slate-900 min-h-screen flex items-center justify-center p-6">
        <div
          id="global-critical-error-card"
          className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-md text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 text-2xl font-bold">
            !
          </div>
          <h1 id="global-error-title" className="text-2xl font-bold text-slate-900">
            Application Error
          </h1>
          <p id="global-error-desc" className="mt-2 text-sm text-slate-600 leading-relaxed">
            The application encountered a critical layout error. Your progress and settings are preserved.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              id="global-error-reload-btn"
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              Reload Application
            </button>
            <button
              id="global-error-hard-reload-btn"
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Go to Home
            </button>
          </div>

          {error.message && (
            <p className="mt-4 text-xs font-mono text-slate-400 truncate">
              {error.message}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}

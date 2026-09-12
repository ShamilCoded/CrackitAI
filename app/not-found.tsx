import React from 'react';
import Link from 'next/link';
import { Compass, BookOpen, FileCheck, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50">
      <div
        id="not-found-card"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 id="not-found-title" className="text-2xl font-bold text-slate-900">
          Page Not Found
        </h1>
        <p id="not-found-desc" className="mt-2 text-sm text-slate-600 leading-relaxed">
          The curriculum unit, question, or page you are looking for does not exist or has been relocated.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            id="not-found-student-link"
            href="/student"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Student Dashboard
          </Link>

          <Link
            id="not-found-diagnostic-link"
            href="/student/diagnostic"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileCheck className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Diagnostic Test
          </Link>

          <Link
            id="not-found-home-link"
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Home className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

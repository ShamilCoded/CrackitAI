'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminCmsService } from '@/services/admin/admin-cms.service';
import type { Question } from '@/types';
import {
  FileQuestion,
  CheckCircle2,
  Clock,
  Archive,
  FileEdit,
  Layers,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Plus,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { QuestionEditorModal } from '@/components/admin/QuestionEditorModal';

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState(() => adminCmsService.getQuestionCountsByStatus());
  const [curriculumCounts, setCurriculumCounts] = useState(() =>
    adminCmsService.getCurriculumOverviewCounts()
  );
  const [reviewQueue, setReviewQueue] = useState<Question[]>([]);
  const [recentDrafts, setRecentDrafts] = useState<Question[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setCounts(adminCmsService.getQuestionCountsByStatus());
    setCurriculumCounts(adminCmsService.getCurriculumOverviewCounts());
    const reviewQuestions = await adminCmsService.getQuestions({ status: 'review' });
    setReviewQueue(reviewQuestions);
    const draftQuestions = await adminCmsService.getQuestions({ status: 'draft' });
    setRecentDrafts(draftQuestions);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApprove = async (id: string) => {
    await adminCmsService.updateQuestionStatus(id, 'approved');
    showToast(`Question ${id} approved! It is now live in student practice & mock exams.`);
    loadData();
  };

  const handleReturnToDraft = async (id: string) => {
    await adminCmsService.updateQuestionStatus(id, 'draft');
    showToast(`Question ${id} returned to draft status.`);
    loadData();
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border border-amber-500/40 text-amber-300 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900/60 border border-stone-800 rounded-2xl p-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin CMS Control Plane</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Curriculum & Question Operations
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl mt-1">
            Maintain ECAT and MDCAT syllabus structures, author exam items, verify scientific explanations,
            and manage the approval lifecycle. Only approved questions reach students.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsEditorOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Author Question</span>
          </button>

          <Link
            href="/admin/questions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition"
          >
            <span>Question Bank</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Question Pipeline Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider">
          Question Authoring & Quality Pipeline
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Total */}
          <Link
            href="/admin/questions"
            className="bg-stone-900/80 border border-stone-800 hover:border-stone-700 rounded-2xl p-4 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold">Total Items</span>
              <FileQuestion className="w-4 h-4 text-stone-400 group-hover:text-white transition" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{counts.total}</div>
            <span className="text-[11px] text-stone-500 mt-1 block">Full Item Bank</span>
          </Link>

          {/* Draft */}
          <Link
            href="/admin/questions?status=draft"
            className="bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-4 transition group"
          >
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-semibold">Draft</span>
              <FileEdit className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">{counts.draft}</div>
            <span className="text-[11px] text-stone-500 mt-1 block">Authoring in progress</span>
          </Link>

          {/* Review */}
          <Link
            href="/admin/questions?status=review"
            className="bg-stone-900/80 border border-stone-800 hover:border-blue-500/40 rounded-2xl p-4 transition group"
          >
            <div className="flex items-center justify-between text-blue-400 mb-2">
              <span className="text-xs font-semibold">In Review</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono">{counts.review}</div>
            <span className="text-[11px] text-stone-500 mt-1 block">Pending SME Quality Gate</span>
          </Link>

          {/* Approved */}
          <Link
            href="/admin/questions?status=approved"
            className="bg-stone-900/80 border border-stone-800 hover:border-emerald-500/40 rounded-2xl p-4 transition group"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold">Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{counts.approved}</div>
            <span className="text-[11px] text-stone-500 mt-1 block">Live in Student Practice</span>
          </Link>

          {/* Archived */}
          <Link
            href="/admin/questions?status=archived"
            className="bg-stone-900/80 border border-stone-800 hover:border-stone-700 rounded-2xl p-4 transition group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold">Archived</span>
              <Archive className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-black text-stone-400 font-mono">{counts.archived}</div>
            <span className="text-[11px] text-stone-500 mt-1 block">Retired from syllabus</span>
          </Link>
        </div>
      </div>

      {/* Curriculum Hierarchy Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider">
            Curriculum Hierarchy Structure
          </h2>
          <Link
            href="/admin/curriculum"
            className="text-xs font-semibold text-amber-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Manage Curriculum</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-stone-400 font-medium block">Registered Exams</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              {curriculumCounts.examsCount}
            </span>
            <span className="text-[10px] text-amber-400 font-mono">ECAT & MDCAT</span>
          </div>

          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-stone-400 font-medium block">Core Subjects</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              {curriculumCounts.subjectsCount}
            </span>
            <span className="text-[10px] text-stone-500">PHY, CHEM, MATH...</span>
          </div>

          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-stone-400 font-medium block">Syllabus Chapters</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              {curriculumCounts.chaptersCount}
            </span>
            <span className="text-[10px] text-stone-500">Sequenced Units</span>
          </div>

          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-stone-400 font-medium block">Discrete Topics</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              {curriculumCounts.topicsCount}
            </span>
            <span className="text-[10px] text-stone-500">Granular Nodes</span>
          </div>

          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-stone-400 font-medium block">Learning Objectives</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              {curriculumCounts.learningObjectivesCount}
            </span>
            <span className="text-[10px] text-purple-400 font-mono">Bloom Taxonomy</span>
          </div>

          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-stone-400 font-medium block">Pedagogical Skills</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              {curriculumCounts.skillsCount}
            </span>
            <span className="text-[10px] text-stone-500">Problem Diagnostics</span>
          </div>
        </div>
      </div>

      {/* Quality Review Queue Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider">
              SME Quality Review Queue
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {reviewQueue.length} Pending Approval
            </span>
          </div>
          <Link
            href="/admin/questions?status=review"
            className="text-xs font-semibold text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View all in review</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {reviewQueue.length === 0 ? (
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 text-center text-xs text-stone-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <span>All submitted questions have been reviewed! No items currently in queue.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewQueue.map((q) => (
              <div
                key={q.id}
                className="bg-stone-900/80 border border-blue-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      In Review
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-800 text-stone-300 capitalize">
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500">{q.id}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-200 font-sans leading-snug">
                    {q.content || q.questionText}
                  </p>
                  <p className="text-[11px] text-stone-400 line-clamp-1">
                    <span className="font-semibold text-stone-300">Explanation: </span>
                    {q.explanation}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleApprove(q.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition shadow-md shadow-emerald-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve (Publish)</span>
                  </button>

                  <button
                    onClick={() => handleReturnToDraft(q.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revise</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Author New Question Modal */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        question={null}
        onClose={() => setIsEditorOpen(false)}
        onSaved={() => {
          showToast('New question item authored successfully!');
          loadData();
        }}
      />
    </div>
  );
}

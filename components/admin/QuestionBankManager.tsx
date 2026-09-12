'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Question, QuestionStatus, DifficultyLevel, ExamType } from '@/types';
import { adminCmsService, QuestionBankFilter } from '@/services/admin/admin-cms.service';
import { QuestionEditorModal } from './QuestionEditorModal';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  FileEdit,
  Eye,
  Trash2,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export function QuestionBankManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState({
    total: 0,
    draft: 0,
    review: 0,
    approved: 0,
    archived: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<QuestionStatus | 'all'>('all');
  const [selectedExam, setSelectedExam] = useState<ExamType | 'all'>('all');

  // Question Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Expanded card IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const subjects = useMemo(() => adminCmsService.getSubjects(), []);
  const topics = useMemo(() => {
    if (selectedSubject === 'all') return [];
    const chapters = adminCmsService.getChapters(selectedSubject);
    return chapters.flatMap((c) => adminCmsService.getTopics(c.id));
  }, [selectedSubject]);

  const loadData = async () => {
    setIsLoading(true);
    const filter: QuestionBankFilter = {
      subjectId: selectedSubject,
      topicId: selectedTopic,
      difficulty: selectedDifficulty,
      status: selectedStatus,
      search: search.trim() || undefined,
      examType: selectedExam,
    };
    const data = await adminCmsService.getQuestions(filter);
    setQuestions(data);
    setCounts(adminCmsService.getQuestionCountsByStatus());
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedTopic, selectedDifficulty, selectedStatus, selectedExam, search]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusChange = async (id: string, newStatus: QuestionStatus) => {
    const updated = await adminCmsService.updateQuestionStatus(id, newStatus);
    if (updated) {
      showToast(
        `Question ${id} status changed to ${newStatus.toUpperCase()}${
          newStatus === 'approved' ? ' (Now Live in Student Practice)' : ''
        }`
      );
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    await adminCmsService.deleteQuestion(id);
    showToast(`Question ${id} removed.`);
    loadData();
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openNewModal = () => {
    setEditingQuestion(null);
    setIsEditorOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setIsEditorOpen(true);
  };

  const handleQuestionSaved = (saved: Question) => {
    showToast(`Question ${saved.id} successfully saved.`);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border border-amber-500/40 text-amber-300 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Curriculum Question Bank
          </h1>
          <p className="text-xs sm:text-sm text-stone-400">
            Author, review, approve, and archive entrance exam items across ECAT & MDCAT.
          </p>
        </div>

        <button
          onClick={openNewModal}
          id="author-new-question-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-lg shadow-amber-500/20 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Author New Question</span>
        </button>
      </div>

      {/* Workflow Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: 'All Items', count: counts.total, icon: BookOpen },
          { id: 'draft', label: 'Draft', count: counts.draft, icon: FileEdit, color: 'text-amber-400' },
          { id: 'review', label: 'In Review', count: counts.review, icon: Clock, color: 'text-blue-400' },
          { id: 'approved', label: 'Approved (Live)', count: counts.approved, icon: CheckCircle2, color: 'text-emerald-400' },
          { id: 'archived', label: 'Archived', count: counts.archived, icon: Archive, color: 'text-stone-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.color || ''}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-800 text-stone-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search statements, explanations, IDs..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('all');
              }}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={selectedSubject === 'all'}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
            >
              <option value="all">All Topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty & Exam Filters */}
          <div className="flex gap-2">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="w-1/2 bg-stone-950 border border-stone-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">Any Level</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="exam_level">Exam Level</option>
            </select>

            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value as any)}
              className="w-1/2 bg-stone-950 border border-stone-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">Any Exam</option>
              <option value="ECAT">ECAT</option>
              <option value="MDCAT">MDCAT</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-stone-800/60">
          <span>
            Showing <strong className="text-white">{questions.length}</strong> items
          </span>
          {(search ||
            selectedSubject !== 'all' ||
            selectedDifficulty !== 'all' ||
            selectedStatus !== 'all' ||
            selectedExam !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedSubject('all');
                setSelectedTopic('all');
                setSelectedDifficulty('all');
                setSelectedStatus('all');
                setSelectedExam('all');
              }}
              className="text-amber-400 hover:underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Question Items List */}
      {isLoading ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-400">Loading curriculum items...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No questions match the current filters</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try adjusting your search criteria or author a new question item.
          </p>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-stone-950 hover:bg-amber-400 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Author New Question</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const isExpanded = expandedIds.has(q.id);
            const status = q.status || 'approved';
            const subject = subjects.find((s) => s.id === q.subjectId);

            return (
              <div
                key={q.id}
                className={`bg-stone-900/90 border rounded-2xl p-4 sm:p-5 transition shadow-sm ${
                  status === 'approved'
                    ? 'border-stone-800 hover:border-stone-700'
                    : status === 'review'
                    ? 'border-blue-500/30 hover:border-blue-500/50'
                    : status === 'draft'
                    ? 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-stone-800 opacity-75'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : status === 'review'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : status === 'archived'
                          ? 'bg-stone-800 text-stone-400 border border-stone-700'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                      {status === 'review' && <Clock className="w-3 h-3" />}
                      {status === 'draft' && <FileEdit className="w-3 h-3" />}
                      {status === 'archived' && <Archive className="w-3 h-3" />}
                      <span>{status}</span>
                    </span>

                    {/* Subject & Difficulty */}
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-800 text-stone-300">
                      {subject?.name || q.subjectId}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-stone-800/80 text-stone-400 capitalize">
                      {q.difficulty.replace('_', ' ')}
                    </span>

                    {/* Applicable Exams */}
                    {(q.applicableExams || []).map((exam) => (
                      <span
                        key={exam}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      >
                        {exam}
                      </span>
                    ))}

                    <span className="text-[11px] font-mono text-stone-500">{q.id}</span>
                  </div>

                  {/* Workflow Transitions & Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Quick Workflow Transitions */}
                    {status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(q.id, 'review')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 transition"
                        title="Submit to SME Quality Review Queue"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Submit for Review</span>
                      </button>
                    )}

                    {status === 'review' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(q.id, 'approved')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition"
                          title="Approve item for live student practice"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(q.id, 'draft')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 bg-stone-800 transition"
                          title="Return to Draft"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Revise</span>
                        </button>
                      </>
                    )}

                    {status === 'approved' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(q.id, 'review')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-stone-400 hover:text-blue-300 bg-stone-800 transition"
                          title="Send back for review"
                        >
                          <span>Move to Review</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(q.id, 'archived')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-stone-400 hover:text-rose-400 bg-stone-800 transition"
                          title="Retire/Archive this question"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Archive</span>
                        </button>
                      </>
                    )}

                    {status === 'archived' && (
                      <button
                        onClick={() => handleStatusChange(q.id, 'draft')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-800 text-stone-300 hover:text-white transition"
                        title="Restore to draft pipeline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore to Draft</span>
                      </button>
                    )}

                    {/* Edit Modal Button */}
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition"
                      title="Edit Question Details"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Expand/Collapse */}
                    <button
                      onClick={() => toggleExpand(q.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
                      title={isExpanded ? 'Collapse' : 'Expand Options & Solution'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Statement */}
                <div className="text-xs sm:text-sm text-stone-200 font-sans leading-relaxed">
                  {q.content || q.questionText}
                </div>

                {/* Expanded Details: Options, Solution, Source */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-stone-800/80 space-y-3 text-xs animate-in fade-in duration-150">
                    {/* Options list */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-stone-400">Answer Options:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(q.options || []).map((opt) => {
                          const isCorrect =
                            opt.id === q.correctOptionId ||
                            opt.isCorrect ||
                            opt.id === q.correctAnswer;
                          return (
                            <div
                              key={opt.id || opt.optionKey}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                                  : 'bg-stone-950/60 border-stone-800 text-stone-300'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-500 text-stone-950'
                                    : 'bg-stone-800 text-stone-400'
                                }`}
                              >
                                {opt.optionKey}
                              </span>
                              <div className="flex-1">
                                <p className="leading-snug">{opt.text || opt.optionText}</p>
                                {isCorrect && (
                                  <span className="inline-block text-[10px] font-bold text-emerald-400 mt-1">
                                    ✓ Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pedagogical Explanation */}
                    {(q.comprehensiveExplanation || q.explanation) && (
                      <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3">
                        <p className="text-[11px] font-semibold text-stone-400 mb-1">
                          Pedagogical Rationale / Solution:
                        </p>
                        <p className="text-stone-300 text-xs leading-relaxed">
                          {q.comprehensiveExplanation || q.explanation}
                        </p>
                      </div>
                    )}

                    {/* Tip / Shortcut */}
                    {q.tipOrShortcut && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-300 text-xs flex items-start gap-2">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <div>
                          <strong className="font-semibold text-amber-200">Exam Shortcut: </strong>
                          {q.tipOrShortcut}
                        </div>
                      </div>
                    )}

                    {/* Attribution & Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-1">
                      <span>Source: {q.source || 'Curriculum Working Group'}</span>
                      <span>
                        Updated:{' '}
                        {q.updatedAt
                          ? new Date(q.updatedAt).toLocaleDateString()
                          : q.createdAt
                            ? new Date(q.createdAt).toLocaleDateString()
                            : 'Recently'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Question Editor Modal */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        question={editingQuestion}
        onClose={() => setIsEditorOpen(false)}
        onSaved={handleQuestionSaved}
      />
    </div>
  );
}

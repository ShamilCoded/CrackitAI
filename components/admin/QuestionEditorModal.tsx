'use client';

import React, { useState, useEffect } from 'react';
import type { Question, QuestionStatus, DifficultyLevel, ExamType } from '@/types';
import { adminCmsService, CreateQuestionInput } from '@/services/admin/admin-cms.service';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  HelpCircle,
  Lightbulb,
  Sparkles,
} from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  question?: Question | null;
  onClose: () => void;
  onSaved: (savedQuestion: Question) => void;
}

export function QuestionEditorModal({
  isOpen,
  question,
  onClose,
  onSaved,
}: QuestionEditorModalProps) {
  const isEditing = Boolean(question);

  // Form State
  const [subjectId, setSubjectId] = useState('subj-physics');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [status, setStatus] = useState<QuestionStatus>('draft');
  const [applicableExams, setApplicableExams] = useState<ExamType[]>(['ECAT']);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState([
    { optionKey: 'A', text: '', isCorrect: true, explanation: '' },
    { optionKey: 'B', text: '', isCorrect: false, explanation: '' },
    { optionKey: 'C', text: '', isCorrect: false, explanation: '' },
    { optionKey: 'D', text: '', isCorrect: false, explanation: '' },
  ]);
  const [explanation, setExplanation] = useState('');
  const [tipOrShortcut, setTipOrShortcut] = useState('');
  const [source, setSource] = useState('Admin Authoring CMS');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Curriculum Lookups
  const subjects = adminCmsService.getSubjects();
  const chapters = adminCmsService.getChapters(subjectId);
  const topics = adminCmsService.getTopics(chapterId);

  // Populate when editing or switching subject
  useEffect(() => {
    const timer = setTimeout(() => {
      if (question) {
        setSubjectId(question.subjectId);
        setChapterId(question.chapterId);
        setTopicId(question.topicId);
        setDifficulty(question.difficulty);
        setStatus(question.status || 'draft');
        setApplicableExams(question.applicableExams || ['ECAT']);
        setQuestionText(question.questionText || question.content);
        setExplanation(question.explanation || question.comprehensiveExplanation || '');
        setTipOrShortcut(question.tipOrShortcut || '');
        setSource(question.source || 'Admin Authoring CMS');

        if (question.options && question.options.length >= 2) {
          setOptions(
            question.options.map((opt, i) => ({
              optionKey: opt.optionKey || String.fromCharCode(65 + i),
              text: opt.text || opt.optionText || '',
              isCorrect: opt.id === question.correctOptionId || opt.isCorrect,
              explanation: opt.explanation || '',
            }))
          );
        }
      } else {
        // Defaults for new question
        setSubjectId('subj-physics');
        const defaultChap = adminCmsService.getChapters('subj-physics')[0];
        setChapterId(defaultChap?.id || '');
        const defaultTopic = defaultChap ? adminCmsService.getTopics(defaultChap.id)[0] : null;
        setTopicId(defaultTopic?.id || '');
        setDifficulty('medium');
        setStatus('draft');
        setApplicableExams(['ECAT']);
        setQuestionText('');
        setOptions([
          { optionKey: 'A', text: '', isCorrect: true, explanation: '' },
          { optionKey: 'B', text: '', isCorrect: false, explanation: '' },
          { optionKey: 'C', text: '', isCorrect: false, explanation: '' },
          { optionKey: 'D', text: '', isCorrect: false, explanation: '' },
        ]);
        setExplanation('');
        setTipOrShortcut('');
        setSource('Admin Authoring CMS');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [question, isOpen]);

  // When subject changes in form, reset chapter and topic
  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    const chaps = adminCmsService.getChapters(newSubjectId);
    const firstChap = chaps[0];
    setChapterId(firstChap ? firstChap.id : '');
    const tops = firstChap ? adminCmsService.getTopics(firstChap.id) : [];
    setTopicId(tops[0] ? tops[0].id : '');
  };

  const handleChapterChange = (newChapterId: string) => {
    setChapterId(newChapterId);
    const tops = adminCmsService.getTopics(newChapterId);
    setTopicId(tops[0] ? tops[0].id : '');
  };

  const handleOptionCorrectChange = (idx: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === idx,
      }))
    );
  };

  const handleOptionTextChange = (idx: number, text: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === idx ? { ...opt, text } : opt))
    );
  };

  const toggleExam = (exam: ExamType) => {
    setApplicableExams((prev) =>
      prev.includes(exam)
        ? prev.length > 1
          ? prev.filter((e) => e !== exam)
          : prev
        : [...prev, exam]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!questionText.trim()) {
      setFormError('Question text statement cannot be empty.');
      return;
    }
    for (let i = 0; i < options.length; i++) {
      if (!options[i].text.trim()) {
        setFormError(`Option ${options[i].optionKey} text is required.`);
        return;
      }
    }
    if (!options.some((o) => o.isCorrect)) {
      setFormError('Please select one option as the correct answer.');
      return;
    }
    if (!explanation.trim()) {
      setFormError('Please provide a pedagogical explanation for the correct answer.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing && question) {
        const updated = await adminCmsService.updateQuestion({
          id: question.id,
          subjectId,
          chapterId,
          topicId,
          difficulty,
          status,
          applicableExams,
          questionText,
          options,
          explanation,
          tipOrShortcut,
          source,
        });
        if (updated) onSaved(updated);
      } else {
        const created = await adminCmsService.createQuestion({
          subjectId,
          chapterId,
          topicId,
          difficulty,
          status,
          applicableExams,
          questionText,
          options,
          explanation,
          tipOrShortcut,
          source,
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save question');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{isEditing ? 'Edit Question Item' : 'Author New Exam Question'}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : status === 'review'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : status === 'archived'
                    ? 'bg-stone-700 text-stone-300'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {status}
              </span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {isEditing
                ? `ID: ${question?.id} • Update item statement, options, curriculum mapping & review status`
                : 'Create high-yield question mapped to ECAT/MDCAT syllabus specifications'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Status & Applicable Exams */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-950/40 p-4 rounded-xl border border-stone-800/80">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Workflow Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuestionStatus)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="draft">Draft (Authoring In Progress)</option>
                <option value="review">Review (Awaiting SME Approval)</option>
                <option value="approved">Approved (Live in Student Practice & Exams)</option>
                <option value="archived">Archived (Retired / Historical)</option>
              </select>
              <p className="text-[10px] text-stone-400 mt-1">
                Only <span className="text-emerald-400 font-semibold">Approved</span> questions are delivered to students.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Target Entrance Exam
              </label>
              <div className="flex gap-2">
                {(['ECAT', 'MDCAT'] as ExamType[]).map((exam) => {
                  const isChecked = applicableExams.includes(exam);
                  return (
                    <button
                      type="button"
                      key={exam}
                      onClick={() => toggleExam(exam)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition border ${
                        isChecked
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {exam}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Shared subjects can apply to both exams.</p>
            </div>
          </div>

          {/* Row 2: Curriculum Mapping */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Chapter</label>
              <select
                value={chapterId}
                onChange={(e) => handleChapterChange(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Topic</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Difficulty & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Difficulty Level</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['easy', 'medium', 'hard', 'exam_level'] as DifficultyLevel[]).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`py-1.5 px-2 rounded-lg text-xs capitalize font-medium border transition ${
                      difficulty === lvl
                        ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {lvl.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Source / Attribution</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. ECAT 2023 Past Paper or MDCAT Cell Unit"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 4: Question Statement */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-200">
                Question Statement / Problem Text
              </label>
              <span className="text-[11px] text-stone-400">Supports standard markdown & math expressions</span>
            </div>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              placeholder="Enter question statement here..."
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          {/* Row 5: 4 Options with Radio Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-200 mb-2">
              Answer Options (Select the correct option radio)
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div
                  key={opt.optionKey}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                    opt.isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-stone-950/60 border-stone-800'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="correct-option-group"
                      checked={opt.isCorrect}
                      onChange={() => handleOptionCorrectChange(idx)}
                      className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 bg-stone-900 border-stone-700"
                    />
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        opt.isCorrect
                          ? 'bg-emerald-500 text-stone-950'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {opt.optionKey}
                    </span>
                  </label>

                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                    placeholder={`Option ${opt.optionKey} text...`}
                    className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder-stone-600 focus:outline-none"
                  />

                  {opt.isCorrect && (
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 shrink-0">
                      Correct Key
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 6: Detailed Explanation */}
          <div>
            <label className="block text-xs font-semibold text-stone-200 mb-1.5">
              Comprehensive Pedagogical Explanation
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="Step-by-step formula derivation, scientific rationale, and why distractors are incorrect..."
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Row 7: Speed Shortcut / Exam Tip */}
          <div>
            <label className="block text-xs font-semibold text-stone-200 mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Exam Tip or Speed Shortcut (Optional)</span>
            </label>
            <input
              type="text"
              value={tipOrShortcut}
              onChange={(e) => setTipOrShortcut(e.target.value)}
              placeholder="e.g. Proportionality shortcut: double the radius multiplies terminal speed by 4"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition disabled:opacity-50 shadow-md shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Question...' : isEditing ? 'Save Changes' : 'Create Question'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

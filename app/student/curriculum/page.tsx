'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Share2,
  GraduationCap,
  Clock,
  Award,
  Target,
  ArrowLeft,
  ChevronDown,
  Info,
  Filter,
  Zap,
  Tag,
  Lightbulb,
} from 'lucide-react';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { useExam } from '@/lib/context/exam-context';
import type {
  ExamType,
  ExamCurriculumHierarchy,
  SubjectHierarchy,
  ChapterHierarchy,
  TopicHierarchy,
  TopicDetail,
} from '@/types';

export default function CurriculumExplorerPage() {
  const { selectedExam, setSelectedExam } = useExam();
  const [hierarchy, setHierarchy] = useState<ExamCurriculumHierarchy | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(new Set());
  const [selectedTopicDetail, setSelectedTopicDetail] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  // Load curriculum hierarchy
  useEffect(() => {
    let isCancelled = false;

    async function fetchHierarchy() {
      try {
        setLoading(true);
        setError(null);
        const data = await curriculumService.getCurriculumHierarchy(selectedExam);
        if (isCancelled) return;
        setHierarchy(data);
        if (data.subjects.length > 0) {
          setSelectedSubjectId(data.subjects[0].id);
          // Default expand the first chapter
          if (data.subjects[0].chapters.length > 0) {
            setExpandedChapterIds(new Set([data.subjects[0].chapters[0].id]));
            // Default select first topic
            if (data.subjects[0].chapters[0].topics.length > 0) {
              const firstTopic = data.subjects[0].chapters[0].topics[0];
              const detail = await curriculumService.getTopicDetails(firstTopic.id);
              if (!isCancelled) {
                setSelectedTopicDetail(detail);
              }
            }
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error('Failed to load curriculum hierarchy:', err);
          const msg = err instanceof Error ? err.message : 'Failed to load curriculum data.';
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void fetchHierarchy();

    return () => {
      isCancelled = true;
    };
  }, [selectedExam, reloadNonce]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleSelectTopic = async (topicId: string) => {
    try {
      const detail = await curriculumService.getTopicDetails(topicId);
      setSelectedTopicDetail(detail);
    } catch (err: unknown) {
      console.error('Failed to load topic details:', err);
    }
  };

  const currentSubject = hierarchy?.subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="w-full space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <Link
              href="/student"
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Student Portal</span>
            </Link>
            <span>/</span>
            <span className="text-stone-900">Curriculum Engine</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>PostgreSQL Data-Driven Engine</span>
          </div>
        </div>

        {/* Header Title Section */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data Model Hierarchy: Exam → Subject → Chapter → Topic → Subtopic → Learning Objective → Skill</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Data-Driven Curriculum Explorer
              </h1>
              <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
                Shared curriculum infrastructure serving both <strong>ECAT</strong> and <strong>MDCAT</strong> without content duplication.
                Physics, Chemistry, and English share the same canonical chapters and topics while dynamically adapting weighting and questions.
              </p>
            </div>

            {/* Exam Toggle Switcher */}
            <div className="flex flex-col gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 shrink-0">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider px-3 pt-1">
                Select Exam Syllabus
              </span>
              <div className="flex items-center gap-1">
                <button
                  id="btn-select-ecat"
                  onClick={() => setSelectedExam('ECAT')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                    selectedExam === 'ECAT'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>ECAT (UET Engineering)</span>
                </button>
                <button
                  id="btn-select-mdcat"
                  onClick={() => setSelectedExam('MDCAT')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                    selectedExam === 'MDCAT'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>MDCAT (PMDC Medical)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Aggregate Metrics Bar */}
          {hierarchy && (
            <div className="mt-8 pt-6 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Subjects
                </span>
                <p className="text-xl font-extrabold text-stone-900 mt-0.5">
                  {hierarchy.subjects.length}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {hierarchy.subjects.filter((s) => s.isShared).length} Shared Across Exams
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Chapters
                </span>
                <p className="text-xl font-extrabold text-stone-900 mt-0.5">
                  {hierarchy.totalChapters}
                </p>
                <span className="text-[10px] text-stone-500">Syllabus units</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Topics
                </span>
                <p className="text-xl font-extrabold text-stone-900 mt-0.5">
                  {hierarchy.totalTopics}
                </p>
                <span className="text-[10px] text-stone-500">Micro-modules</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Subtopics
                </span>
                <p className="text-xl font-extrabold text-stone-900 mt-0.5">
                  {hierarchy.totalSubtopics}
                </p>
                <span className="text-[10px] text-stone-500">Diagnostic nodes</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Learning Objectives
                </span>
                <p className="text-xl font-extrabold text-stone-900 mt-0.5">
                  {hierarchy.totalLearningObjectives}
                </p>
                <span className="text-[10px] text-stone-500">Bloom&apos;s taxonomy</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Pedagogical Skills
                </span>
                <p className="text-xl font-extrabold text-stone-900 mt-0.5">
                  {hierarchy.totalSkills}
                </p>
                <span className="text-[10px] text-stone-500">Targeted competencies</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert Banner if Curriculum Fetch Fails */}
        {error && (
          <div
            id="curriculum-load-error-alert"
            className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                !
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">Curriculum Loading Error</h4>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
            <button
              id="curriculum-retry-btn"
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Subjects Selector Bar with Shared Exam Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {hierarchy?.subjects.map((subj) => (
            <button
              key={subj.id}
              onClick={() => {
                setSelectedSubjectId(subj.id);
                if (subj.chapters.length > 0) {
                  setExpandedChapterIds(new Set([subj.chapters[0].id]));
                  if (subj.chapters[0].topics.length > 0) {
                    handleSelectTopic(subj.chapters[0].topics[0].id);
                  }
                }
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition shrink-0 text-left ${
                selectedSubjectId === subj.id
                  ? 'bg-white border-stone-900 shadow-sm ring-1 ring-stone-900'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  selectedSubjectId === subj.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {subj.code}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-sm">{subj.name}</span>
                  {subj.isShared ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Shared (ECAT & MDCAT)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                      {subj.allExams?.[0] || selectedExam} Only
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Weight: <strong>{subj.weightPercentage}%</strong> • {subj.questionCount} Questions in {selectedExam}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Main Split Layout: Left Drilldown Hierarchy / Right Detailed Topic Inspection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Chapters & Topics Tree (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    {currentSubject?.name} Chapters & Topics
                  </h2>
                  <p className="text-xs text-stone-500">
                    Drill down from chapters to micro-topics and subtopics
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                  {currentSubject?.chapters.length || 0} Chapters
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  Loading curriculum data...
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSubject?.chapters.map((chapter) => {
                    const isExpanded = expandedChapterIds.has(chapter.id);
                    return (
                      <div
                        key={chapter.id}
                        className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50/40 transition"
                      >
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="w-full flex items-center justify-between p-3.5 text-left bg-white hover:bg-stone-50 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-md bg-stone-100 text-stone-700 text-[11px] font-bold flex items-center justify-center">
                              {chapter.sequenceOrder}
                            </span>
                            <div>
                              <h3 className="text-xs font-bold text-stone-900">{chapter.name}</h3>
                              <p className="text-[10px] text-stone-500 line-clamp-1">
                                {chapter.description || `${chapter.topics.length} topics`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                              {chapter.topics.length} topics
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-stone-400 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-2 space-y-1.5 border-t border-stone-100 bg-stone-50/60">
                            {chapter.topics.map((topic) => {
                              const isSelected = selectedTopicDetail?.id === topic.id;
                              return (
                                <button
                                  key={topic.id}
                                  onClick={() => handleSelectTopic(topic.id)}
                                  className={`w-full text-left p-2.5 rounded-lg text-xs transition flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-stone-900 text-white font-bold shadow-xs'
                                      : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-200/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isSelected ? 'bg-emerald-400' : 'bg-stone-400'
                                      }`}
                                    />
                                    <span>{topic.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                        isSelected
                                          ? 'bg-stone-800 text-stone-300'
                                          : 'bg-stone-100 text-stone-600'
                                      }`}
                                    >
                                      {topic.subtopics.length} Subtopics
                                    </span>
                                    <ChevronRight
                                      className={`w-3.5 h-3.5 ${
                                        isSelected ? 'text-emerald-400' : 'text-stone-400'
                                      }`}
                                    />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Complete Entity Inspector (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {selectedTopicDetail ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-6">
                {/* Topic Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-1">
                      <span>{selectedTopicDetail.subjectName}</span>
                      <span>•</span>
                      <span>{selectedTopicDetail.chapterName}</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-stone-900">
                      {selectedTopicDetail.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold bg-stone-100 text-stone-800">
                        <Clock className="w-3.5 h-3.5 text-stone-500" />
                        <span>{selectedTopicDetail.estimatedStudyMinutes || 45} mins</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Importance {selectedTopicDetail.importanceRating}/5</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                        <Share2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Applicable: {selectedTopicDetail.applicableExams.join(' & ')}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Exam Weighting
                    </span>
                    <div className="mt-1 space-y-0.5 text-xs font-semibold text-stone-700">
                      {Object.entries(selectedTopicDetail.examWeights).map(([exam, weight]) => (
                        <div key={exam} className="flex items-center gap-2 justify-end">
                          <span className="font-bold text-stone-900">{exam}:</span>
                          <span>{weight.weightPercentage}% ({weight.questionCount} Qs)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subtopics Hierarchy Drilldown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Subtopics & Learning Objectives ({selectedTopicDetail.subtopics.length})</span>
                    </h3>
                    <span className="text-[11px] text-stone-500">
                      Fine-grained diagnostic nodes
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedTopicDetail.subtopics.length === 0 ? (
                      <p className="text-xs text-stone-500 italic">No subtopics defined.</p>
                    ) : (
                      selectedTopicDetail.subtopics.map((sub, idx) => {
                        const relatedObjectives = selectedTopicDetail.learningObjectives.filter(
                          (lo) => lo.subtopicId === sub.id
                        );
                        return (
                          <div
                            key={sub.id}
                            className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <h4 className="text-xs font-bold text-stone-900">{sub.name}</h4>
                              </div>
                            </div>

                            {/* Learning Objectives for this subtopic */}
                            {relatedObjectives.length > 0 && (
                              <div className="pl-7 space-y-1.5 pt-1">
                                {relatedObjectives.map((lo) => (
                                  <div
                                    key={lo.id}
                                    className="flex items-start gap-2 text-xs text-stone-700 bg-white p-2 rounded-lg border border-stone-200/60"
                                  >
                                    <span
                                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                        lo.bloomTaxonomyLevel === 'evaluate' || lo.bloomTaxonomyLevel === 'create'
                                          ? 'bg-purple-100 text-purple-800'
                                          : lo.bloomTaxonomyLevel === 'analyze'
                                          ? 'bg-amber-100 text-amber-800'
                                          : lo.bloomTaxonomyLevel === 'apply'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {lo.bloomTaxonomyLevel}
                                    </span>
                                    <span className="leading-snug">{lo.statement}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Pedagogical Skills Tagged to this Subject & Topic */}
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Target Pedagogical Skills ({selectedTopicDetail.skills.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedTopicDetail.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-2.5 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {skill.code}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-stone-900">{skill.name}</h5>
                        {skill.description && (
                          <p className="text-[11px] text-stone-600 leading-snug">
                            {skill.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Unit Preview Banner */}
                {selectedTopicDetail.learningUnit && (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-emerald-950">
                          {selectedTopicDetail.learningUnit.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {selectedTopicDetail.learningUnit.estimatedMinutes} mins
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900/90 leading-relaxed">
                      {selectedTopicDetail.learningUnit.summary}
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        href={`/student/learn/${selectedTopicDetail.id}`}
                        className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Launch Interactive Learning Unit (6 Sections)</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500">
                <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-700">Select a topic to inspect its hierarchy</p>
                <p className="text-xs text-stone-400 mt-1">
                  Examine subtopics, Bloom&apos;s taxonomy learning objectives, and pedagogical skills
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

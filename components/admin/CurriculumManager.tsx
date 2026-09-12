'use client';

import React, { useState, useMemo } from 'react';
import type {
  Exam,
  Subject,
  Chapter,
  Topic,
  LearningObjective,
  Skill,
  BloomTaxonomyLevel,
} from '@/types';
import { adminCmsService } from '@/services/admin/admin-cms.service';
import {
  Layers,
  GraduationCap,
  BookOpen,
  FolderTree,
  FileCheck2,
  Brain,
  Plus,
  Edit2,
  CheckCircle2,
  Search,
  Save,
  X,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';

type CurriculumTab = 'exams' | 'subjects' | 'chapters' | 'topics' | 'objectives' | 'skills';

export function CurriculumManager() {
  const [activeTab, setActiveTab] = useState<CurriculumTab>('exams');

  // Filter Selectors
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Entities state
  const [exams, setExams] = useState<Exam[]>(() => adminCmsService.getExams());
  const [subjects, setSubjects] = useState<Subject[]>(() => adminCmsService.getSubjects());
  const [chapters, setChapters] = useState<Chapter[]>(() => adminCmsService.getChapters());
  const [topics, setTopics] = useState<Topic[]>(() => adminCmsService.getTopics());
  const [objectives, setObjectives] = useState<LearningObjective[]>(() =>
    adminCmsService.getLearningObjectives()
  );
  const [skills, setSkills] = useState<Skill[]>(() => adminCmsService.getSkills());

  // Edit / Add Modals
  const [editingItem, setEditingItem] = useState<{
    type: CurriculumTab;
    data: any;
    isNew: boolean;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshAll = () => {
    setExams(adminCmsService.getExams());
    setSubjects(adminCmsService.getSubjects());
    setChapters(adminCmsService.getChapters());
    setTopics(adminCmsService.getTopics());
    setObjectives(adminCmsService.getLearningObjectives());
    setSkills(adminCmsService.getSkills());
  };

  // Filtered lists
  const filteredChapters = useMemo(() => {
    let list = chapters;
    if (selectedSubjectId !== 'all') {
      list = list.filter((c) => c.subjectId === selectedSubjectId);
    }
    if (searchQuery) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [chapters, selectedSubjectId, searchQuery]);

  const filteredTopics = useMemo(() => {
    let list = topics;
    if (selectedChapterId !== 'all') {
      list = list.filter((t) => t.chapterId === selectedChapterId);
    } else if (selectedSubjectId !== 'all') {
      const chaps = chapters.filter((c) => c.subjectId === selectedSubjectId).map((c) => c.id);
      list = list.filter((t) => chaps.includes(t.chapterId));
    }
    if (searchQuery) {
      list = list.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list;
  }, [topics, selectedChapterId, selectedSubjectId, chapters, searchQuery]);

  const filteredObjectives = useMemo(() => {
    let list = objectives;
    if (selectedTopicId !== 'all') {
      list = list.filter((lo) => lo.topicId === selectedTopicId);
    }
    if (searchQuery) {
      list = list.filter((lo) => {
        const text = (lo.statement || lo.description || '').toLowerCase();
        const level = (lo.bloomTaxonomyLevel || lo.cognitiveLevel || '').toLowerCase();
        return text.includes(searchQuery.toLowerCase()) || level.includes(searchQuery.toLowerCase());
      });
    }
    return list;
  }, [objectives, selectedTopicId, searchQuery]);

  const filteredSkills = useMemo(() => {
    let list = skills;
    if (selectedSubjectId !== 'all') {
      list = list.filter((s) => s.subjectId === selectedSubjectId);
    }
    if (searchQuery) {
      list = list.filter((s) => {
        const title = (s.name || s.title || '').toLowerCase();
        const code = (s.code || '').toLowerCase();
        return title.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase());
      });
    }
    return list;
  }, [skills, selectedSubjectId, searchQuery]);

  // Handle Save
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const { type, data, isNew } = editingItem;

    if (type === 'exams') {
      if (isNew) {
        await adminCmsService.createExam(data);
      } else {
        await adminCmsService.updateExam(data.id, data);
      }
      showToast(`Exam ${data.name || data.code} saved.`);
    } else if (type === 'subjects') {
      if (isNew) {
        await adminCmsService.createSubject(data);
      } else {
        await adminCmsService.updateSubject(data.id, data);
      }
      showToast(`Subject ${data.name} saved.`);
    } else if (type === 'chapters') {
      if (isNew) {
        await adminCmsService.createChapter(data);
      } else {
        await adminCmsService.updateChapter(data.id, data);
      }
      showToast(`Chapter ${data.name} saved.`);
    } else if (type === 'topics') {
      if (isNew) {
        await adminCmsService.createTopic(data);
      } else {
        await adminCmsService.updateTopic(data.id, data);
      }
      showToast(`Topic ${data.name} saved.`);
    } else if (type === 'objectives') {
      if (isNew) {
        await adminCmsService.createLearningObjective(data);
      } else {
        await adminCmsService.updateLearningObjective(data.id, data);
      }
      showToast('Learning Objective saved.');
    } else if (type === 'skills') {
      if (isNew) {
        await adminCmsService.createSkill(data);
      } else {
        await adminCmsService.updateSkill(data.id, data);
      }
      showToast(`Skill ${data.title} saved.`);
    }

    refreshAll();
    setEditingItem(null);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Curriculum Hierarchy Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-400">
            Configure standardized syllabus specifications, cognitive objectives, and skills.
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'exams') {
              setEditingItem({
                type: 'exams',
                isNew: true,
                data: {
                  code: 'ECAT',
                  name: 'New Entrance Test',
                  totalMarks: 400,
                  passingMarks: 200,
                  durationMinutes: 100,
                  negativeMarking: true,
                  marksPerQuestion: 4,
                  negativeMarksPerQuestion: 1,
                  isActive: true,
                },
              });
            } else if (activeTab === 'subjects') {
              setEditingItem({
                type: 'subjects',
                isNew: true,
                data: {
                  code: 'SUBJ',
                  name: 'New Subject',
                  color: '#3b82f6',
                  icon: 'BookOpen',
                  description: '',
                },
              });
            } else if (activeTab === 'chapters') {
              setEditingItem({
                type: 'chapters',
                isNew: true,
                data: {
                  subjectId: subjects[0]?.id || 'subj-physics',
                  name: 'New Chapter',
                  code: 'CH-01',
                  sequenceOrder: chapters.length + 1,
                  description: '',
                },
              });
            } else if (activeTab === 'topics') {
              setEditingItem({
                type: 'topics',
                isNew: true,
                data: {
                  chapterId: chapters[0]?.id || 'chap-phy-mechanics',
                  name: 'New Topic',
                  sequenceOrder: topics.length + 1,
                  estimatedStudyMinutes: 60,
                  importanceRating: 4,
                  isHighYield: true,
                },
              });
            } else if (activeTab === 'objectives') {
              setEditingItem({
                type: 'objectives',
                isNew: true,
                data: {
                  topicId: topics[0]?.id || 'topic-phy-kinematics',
                  description: 'Student can explain and calculate...',
                  cognitiveLevel: 'understand' as BloomTaxonomyLevel,
                },
              });
            } else if (activeTab === 'skills') {
              setEditingItem({
                type: 'skills',
                isNew: true,
                data: {
                  subjectId: subjects[0]?.id || 'subj-physics',
                  code: 'SKILL-01',
                  title: 'New Analytical Skill',
                  description: 'Ability to identify formulas and apply conservation laws',
                },
              });
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-lg shadow-amber-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add {activeTab.slice(0, -1).replace('ie', 'y')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3 overflow-x-auto">
        {[
          { id: 'exams', label: 'Exams', count: exams.length, icon: GraduationCap },
          { id: 'subjects', label: 'Subjects', count: subjects.length, icon: BookOpen },
          { id: 'chapters', label: 'Chapters', count: chapters.length, icon: FolderTree },
          { id: 'topics', label: 'Topics', count: topics.length, icon: Layers },
          { id: 'objectives', label: 'Learning Objectives', count: objectives.length, icon: FileCheck2 },
          { id: 'skills', label: 'Skills', count: skills.length, icon: Brain },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as CurriculumTab);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
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

      {/* 1. EXAMS TAB */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-sm relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {exam.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        exam.isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {exam.isActive ? 'Active Syllabus' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{exam.name}</h3>
                  <p className="text-xs text-stone-400 mt-0.5">{exam.description}</p>
                </div>

                <button
                  onClick={() =>
                    setEditingItem({
                      type: 'exams',
                      isNew: false,
                      data: { ...exam },
                    })
                  }
                  className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition"
                  title="Edit Exam Configuration"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80 text-center">
                <div>
                  <span className="text-[10px] text-stone-400 block">Total Marks</span>
                  <span className="text-sm font-bold text-white font-mono">{exam.totalMarks}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">Duration</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {exam.durationMinutes} min
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">Negative Marking</span>
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    {exam.negativeMarking ? `-${exam.negativeMarkingPenalty || 1}` : 'None'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. SUBJECTS TAB */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 space-y-3 shadow-sm relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: `${sub.color}25`, color: sub.color }}
                  >
                    {sub.code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{sub.name}</h3>
                    <span className="text-[10px] font-mono text-stone-500">{sub.id}</span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setEditingItem({
                      type: 'subjects',
                      isNew: false,
                      data: { ...sub },
                    })
                  }
                  className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition"
                  title="Edit Subject"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed min-h-[36px]">
                {sub.description}
              </p>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
                <span>
                  Chapters: {chapters.filter((c) => c.subjectId === sub.id).length}
                </span>
                <span>
                  Skills: {skills.filter((s) => s.subjectId === sub.id).length}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. CHAPTERS TAB */}
      {activeTab === 'chapters' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Subjects ({chapters.length} chapters)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({chapters.filter((c) => c.subjectId === s.id).length})
                </option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapters by name or code..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300 min-w-[550px]">
              <thead className="bg-stone-950/80 text-stone-400 font-semibold border-b border-stone-800 text-[11px]">
                <tr>
                  <th className="px-4 py-3">Code / Seq</th>
                  <th className="px-4 py-3">Chapter Name</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Topics Count</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredChapters.map((chap) => {
                  const sub = subjects.find((s) => s.id === chap.subjectId);
                  const topicCount = topics.filter((t) => t.chapterId === chap.id).length;
                  return (
                    <tr key={chap.id} className="hover:bg-stone-800/40 transition">
                      <td className="px-4 py-3 font-mono text-amber-400 font-medium">
                        {chap.code || `#${chap.sequenceOrder}`}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        <div>{chap.name}</div>
                        {chap.description && (
                          <div className="text-[11px] text-stone-400 line-clamp-1">{chap.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-400">{sub?.name || chap.subjectId}</td>
                      <td className="px-4 py-3 font-mono">{topicCount} topics</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            setEditingItem({
                              type: 'chapters',
                              isNew: false,
                              data: { ...chap },
                            })
                          }
                          className="p-1 rounded text-stone-400 hover:text-amber-400 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TOPICS TAB */}
      {activeTab === 'topics' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedChapterId('all');
              }}
              className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Chapters</option>
              {chapters
                .filter((c) => selectedSubjectId === 'all' || c.subjectId === selectedSubjectId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300 min-w-[600px]">
              <thead className="bg-stone-950/80 text-stone-400 font-semibold border-b border-stone-800 text-[11px]">
                <tr>
                  <th className="px-4 py-3">Topic Title</th>
                  <th className="px-4 py-3">Chapter</th>
                  <th className="px-4 py-3">Est. Time</th>
                  <th className="px-4 py-3">High Yield</th>
                  <th className="px-4 py-3">Objectives</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredTopics.map((top) => {
                  const chap = chapters.find((c) => c.id === top.chapterId);
                  const objCount = objectives.filter((o) => o.topicId === top.id).length;
                  return (
                    <tr key={top.id} className="hover:bg-stone-800/40 transition">
                      <td className="px-4 py-3 font-medium text-white">{top.name}</td>
                      <td className="px-4 py-3 text-stone-400">{chap?.name || top.chapterId}</td>
                      <td className="px-4 py-3 font-mono">{top.estimatedStudyMinutes || 60}m</td>
                      <td className="px-4 py-3">
                        {top.isHighYield || (top.importanceRating && top.importanceRating >= 4) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ★ High Yield
                          </span>
                        ) : (
                          <span className="text-stone-500 text-[11px]">Standard</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">{objCount} LOs</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            setEditingItem({
                              type: 'topics',
                              isNew: false,
                              data: { ...top },
                            })
                          }
                          className="p-1 rounded text-stone-400 hover:text-amber-400 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. LEARNING OBJECTIVES TAB */}
      {activeTab === 'objectives' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 max-w-sm"
            >
              <option value="all">All Topics ({objectives.length} Objectives)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search learning objectives by statement or Bloom level..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredObjectives.map((lo) => {
              const topic = topics.find((t) => t.id === lo.topicId);
              return (
                <div
                  key={lo.id}
                  className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Bloom: {lo.bloomTaxonomyLevel || lo.cognitiveLevel || 'understand'}
                    </span>

                    <button
                      onClick={() =>
                        setEditingItem({
                          type: 'objectives',
                          isNew: false,
                          data: { ...lo },
                        })
                      }
                      className="p-1 rounded text-stone-400 hover:text-amber-400 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                    {lo.statement || lo.description}
                  </p>

                  <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-800/60">
                    <span>Topic: {topic?.name || lo.topicId}</span>
                    <span className="font-mono">{lo.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. SKILLS TAB */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pedagogical skills..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((sk) => {
              const sub = subjects.find((s) => s.id === sk.subjectId);
              return (
                <div
                  key={sk.id}
                  className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {sk.code}
                    </span>

                    <button
                      onClick={() =>
                        setEditingItem({
                          type: 'skills',
                          isNew: false,
                          data: { ...sk },
                        })
                      }
                      className="p-1 rounded text-stone-400 hover:text-amber-400 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white">{sk.name || sk.title}</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">{sk.description}</p>

                  <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-800">
                    Subject: {sub?.name || sk.subjectId}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-sm font-bold text-white capitalize">
                {editingItem.isNew ? `Add New ${editingItem.type.slice(0, -1)}` : `Edit ${editingItem.type.slice(0, -1)}`}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {editingItem.type === 'exams' && (
                <>
                  <div>
                    <label className="block text-stone-300 mb-1">Exam Name</label>
                    <input
                      type="text"
                      value={editingItem.data.name || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, name: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-300 mb-1">Total Marks</label>
                      <input
                        type="number"
                        value={editingItem.data.totalMarks || 400}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, totalMarks: parseInt(e.target.value) },
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-300 mb-1">Duration (Min)</label>
                      <input
                        type="number"
                        value={editingItem.data.durationMinutes || 100}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            data: {
                              ...editingItem.data,
                              durationMinutes: parseInt(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Description</label>
                    <textarea
                      value={editingItem.data.description || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, description: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'chapters' && (
                <>
                  <div>
                    <label className="block text-stone-300 mb-1">Subject</label>
                    <select
                      value={editingItem.data.subjectId || subjects[0]?.id}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, subjectId: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Chapter Name</label>
                    <input
                      type="text"
                      value={editingItem.data.name || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, name: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Code</label>
                    <input
                      type="text"
                      value={editingItem.data.code || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, code: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Description</label>
                    <textarea
                      value={editingItem.data.description || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, description: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'topics' && (
                <>
                  <div>
                    <label className="block text-stone-300 mb-1">Chapter</label>
                    <select
                      value={editingItem.data.chapterId || chapters[0]?.id}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, chapterId: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                    >
                      {chapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Topic Name</label>
                    <input
                      type="text"
                      value={editingItem.data.name || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, name: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="highYieldCheck"
                      checked={editingItem.data.isHighYield ?? true}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, isHighYield: e.target.checked },
                        })
                      }
                      className="rounded text-amber-500"
                    />
                    <label htmlFor="highYieldCheck" className="text-stone-300">
                      Mark as High Yield Topic
                    </label>
                  </div>
                </>
              )}

              {editingItem.type === 'objectives' && (
                <>
                  <div>
                    <label className="block text-stone-300 mb-1">Topic</label>
                    <select
                      value={editingItem.data.topicId || topics[0]?.id}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, topicId: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                    >
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Bloom Cognitive Level</label>
                    <select
                      value={editingItem.data.cognitiveLevel || 'understand'}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, cognitiveLevel: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                    >
                      <option value="remember">Remember (Knowledge Recall)</option>
                      <option value="understand">Understand (Conceptual Comprehension)</option>
                      <option value="apply">Apply (Problem Solving & Calculations)</option>
                      <option value="analyze">Analyze (Diagnostic & Deductive)</option>
                      <option value="evaluate">Evaluate (Comparative Judgments)</option>
                      <option value="create">Create (Synthesis)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Objective Statement</label>
                    <textarea
                      value={editingItem.data.description || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, description: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      rows={3}
                      required
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'skills' && (
                <>
                  <div>
                    <label className="block text-stone-300 mb-1">Subject</label>
                    <select
                      value={editingItem.data.subjectId || subjects[0]?.id}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, subjectId: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Skill Title</label>
                    <input
                      type="text"
                      value={editingItem.data.title || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, title: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Skill Code</label>
                    <input
                      type="text"
                      value={editingItem.data.code || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, code: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1">Description</label>
                    <textarea
                      value={editingItem.data.description || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, description: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-white"
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded-lg text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
                >
                  Save Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

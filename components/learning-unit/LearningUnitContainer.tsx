'use client';

import React, { useState, useEffect } from 'react';
import type { FullLearningUnit, LearningUnitSection } from '@/types/learning-unit';
import type { Question } from '@/types';
import type { MasteryResult } from '@/services/mastery/mastery.service';
import { learningUnitService } from '@/services/learning-unit/learning-unit.service';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { LearnSection } from './LearnSection';
import { ExamplesSection } from './ExamplesSection';
import { PracticeSection } from './PracticeSection';
import { AiTutorSection } from './AiTutorSection';
import { RevisionSection } from './RevisionSection';
import { MasteryTestSection } from './MasteryTestSection';
import {
  BookOpen,
  FileText,
  Target,
  Sparkles,
  RotateCcw,
  Trophy,
  ChevronRight,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface LearningUnitContainerProps {
  topicId: string;
  initialSection?: LearningUnitSection;
  onTopicChange?: (topicId: string) => void;
}

export function LearningUnitContainer({
  topicId,
  initialSection = 'learn',
  onTopicChange,
}: LearningUnitContainerProps) {
  const [activeSection, setActiveSection] = useState<LearningUnitSection>(initialSection);
  const [unitData, setUnitData] = useState<FullLearningUnit | null>(() =>
    learningUnitService.getFullLearningUnitSync(topicId)
  );
  const [prevTopicId, setPrevTopicId] = useState(topicId);
  const [tutorQuestionContext, setTutorQuestionContext] = useState<Question | null>(null);

  if (prevTopicId !== topicId) {
    setPrevTopicId(topicId);
    setUnitData(learningUnitService.getFullLearningUnitSync(topicId));
    setTutorQuestionContext(null);
  }

  if (!unitData) {
    return (
      <div className="max-w-5xl mx-auto p-6 sm:p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-500">
          <Layers className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Loading Learning Unit...</h2>
        <p className="text-xs text-stone-500">
          Preparing topics, concepts, examples, practice questions, and AI tutor context.
        </p>
      </div>
    );
  }

  const sections: Array<{
    id: LearningUnitSection;
    label: string;
    icon: React.ElementType;
    badgeCount?: number | string;
  }> = [
    {
      id: 'learn',
      label: '1. Learn',
      icon: BookOpen,
      badgeCount: unitData.unit.keyConcepts.length,
    },
    {
      id: 'examples',
      label: '2. Examples',
      icon: FileText,
      badgeCount: unitData.workedExamples.length,
    },
    {
      id: 'practice',
      label: '3. Practice',
      icon: Target,
      badgeCount: unitData.practiceQuestions.length,
    },
    {
      id: 'ai-tutor',
      label: '4. AI Tutor',
      icon: Sparkles,
    },
    {
      id: 'revision',
      label: '5. Revision',
      icon: RotateCcw,
      badgeCount: unitData.revisionData.weakConcepts.length + unitData.revisionData.previousMistakes.length,
    },
    {
      id: 'mastery-test',
      label: '6. Mastery Test',
      icon: Trophy,
      badgeCount: `${unitData.currentMasteryScore}%`,
    },
  ];

  const handleNavigateSection = (
    section: LearningUnitSection,
    questionContext?: Question
  ) => {
    if (questionContext) {
      setTutorQuestionContext(questionContext);
    }
    setActiveSection(section);
    // Smooth scroll to top of section
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleMasteryUpdated = (result: MasteryResult) => {
    setUnitData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentMasteryScore: result.updatedMasteryScore,
        currentMasteryLevel: result.masteryLevel,
      };
    });
  };

  const currentSectionIndex = sections.findIndex((s) => s.id === activeSection);
  const prevSection = currentSectionIndex > 0 ? sections[currentSectionIndex - 1] : null;
  const nextSection = currentSectionIndex < sections.length - 1 ? sections[currentSectionIndex + 1] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. TOP BREADCRUMB & SWITCHER HEADER */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 text-xs text-stone-500 flex-wrap">
              <Link
                href="/student/curriculum"
                className="hover:text-emerald-700 font-semibold transition"
              >
                Curriculum
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="font-semibold text-stone-700">{unitData.subject.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="text-stone-600 truncate max-w-[180px]">
                {unitData.chapter.name}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="text-emerald-900 font-extrabold">{unitData.topic.name}</span>
            </div>

            {/* Topic Title */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {unitData.topic.name}
              </h1>
              <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Learning Unit
              </span>
            </div>
          </div>

          {/* Quick Topic Switcher (Verifies Reusability across subjects) */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-bold text-stone-500 hidden sm:inline">Switch Topic:</span>
            <select
              id="select-learning-unit-topic"
              value={unitData.topic.id}
              onChange={(e) => {
                if (onTopicChange) {
                  onTopicChange(e.target.value);
                } else {
                  window.location.href = `/student/learn/${e.target.value}`;
                }
              }}
              className="bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer transition shadow-2xs"
            >
              <option value="topic-phy-kinematics">Physics → Kinematics</option>
              <option value="topic-phy-centripetal-force">Physics → Centripetal Force</option>
              <option value="topic-chem-atomic-structure">Chemistry → Atomic Structure</option>
              <option value="topic-math-quadratic-equations">Mathematics → Quadratic Equations</option>
              <option value="topic-bio-cell-structure">Biology → Cell Structure</option>
            </select>
          </div>
        </div>

        {/* Status Strip: Est. Time, Yield, Applicable Exams & Mastery */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1 text-stone-600 font-semibold bg-stone-100 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>{unitData.unit.estimatedMinutes} mins</span>
            </span>

            <span className="inline-flex items-center gap-1 text-amber-900 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Yield: {unitData.topic.importanceRating}/5</span>
            </span>

            <div className="flex items-center gap-1">
              {['ECAT', 'MDCAT'].map((ex) => (
                <span
                  key={ex}
                  className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200"
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>

          {/* Current Mastery Metric & Ask AI Tutor Quick Action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1 rounded-xl">
              <span className="text-stone-500 font-semibold">Mastery:</span>
              <span className="font-extrabold text-stone-900">{unitData.currentMasteryScore}%</span>
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  unitData.currentMasteryLevel === 'mastered'
                    ? 'bg-purple-100 text-purple-800'
                    : unitData.currentMasteryLevel === 'proficient'
                    ? 'bg-emerald-100 text-emerald-800'
                    : unitData.currentMasteryLevel === 'developing'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {unitData.currentMasteryLevel}
              </span>
            </div>

            <button
              id="btn-header-ask-ai-tutor"
              onClick={() => handleNavigateSection('ai-tutor')}
              className="text-xs font-extrabold text-stone-900 bg-linear-to-r from-teal-100 to-emerald-100 hover:from-teal-200 hover:to-emerald-200 border border-teal-300 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span>Ask AI Tutor</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CANONICAL 6-SECTION NAVIGATION TABS */}
      <div className="bg-white border border-stone-200 rounded-2xl p-1.5 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center min-w-max sm:min-w-0 gap-1">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;

            return (
              <button
                key={sec.id}
                id={`tab-learning-unit-${sec.id}`}
                onClick={() => handleNavigateSection(sec.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap touch-manipulation ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? sec.id === 'ai-tutor'
                        ? 'text-teal-300'
                        : sec.id === 'mastery-test'
                        ? 'text-amber-300'
                        : 'text-white'
                      : 'text-stone-400'
                  }`}
                />
                <span>{sec.label}</span>
                {sec.badgeCount !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-stone-700 text-stone-200'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {sec.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SECTION CONTENT VIEW */}
      <div className="w-full">
        {activeSection === 'learn' && (
          <LearnSection unitData={unitData} onNavigateSection={handleNavigateSection} />
        )}

        {activeSection === 'examples' && (
          <ExamplesSection unitData={unitData} onNavigateSection={handleNavigateSection} />
        )}

        {activeSection === 'practice' && (
          <PracticeSection
            unitData={unitData}
            onNavigateSection={handleNavigateSection}
          />
        )}

        {activeSection === 'ai-tutor' && (
          <AiTutorSection
            unitData={unitData}
            contextQuestion={tutorQuestionContext}
            onNavigateSection={handleNavigateSection}
          />
        )}

        {activeSection === 'revision' && (
          <RevisionSection
            unitData={unitData}
            onNavigateSection={handleNavigateSection}
          />
        )}

        {activeSection === 'mastery-test' && (
          <MasteryTestSection
            unitData={unitData}
            onMasteryUpdated={handleMasteryUpdated}
            onNavigateSection={handleNavigateSection}
          />
        )}
      </div>

      {/* 4. FOOTER PROGRESSION STEPPER */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        {prevSection ? (
          <button
            onClick={() => handleNavigateSection(prevSection.id)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous: {prevSection.label}</span>
          </button>
        ) : (
          <div />
        )}

        <div className="text-xs font-semibold text-stone-500">
          Section {currentSectionIndex + 1} of 6
        </div>

        {nextSection ? (
          <button
            onClick={() => handleNavigateSection(nextSection.id)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 transition flex items-center gap-1.5 shadow-xs"
          >
            <span>Next: {nextSection.label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => handleNavigateSection('learn')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5"
          >
            <span>Back to Start of Unit</span>
          </button>
        )}
      </div>
    </div>
  );
}

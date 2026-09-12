'use client';

import React, { useState } from 'react';
import type { FullLearningUnit } from '@/types/learning-unit';
import type { Question, DifficultyLevel, SubmitAnswerResult } from '@/types';
import { MCQ } from '@/components/common/MCQ';
import {
  Target,
  Sparkles,
  Award,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
} from 'lucide-react';

interface PracticeSectionProps {
  unitData: FullLearningUnit;
  onNavigateSection: (section: 'ai-tutor' | 'revision' | 'mastery-test', currentQuestion?: Question) => void;
}

export function PracticeSection({ unitData, onNavigateSection }: PracticeSectionProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [sessionResults, setSessionResults] = useState<Record<string, boolean>>({});

  const allQuestions = unitData.practiceQuestions;

  // Filter questions based on selected difficulty
  const filteredQuestions =
    selectedDifficulty === 'all'
      ? allQuestions
      : allQuestions.filter((q) => q.difficulty === selectedDifficulty);

  const activeQuestion: Question | undefined = filteredQuestions[currentIdx] || filteredQuestions[0];

  const handleAttemptRecorded = (res: SubmitAnswerResult) => {
    if (activeQuestion) {
      setSessionResults((prev) => ({
        ...prev,
        [activeQuestion.id]: res.isCorrect,
      }));
    }
  };

  const handleNext = () => {
    if (currentIdx < filteredQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const attemptedCount = Object.keys(sessionResults).length;
  const correctCount = Object.values(sessionResults).filter(Boolean).length;

  if (allQuestions.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-4">
        <Target className="w-10 h-10 text-stone-400 mx-auto" />
        <h3 className="text-base font-bold text-stone-900">No Practice Questions for this Topic</h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          Questions are actively being indexed for {unitData.topic.name}. In the meantime, study the Learn concepts or consult the AI Tutor.
        </p>
        <button
          onClick={() => onNavigateSection('ai-tutor')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
        >
          Ask AI Tutor
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Practice Header & Controls */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Topic Question Engine
            </span>
            <h3 className="text-base font-extrabold text-stone-900">
              {unitData.topic.name} Practice Session
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-stone-600">
              Attempted: <strong className="text-stone-900">{attemptedCount}/{allQuestions.length}</strong>
            </span>
            {attemptedCount > 0 && (
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Accuracy: {Math.round((correctCount / attemptedCount) * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Filter by Difficulty & Navigation Dots */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-stone-500 mr-1">Filter:</span>
            {['all', 'easy', 'medium', 'hard', 'exam_level'].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setSelectedDifficulty(d);
                  setCurrentIdx(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition ${
                  selectedDifficulty === d
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {d.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Quick Question Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {filteredQuestions.map((q, idx) => {
              const status = sessionResults[q.id];
              const isCurrent = currentIdx === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                    isCurrent
                      ? 'ring-2 ring-emerald-600 ring-offset-1 font-extrabold'
                      : ''
                  } ${
                    status === true
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : status === false
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Question Rendered with MCQ Component */}
      {activeQuestion && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-1 text-stone-500 font-semibold">
            <span>
              Question {currentIdx + 1} of {filteredQuestions.length}
            </span>
            <button
              onClick={() => onNavigateSection('ai-tutor', activeQuestion)}
              className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Ask AI Tutor About This Question</span>
            </button>
          </div>

          <MCQ
            key={activeQuestion.id}
            question={activeQuestion}
            sourceContext="learning_unit"
            contextId={unitData.topic.id}
            showConfidenceSelector={true}
            onAttemptRecorded={handleAttemptRecorded}
            onNext={currentIdx < filteredQuestions.length - 1 ? handleNext : undefined}
          />
        </div>
      )}

      {/* Next Steps Prompt */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-stone-700">
            Ready to validate your topic understanding under exam conditions?
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateSection('revision')}
            className="text-xs font-bold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 px-3.5 py-2 rounded-xl transition"
          >
            Review Mistakes
          </button>
          <button
            onClick={() => onNavigateSection('mastery-test')}
            className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition shadow-xs"
          >
            Take Mastery Test
          </button>
        </div>
      </div>
    </div>
  );
}

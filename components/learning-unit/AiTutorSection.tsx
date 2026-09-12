'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { FullLearningUnit } from '@/types/learning-unit';
import type { Question, ExplanationMode, TutorSessionMessage, TutorContextPayload, VerificationQuestion } from '@/types';
import { TutorMarkdownRenderer } from '@/components/tutor/TutorMarkdownRenderer';
import { aiTutorClientService } from '@/services/ai/ai-tutor.client.service';
import { tutorSessionService } from '@/services/ai/tutor-session.service';
import {
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Lightbulb,
  Bot,
  User,
  CheckCircle2,
  HelpCircle,
  Zap,
  Flame,
  ShieldCheck,
  Award,
  ChevronDown,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';

interface AiTutorSectionProps {
  unitData: FullLearningUnit;
  contextQuestion?: Question | null;
  studentId?: string;
  onNavigateSection: (section: 'learn' | 'practice' | 'mastery-test') => void;
}

const EXPLANATION_MODES: Array<{ id: ExplanationMode; label: string; icon: string; description: string }> = [
  { id: 'simple', label: 'Simple', icon: '🌱', description: 'Plain language, intuitive grasp' },
  { id: 'step_by_step', label: 'Step-by-Step', icon: '🪜', description: 'Chronological calculation stages' },
  { id: 'analogy', label: 'Analogy', icon: '💡', description: 'Real-world intuitive model' },
  { id: 'exam_focused', label: 'Exam-focused', icon: '🎯', description: 'Shortcuts, traps & speed tips' },
  { id: 'hint', label: 'Hint', icon: '🧭', description: 'Scaffold without spoiling answer' },
];

export function AiTutorSection({
  unitData,
  contextQuestion,
  studentId = '00000000-0000-0000-0000-000000000001',
  onNavigateSection,
}: AiTutorSectionProps) {
  const [activeMode, setActiveMode] = useState<ExplanationMode>('simple');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [revealedVerificationMap, setRevealedVerificationMap] = useState<Record<string, boolean>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const examType = (unitData.practiceQuestions[0]?.applicableExams[0] || 'ECAT') as any;

  // Build complete ground-truth context
  const fullContext: TutorContextPayload = tutorSessionService.buildFullTutorContext({
    topicId: unitData.topic.id,
    examType,
    questionId: contextQuestion?.id,
    studentId,
  });

  // Retrieve or initialize session
  const [session, setSession] = useState(() => {
    return tutorSessionService.getOrCreateSession({
      studentId,
      topicId: unitData.topic.id,
      examType,
      questionId: contextQuestion?.id,
      questionStatement: contextQuestion?.content,
    });
  });

  const messages = session.messages;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleSend = async (queryText?: string, modeOverride?: ExplanationMode, quickAction?: any) => {
    const text = (queryText || inputValue).trim();
    if (!text || isLoading) return;

    const chosenMode = modeOverride || activeMode;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiTutorClientService.sendMessage({
        studentId,
        query: text,
        context: fullContext,
        mode: chosenMode,
        quickAction,
        conversationHistory: messages,
        sessionId: session.id,
      });

      // Update state with updated session
      const updated = tutorSessionService.getSessionById(session.id);
      if (updated) {
        setSession({ ...updated });
      }
    } catch (err) {
      console.error('Failed to communicate with AI Tutor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: 'explain_simply' | 'give_hint' | 'show_example' | 'test_me') => {
    const modeMap: Record<string, ExplanationMode> = {
      explain_simply: 'simple',
      give_hint: 'hint',
      show_example: 'step_by_step',
      test_me: 'exam_focused',
    };
    const queryMap: Record<string, string> = {
      explain_simply: `Please explain ${unitData.topic.name} in simple, jargon-free terms with clear intuition.`,
      give_hint: `Give me a pedagogical hint on how to approach questions in ${unitData.topic.name} without spoiling the solution.`,
      show_example: `Walk me step-by-step through a typical ${examType} problem derivation for ${unitData.topic.name}.`,
      test_me: `Test my understanding of ${unitData.topic.name} with an exam-level challenge question and identify potential traps!`,
    };

    const targetMode = modeMap[action];
    setActiveMode(targetMode);
    handleSend(queryMap[action], targetMode, action);
  };

  const handleClearHistory = () => {
    tutorSessionService.clearSession(session.id);
    const welcome = aiTutorClientService.getWelcomeMessage(fullContext);
    tutorSessionService.addMessage(session.id, welcome);
    const updated = tutorSessionService.getSessionById(session.id);
    if (updated) {
      setSession({ ...updated });
    }
  };

  const toggleVerificationReveal = (msgId: string) => {
    setRevealedVerificationMap((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Grounded Curriculum Context Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Context-Aware AI Tutor
                </span>
                <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                  {examType} Syllabus
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  {unitData.subject.name} &bull; {unitData.chapter.name}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-stone-900 mt-0.5">
                {unitData.topic.name} &mdash; Socratic Mastery & Exam Guidance
              </h3>
            </div>
          </div>

          <button
            id="btn-clear-tutor-history"
            onClick={handleClearHistory}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>

        {/* Dynamic Context Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-500 font-semibold text-[11px]">Curriculum Context:</span>
          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg text-xs font-medium">
            {fullContext.keyFormulas?.length || 0} Formulas
          </span>
          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg text-xs font-medium">
            {fullContext.learningObjectives?.length || 0} Learning Objectives
          </span>
          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg text-xs font-medium">
            {fullContext.commonPitfalls?.length || 0} Pitfalls
          </span>
          {contextQuestion && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold">
              Active Question #{contextQuestion.id.slice(-4)} Loaded
            </span>
          )}
        </div>
      </div>

      {/* 2. Explanation Mode Selector & Quick Actions */}
      <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Explanation Mode:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXPLANATION_MODES.map((mode) => (
              <button
                key={mode.id}
                id={`btn-mode-${mode.id}`}
                onClick={() => setActiveMode(mode.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeMode === mode.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
                title={mode.description}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Action Prompt Triggers */}
        <div className="pt-2 border-t border-stone-200/70 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-500">Quick Actions:</span>
          <button
            id="btn-quick-explain-simply"
            onClick={() => handleQuickAction('explain_simply')}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium transition flex items-center gap-1 shadow-2xs"
          >
            <span>Explain simply</span>
          </button>
          <button
            id="btn-quick-give-hint"
            onClick={() => handleQuickAction('give_hint')}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium transition flex items-center gap-1 shadow-2xs"
          >
            <span>Give me a hint</span>
          </button>
          <button
            id="btn-quick-show-example"
            onClick={() => handleQuickAction('show_example')}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium transition flex items-center gap-1 shadow-2xs"
          >
            <span>Show another example</span>
          </button>
          <button
            id="btn-quick-test-me"
            onClick={() => handleQuickAction('test_me')}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 text-xs font-medium transition flex items-center gap-1 shadow-2xs"
          >
            <span>Test me</span>
          </button>
        </div>
      </div>

      {/* 3. Interactive Chat Stream Container */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 min-h-[400px] max-h-[560px] overflow-y-auto">
        {messages.map((msg) => {
          const isTutor = msg.role === 'tutor';
          const isRevealed = Boolean(revealedVerificationMap[msg.id]);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isTutor ? '' : 'flex-row-reverse'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isTutor
                    ? 'bg-linear-to-br from-teal-500 to-emerald-600 text-white shadow-2xs'
                    : 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                }`}
              >
                {isTutor ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 ${
                  isTutor
                    ? 'bg-stone-50/95 dark:bg-stone-800/95 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100'
                    : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                }`}
              >
                {/* Message Header with Mode Badge */}
                {isTutor && msg.mode && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/60 dark:border-stone-700/60 text-[10px]">
                    <span className="font-bold text-teal-800 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/70 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 uppercase">
                      {msg.mode.replace('_', ' ')} mode
                    </span>
                    <span className="text-stone-400 dark:text-stone-500 font-medium">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Main Markdown Text */}
                {isTutor ? (
                  <div className="font-sans leading-relaxed text-stone-800 dark:text-stone-100">
                    <TutorMarkdownRenderer content={msg.content} />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap font-sans leading-relaxed text-white dark:text-stone-900">
                    {msg.content}
                  </div>
                )}

                {/* Verification Question Card */}
                {isTutor && msg.verificationQuestion && (
                  <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200">
                      <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Verification Check: {msg.verificationQuestion.conceptTested}</span>
                    </div>
                    <p className="text-purple-950 dark:text-purple-100 font-medium italic">
                      &ldquo;{msg.verificationQuestion.question}&rdquo;
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        onClick={() => toggleVerificationReveal(msg.id)}
                        className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 flex items-center gap-1 transition"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{isRevealed ? 'Hide Hint / Answer' : 'Check Concept Hint'}</span>
                      </button>
                    </div>
                    {isRevealed && (
                      <div className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 mt-1 animate-in fade-in">
                        <strong>Explanation / Hint:</strong> {msg.verificationQuestion.suggestedAnswerOrHint}
                      </div>
                    )}
                  </div>
                )}

                {/* Follow up suggestion chips */}
                {isTutor && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                      Explore Next:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.followUpQuestions.map((fq, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(fq)}
                          disabled={isLoading}
                          className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:border-emerald-800 px-2.5 py-1 rounded-lg transition text-left"
                        >
                          {fq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested CTA */}
                {isTutor && msg.suggestedAction === 'try_question' && (
                  <div className="pt-2 border-t border-stone-200/60">
                    <button
                      onClick={() => onNavigateSection('practice')}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Practice Question on {unitData.topic.name}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>AI Tutor is formulating grounded {activeMode} explanation for {unitData.topic.name}...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 4. Interactive Input Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-ai-tutor-query"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={`Ask AI Tutor about ${unitData.topic.name} (derivation, analogies, exam shortcuts)...`}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
          <button
            id="btn-ask-ai-tutor"
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2.5 bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <span>Ask Tutor</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

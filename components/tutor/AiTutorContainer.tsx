'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { curriculumService } from '@/services/curriculum/curriculum.service';
import { aiTutorClientService } from '@/services/ai/ai-tutor.client.service';
import { tutorSessionService } from '@/services/ai/tutor-session.service';
import { useExam } from '@/lib/context/exam-context';
import { examConfigService } from '@/services/exam/exam-config.service';
import type {
  ExamType,
  ExplanationMode,
  TutorSession,
  TutorSessionMessage,
  TutorContextPayload,
} from '@/types';
import { TutorMarkdownRenderer } from './TutorMarkdownRenderer';
import {
  Brain,
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Zap,
  Flame,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronDown,
  Layers,
  History,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

interface AiTutorContainerProps {
  studentId?: string;
  initialTopicId?: string;
  initialExam?: ExamType;
  onNavigateToPractice?: (topicId: string) => void;
}

const EXPLANATION_MODES: Array<{ id: ExplanationMode; label: string; icon: string; description: string }> = [
  { id: 'simple', label: 'Simple', icon: '🌱', description: 'Plain language, intuitive grasp' },
  { id: 'step_by_step', label: 'Step-by-Step', icon: '🪜', description: 'Chronological derivations & stages' },
  { id: 'analogy', label: 'Analogy', icon: '💡', description: 'Real-world visual mental model' },
  { id: 'exam_focused', label: 'Exam-focused', icon: '🎯', description: 'Shortcuts, traps & speed elimination' },
  { id: 'hint', label: 'Hint', icon: '🧭', description: 'Scaffolding nudge without final answer' },
];

export function AiTutorContainer({
  studentId = '00000000-0000-0000-0000-000000000001',
  initialTopicId = 'topic-phy-kinematics',
  initialExam = 'ECAT',
  onNavigateToPractice,
}: AiTutorContainerProps) {
  const { selectedExam: globalExam, setSelectedExam: setGlobalExam } = useExam();
  const selectedExam = globalExam || initialExam;
  const setSelectedExam = setGlobalExam;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    selectedExam === 'MDCAT' ? 'subj-biology' : 'subj-physics'
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId);
  const [activeMode, setActiveMode] = useState<ExplanationMode>('simple');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [revealedVerificationMap, setRevealedVerificationMap] = useState<Record<string, boolean>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Derive valid subject for current exam
  const validSubjectId = useMemo(() => {
    if (examConfigService.isSubjectAllowed(selectedSubjectId, selectedExam)) {
      return selectedSubjectId;
    }
    const allowed = examConfigService.getAllowedSubjects(selectedExam);
    return allowed.length > 0 ? allowed[0].subjectId : 'subj-physics';
  }, [selectedSubjectId, selectedExam]);

  // Derive valid topic for validSubjectId
  const validTopicId = useMemo(() => {
    const topics = curriculumService.getTopicsForSubject(validSubjectId);
    if (topics.some((t) => t.id === selectedTopicId)) {
      return selectedTopicId;
    }
    return topics.length > 0 ? topics[0].id : initialTopicId;
  }, [validSubjectId, selectedTopicId, initialTopicId]);

  // Curriculum Data
  const subjects = useMemo(() => curriculumService.getSubjectsForExamSync(selectedExam), [selectedExam]);
  const topicsForSubject = useMemo(() => curriculumService.getTopicsForSubject(validSubjectId), [validSubjectId]);

  // Context Payload
  const fullContext: TutorContextPayload = useMemo(() => {
    return tutorSessionService.buildFullTutorContext({
      topicId: validTopicId,
      examType: selectedExam,
      studentId,
    });
  }, [validTopicId, selectedExam, studentId]);

  // Active Session
  const [sessionState, setSessionState] = useState<{
    key: string;
    session: TutorSession;
  }>(() => {
    const defaultSubj = selectedExam === 'MDCAT' ? 'subj-biology' : 'subj-physics';
    const top = curriculumService.getTopicsForSubject(defaultSubj)[0]?.id || initialTopicId;
    return {
      key: `${selectedExam}-${top}`,
      session: tutorSessionService.getOrCreateSession({
        studentId,
        topicId: top,
        examType: selectedExam,
      }),
    };
  });

  const sessionKey = `${selectedExam}-${validTopicId}`;
  const session = sessionState.key === sessionKey
    ? sessionState.session
    : tutorSessionService.getOrCreateSession({
        studentId,
        topicId: validTopicId,
        examType: selectedExam,
      });

  const setSession = (newSession: TutorSession) => {
    setSessionState({
      key: `${newSession.examType}-${newSession.topicId}`,
      session: newSession,
    });
  };

  const handleSelectExam = (exam: ExamType) => {
    setSelectedExam(exam);
    const newSession = tutorSessionService.getOrCreateSession({
      studentId,
      topicId: validTopicId,
      examType: exam,
    });
    setSession(newSession);
  };

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const top = curriculumService.getTopicsForSubject(subjectId)[0];
    if (top) {
      setSelectedTopicId(top.id);
      const newSession = tutorSessionService.getOrCreateSession({
        studentId,
        topicId: top.id,
        examType: selectedExam,
      });
      setSession(newSession);
    }
  };

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    const newSession = tutorSessionService.getOrCreateSession({
      studentId,
      topicId,
      examType: selectedExam,
    });
    setSession(newSession);
  };

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
      await aiTutorClientService.sendMessage({
        studentId,
        query: text,
        context: fullContext,
        mode: chosenMode,
        quickAction,
        conversationHistory: messages,
        sessionId: session.id,
      });

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
      explain_simply: `Please explain ${fullContext.topicName} in simple, intuitive terms.`,
      give_hint: `Give me a pedagogical hint on approaching tricky numericals in ${fullContext.topicName}.`,
      show_example: `Show me a step-by-step past paper problem derivation for ${fullContext.topicName}.`,
      test_me: `Test my conceptual understanding of ${fullContext.topicName} with a high-yield entrance exam question!`,
    };

    const targetMode = modeMap[action];
    setActiveMode(targetMode);
    handleSend(queryMap[action], targetMode, action);
  };

  const handleResetChat = () => {
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

  const pastSessions = useMemo(() => {
    return tutorSessionService.getSessionsForStudent(studentId);
  }, [studentId]);

  return (
    <div className="space-y-4">
      {/* Top Header & Curriculum Grounding Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Adaptive AI Tutor
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  Curriculum-Grounded
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5">
                {fullContext.topicName} &mdash; {fullContext.subjectName} ({selectedExam})
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowHistoryModal(!showHistoryModal)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-stone-500" />
              <span>Session History ({pastSessions.length})</span>
            </button>
            <button
              onClick={handleResetChat}
              className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Topic & Subject Selector Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Target Exam:
            </label>
            <select
              value={selectedExam}
              onChange={(e) => handleSelectExam(e.target.value as ExamType)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value="ECAT">ECAT (Engineering)</option>
              <option value="MDCAT">MDCAT (Medical)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Subject:
            </label>
            <select
              value={validSubjectId}
              onChange={(e) => handleSelectSubject(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Curriculum Topic:
            </label>
            <select
              value={validTopicId}
              onChange={(e) => handleSelectTopic(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {topicsForSubject.map((top) => (
                <option key={top.id} value={top.id}>
                  {top.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Context Grounding Metadata */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-500 font-bold text-[10px] uppercase">Grounded In:</span>
          <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium text-[11px]">
            {fullContext.keyFormulas?.length || 0} Formulas
          </span>
          <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium text-[11px]">
            {fullContext.learningObjectives?.length || 0} Objectives
          </span>
          <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium text-[11px]">
            {fullContext.commonPitfalls?.length || 0} Past Paper Pitfalls
          </span>
          {fullContext.studentMasteryScore !== undefined && (
            <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-semibold text-[11px]">
              Your Mastery: {fullContext.studentMasteryScore}% ({fullContext.studentMasteryStatus})
            </span>
          )}
        </div>
      </div>

      {/* History Drawer if toggled */}
      {showHistoryModal && (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-teal-600" />
              <span>Previous Tutor Sessions for You</span>
            </h4>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="text-xs text-stone-500 hover:text-stone-800 font-semibold"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto">
            {pastSessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setSession(s);
                  setSelectedTopicId(s.topicId);
                  setShowHistoryModal(false);
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                  s.id === session.id
                    ? 'bg-teal-50 border-teal-300 text-teal-950 font-semibold'
                    : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                <div className="font-bold capitalize">{s.topicName}</div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  {s.messages.length} messages &bull; {new Date(s.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode Selector & Quick Actions */}
      <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs space-y-3">
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
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
                title={mode.description}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-500">Quick Actions:</span>
          <button
            onClick={() => handleQuickAction('explain_simply')}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition"
          >
            Explain simply
          </button>
          <button
            onClick={() => handleQuickAction('give_hint')}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition"
          >
            Give me a hint
          </button>
          <button
            onClick={() => handleQuickAction('show_example')}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold transition"
          >
            Show another example
          </button>
          <button
            onClick={() => handleQuickAction('test_me')}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold transition"
          >
            Test me
          </button>
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4 min-h-[260px] sm:min-h-[380px] max-h-[60vh] sm:max-h-[520px] overflow-y-auto">
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
                {isTutor ? <Brain className="w-4 h-4" /> : <div className="text-xs font-bold">YOU</div>}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 ${
                  isTutor
                    ? 'bg-stone-50/95 dark:bg-stone-800/95 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100'
                    : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                }`}
              >
                {/* Mode Tag */}
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

                {/* Content */}
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

                {/* Follow up suggestions */}
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

                {/* Action CTA */}
                {isTutor && msg.suggestedAction === 'try_question' && onNavigateToPractice && (
                  <div className="pt-2 border-t border-stone-200/60">
                    <button
                      onClick={() => onNavigateToPractice(validTopicId)}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Practice {fullContext.topicName} Questions</span>
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
              <Brain className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>AI Tutor is formulating grounded {activeMode} explanation for {fullContext.topicName}...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-tutor-main-query"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={`Ask AI Tutor about ${fullContext.topicName} (equations, analogies, exam shortcuts)...`}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
          <button
            id="btn-tutor-main-submit"
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

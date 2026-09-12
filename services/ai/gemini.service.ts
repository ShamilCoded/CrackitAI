import { GoogleGenAI } from '@google/genai';
import type {
  AiWeaknessAnalysisRequest,
  AiWeaknessAnalysisResult,
  AiStudyPlanRequest,
  AiStudyPlanResult,
  AiTutorChatRequest,
  AiTutorChatResponse,
  AiQuestionExplanationRequest,
  AiQuestionExplanationResult,
} from '@/types';

const LIVE_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://exam-ai-backend-liart.vercel.app';

/**
 * Isolated AI Service encapsulating all Gemini / Google AI interactions.
 * Connected directly to the live 24/7 Vercel + Supabase backend.
 */
class GeminiAiService {
  private client: GoogleGenAI | null = null;
  private readonly defaultModel = 'gemini-2.5-flash';

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn(
          'GEMINI_API_KEY is not set. Service will use live API backend or deterministic fallback.'
        );
      }
      this.client = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-init' });
    }
    return this.client;
  }

  /**
   * Diagnostic Weakness Detection & Holistic Assessment
   */
  async analyzeDiagnosticWeaknesses(
    req: AiWeaknessAnalysisRequest
  ): Promise<AiWeaknessAnalysisResult> {
    if (!process.env.GEMINI_API_KEY) {
      return this.fallbackWeaknessAnalysis(req);
    }

    try {
      const ai = this.getClient();
      const prompt = `You are a top-tier Pakistani entrance exam tutor specializing in ${req.examType} (ECAT / MDCAT).
Analyze this student's diagnostic test results:
Student: ${req.studentName}
Total Score: ${req.totalScore}/${req.maxScore} (${((req.totalScore / req.maxScore) * 100).toFixed(1)}%)
Subject Breakdown: ${JSON.stringify(req.subjectScores)}
Topic Breakdown: ${JSON.stringify(req.topicBreakdown)}

Provide a strict JSON response matching this schema:
{
  "overallAssessment": "string",
  "criticalWeaknesses": [
    {
      "topicName": "string",
      "subjectName": "string",
      "gapAnalysis": "string",
      "recommendedAction": "string",
      "priority": 1
    }
  ],
  "strengths": ["string"],
  "estimatedScorePotential": {
    "current": number,
    "potentialWithPlan": number
  },
  "coachNote": "string"
}`;

      const res = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (res.text) {
        return JSON.parse(res.text) as AiWeaknessAnalysisResult;
      }
      return this.fallbackWeaknessAnalysis(req);
    } catch (error) {
      console.error('Error generating AI weakness analysis:', error);
      return this.fallbackWeaknessAnalysis(req);
    }
  }

  /**
   * Generates a Personalized Study Plan prioritizing identified gaps
   */
  async generatePersonalizedStudyPlan(
    req: AiStudyPlanRequest
  ): Promise<AiStudyPlanResult> {
    if (!process.env.GEMINI_API_KEY) {
      return this.fallbackStudyPlan(req);
    }

    try {
      const ai = this.getClient();
      const prompt = `Generate an adaptive, high-yield study plan for an ${req.examType} student.
Available Hours/Week: ${req.weeklyAvailableHours}
Target Score: ${req.targetScore ?? 'Top 1% merit'}
Target Date: ${req.targetExamDate ?? 'Upcoming season'}
Identified Weaknesses: ${JSON.stringify(req.criticalWeaknesses)}

Format as strict JSON:
{
  "planTitle": "string",
  "overviewSummary": "string",
  "totalWeeks": number,
  "items": [
    {
      "topicId": "string",
      "topicName": "string",
      "subjectName": "string",
      "priorityOrder": 1,
      "estimatedHours": number,
      "suggestedFocus": "string",
      "reason": "string"
    }
  ]
}`;

      const res = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (res.text) {
        return JSON.parse(res.text) as AiStudyPlanResult;
      }
      return this.fallbackStudyPlan(req);
    } catch (error) {
      console.error('Error generating AI study plan:', error);
      return this.fallbackStudyPlan(req);
    }
  }

  /**
   * Context-Aware Interactive AI Tutor
   * Connects to live FastAPI/Vercel backend with Supabase RAG search
   */
  async chatWithAiTutor(req: AiTutorChatRequest): Promise<AiTutorChatResponse> {
    const ctx = req.context || {
      examType: req.examType || 'ECAT',
      subjectName: req.subjectName || 'Physics',
      topicId: 'topic-phy-kinematics',
      topicName: req.topicName || 'Kinematics',
      learningObjectives: [],
      skills: [],
      keyFormulas: [],
      commonPitfalls: [],
    };

    const effectiveMode =
      req.mode ||
      (req.quickAction === 'explain_simply'
        ? 'simple'
        : req.quickAction === 'give_hint'
        ? 'hint'
        : req.quickAction === 'show_example'
        ? 'step_by_step'
        : req.quickAction === 'test_me'
        ? 'exam_focused'
        : 'simple');

    // 1. Live Backend Request
    try {
      const response = await fetch(`${LIVE_BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `${req.studentQuery} (Topic: ${ctx.topicName || 'General'}, Exam: ${ctx.examType || 'Entrance Exam'}, Mode: ${effectiveMode})`,
        }),
      });

      if (response.ok) {
        const liveData = await response.json();
        if (liveData?.answer) {
          return {
            message: liveData.answer,
            modeUsed: effectiveMode as any,
            conceptIdentified: ctx.topicName || 'General Concept',
            analogyUsed: null,
            hint: null,
            verificationQuestion: {
              question: `Did this explanation clarify ${ctx.topicName}?`,
              conceptTested: ctx.topicName,
              suggestedAnswerOrHint: 'Review key formulas if needed.',
            },
            followUpQuestions: [
              `Give me an ECAT/MDCAT past paper question on ${ctx.topicName}`,
              `Explain this with a practical real-world analogy`,
              `Show me the step-by-step mathematical derivation`,
            ],
            suggestedAction: 'try_question',
            encouragementNote: 'Great progress! Try testing your knowledge with an exam question.',
          };
        }
      }
    } catch (apiError) {
      console.warn('Live backend call failed, falling back to local handler:', apiError);
    }

    // 2. Direct Gemini fallback if key is present locally
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = this.getClient();
        const systemInstruction = `You are an elite, patient, and context-aware AI Entrance Exam Tutor for Pakistani ${ctx.examType} candidates.`;
        const res = await ai.models.generateContent({
          model: this.defaultModel,
          contents: `${systemInstruction}\n\nStudent Query: "${req.studentQuery}"\nRequested Mode: ${effectiveMode}`,
        });

        if (res.text) {
          return {
            message: res.text,
            modeUsed: effectiveMode as any,
            conceptIdentified: ctx.topicName,
            followUpQuestions: [`Explain more about ${ctx.topicName}`],
            suggestedAction: 'try_question',
          };
        }
      } catch (geminiError) {
        console.error('Local Gemini error:', geminiError);
      }
    }

    // 3. Deterministic safe offline fallback
    return this.fallbackContextualTutorResponse(req, ctx, effectiveMode);
  }

  /**
   * Deterministic fallback for offline testing
   */
  private fallbackContextualTutorResponse(
    req: AiTutorChatRequest,
    ctx: any,
    mode: string
  ): AiTutorChatResponse {
    const topic = ctx.topicName || 'Kinematics';
    const formulas = ctx.keyFormulas || [];
    const primaryFormula = formulas[0] || 'v_f = v_i + a·t';

    return {
      message: `### Understanding ${topic}\n\nIn ${ctx.subjectName || 'Science'} for ${ctx.examType || 'Exam'}, **${topic}** revolves around fundamental equations and systematic application.\n\n• Key formula: \`${primaryFormula}\``,
      modeUsed: (mode as any) || 'simple',
      conceptIdentified: topic,
      verificationQuestion: {
        question: `What is the most critical variable to track in ${topic}?`,
        conceptTested: topic,
        suggestedAnswerOrHint: 'Check initial conditions and units before solving.',
      },
      followUpQuestions: [
        `Explain the core formula (${primaryFormula}) step-by-step`,
        `Show me a past paper trap question on ${topic}`,
      ],
      suggestedAction: 'try_question',
      suggestedFormulaOrFact: primaryFormula,
      encouragementNote: 'Keep up the practice!',
    };
  }

  /**
   * Detailed Step-by-Step Question Explanation
   */
  async explainQuestionStepByStep(
    req: AiQuestionExplanationRequest
  ): Promise<AiQuestionExplanationResult> {
    const correctOpt = req.options.find((o) => o.isCorrect);
    const selectedOpt = req.options.find((o) => o.id === req.studentSelectedOptionId);
    const isCorrect = Boolean(selectedOpt?.isCorrect);

    if (!process.env.GEMINI_API_KEY) {
      return {
        isCorrect,
        coreConcept: 'Fundamental principle application',
        stepByStepSolution: [
          'Identify known and required quantities from the question statement.',
          `Eliminate distractors and verify why "${correctOpt?.text}" matches the governing relation.`,
        ],
        commonMisconception: 'Applying equations without verifying boundary conditions or signs.',
        examShortcutOrTip: 'Check dimensional units first to eliminate at least 2 options immediately.',
      };
    }

    try {
      const ai = this.getClient();
      const prompt = `Explain this ${req.examType} exam question:
Statement: ${req.questionContent}
Options: ${JSON.stringify(req.options)}
Student chose: ${selectedOpt ? selectedOpt.text : 'None yet'}

Respond with JSON:
{
  "isCorrect": boolean,
  "coreConcept": "string",
  "stepByStepSolution": ["step 1", "step 2", "step 3"],
  "commonMisconception": "string",
  "examShortcutOrTip": "string"
}`;

      const res = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      if (res.text) {
        return JSON.parse(res.text) as AiQuestionExplanationResult;
      }
      throw new Error('Empty explanation');
    } catch (error) {
      console.error('Error explaining question:', error);
      return {
        isCorrect,
        coreConcept: 'Core syllabus concept',
        stepByStepSolution: [
          'Recognize key variables.',
          `The mathematically valid option is: ${correctOpt?.text}.`,
        ],
        commonMisconception: 'Rushing calculations under strict entrance test time constraints.',
        examShortcutOrTip: 'Use order-of-magnitude estimation.',
      };
    }
  }

  /**
   * Generates AI personalized coaching advice for the active study sprint
   */
  async generatePersonalizationCoachAdvice(context: {
    examType: string;
    targetScore?: number;
    goalExamDate?: string;
    averageMastery: number;
    topWeakTopics: string[];
    topStrongTopics: string[];
    dailyAvailableMinutes: number;
  }): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      return `Welcome to your ${context.examType} study sprint! Your current mastery is ${context.averageMastery}%. With ${context.dailyAvailableMinutes} minutes dedicated today, prioritizing ${context.topWeakTopics.slice(0, 2).join(' and ')} will yield the fastest score recovery.`;
    }

    try {
      const ai = this.getClient();
      const prompt = `You are an encouraging and high-performance AI Exam Coach for Pakistani ${context.examType} students.
Exam: ${context.examType}
Target Score: ${context.targetScore ?? 'Competitive Top Merit'}
Goal Date: ${context.goalExamDate ?? 'Upcoming season'}
Current Average Mastery: ${context.averageMastery}%
Daily Time Budget: ${context.dailyAvailableMinutes} mins
Top Critical Weak Topics: ${context.topWeakTopics.join(', ')}
Top Strengths: ${context.topStrongTopics.join(', ')}

Write a concise, 2-3 sentence personalized coach note. Give clear advice on what to focus on today and why addressing these specific weaknesses unlocks rapid mark gains. Keep it motivating and professional.`;

      const res = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
      });

      if (res.text) {
        return res.text.trim();
      }
      return `Targeting ${context.topWeakTopics[0] || 'core mechanics'} in today's ${context.dailyAvailableMinutes} min session is your fastest path to boosting your ${context.examType} score.`;
    } catch {
      return `Targeting ${context.topWeakTopics[0] || 'core mechanics'} in today's ${context.dailyAvailableMinutes} min session is your fastest path to boosting your ${context.examType} score.`;
    }
  }

  /**
   * Generates AI enriched "Why am I seeing this?" pedagogical insight
   */
  async generatePersonalizedWhyRationale(context: {
    examType: string;
    topicName: string;
    subjectName: string;
    masteryScore: number;
    masteryStatus: string;
    importanceRating: number;
    accuracy?: number;
    retentionAlert?: string;
  }): Promise<{ pedagogicalObjective: string; aiCoachTip: string }> {
    if (!process.env.GEMINI_API_KEY) {
      return {
        pedagogicalObjective: `Remediate ${context.topicName} (${context.masteryScore}% mastery) to prevent repeated calculation errors on high-yield ${context.examType} questions.`,
        aiCoachTip: `Focus on mastering the governing equations and drawing free-body/reaction diagrams before attempting speed drills.`,
      };
    }

    try {
      const ai = this.getClient();
      const prompt = `You are an AI Entrance Exam Tutor for ${context.examType}.
Topic: ${context.topicName} (${context.subjectName})
Mastery: ${context.masteryScore}% (${context.masteryStatus})
Exam Importance Rating: ${context.importanceRating}/5
Recent Accuracy: ${context.accuracy ?? 'N/A'}%
Retention Alert: ${context.retentionAlert ?? 'None'}

Provide strict JSON with two concise fields:
{
  "pedagogicalObjective": "1 direct sentence explaining why mastering this specific topic is pedagogically crucial for the student right now.",
  "aiCoachTip": "1 practical, actionable tip or mental shortcut for this topic."
}`;

      const res = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      if (res.text) {
        return JSON.parse(res.text);
      }
      throw new Error('Empty AI response');
    } catch {
      return {
        pedagogicalObjective: `Remediate ${context.topicName} (${context.masteryScore}% mastery) to prevent repeated calculation errors on high-yield ${context.examType} questions.`,
        aiCoachTip: `Focus on mastering the governing equations and drawing free-body/reaction diagrams before attempting speed drills.`,
      };
    }
  }

  // --- Fallback Handlers ---
  private fallbackWeaknessAnalysis(
    req: AiWeaknessAnalysisRequest
  ): AiWeaknessAnalysisResult {
    const critical = req.topicBreakdown
      .filter((t) => t.accuracyPercentage < 50)
      .map((t, idx) => ({
        topicName: t.topicName,
        subjectName: t.subjectName,
        gapAnalysis: `Low accuracy (${t.accuracyPercentage}%) in ${t.topicName} indicates need for conceptual review and formula derivation.`,
        recommendedAction: `Complete Learning Unit for ${t.topicName} followed by 10 targeted practice questions.`,
        priority: (idx + 1 <= 3 ? idx + 1 : 3) as 1 | 2 | 3,
      }));

    return {
      overallAssessment: `Diagnostic baseline completed for ${req.examType}. Score: ${req.totalScore}/${req.maxScore}. Priority focus is required on foundational mechanics and equilibrium calculations.`,
      criticalWeaknesses: critical.length > 0 ? critical : [
        {
          topicName: 'Centripetal Force & Banking',
          subjectName: 'Physics',
          gapAnalysis: 'Conceptual confusion between centripetal net force and centrifugal fictitious frames.',
          recommendedAction: 'Review free body diagrams on inclined circular tracks.',
          priority: 1,
        },
      ],
      strengths: ['Strong reading comprehension', 'Steady baseline pacing'],
      estimatedScorePotential: {
        current: Math.round((req.totalScore / (req.maxScore || 1)) * 100),
        potentialWithPlan: Math.min(100, Math.round((req.totalScore / (req.maxScore || 1)) * 100) + 28),
      },
      coachNote: 'With systematic topic-level mastery, high-yield practice, and error review, you can reliably bridge this gap.',
    };
  }

  private fallbackStudyPlan(req: AiStudyPlanRequest): AiStudyPlanResult {
    return {
      planTitle: `${req.examType} High-Yield Sprint Plan`,
      overviewSummary: `Targeted plan addressing ${req.criticalWeaknesses.length} critical gaps over a structured timetable.`,
      totalWeeks: 4,
      items: req.criticalWeaknesses.map((w, i) => ({
        topicId: w.topicId,
        topicName: w.topicName,
        subjectName: w.subjectName,
        priorityOrder: i + 1,
        estimatedHours: 4,
        suggestedFocus: 'Concept review, core formulas, and past paper MCQ drills.',
        reason: 'Identified as a high-weight weakness during diagnostic assessment.',
      })),
    };
  }
}

export const aiService = new GeminiAiService();
export const geminiAiService = aiService;

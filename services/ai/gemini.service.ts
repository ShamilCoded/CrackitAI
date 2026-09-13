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
          'GEMINI_API_KEY is not set. Operating via live backend API or deterministic fallback.'
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
      const prompt = `You are an expert exam tutor specializing in ${req.examType}.
Analyze this student's diagnostic test results:
Student: ${req.studentName}
Total Score: ${req.totalScore}/${req.maxScore} (${((req.totalScore / req.maxScore) * 100).toFixed(1)}%)
Subject Breakdown: ${JSON.stringify(req.subjectScores)}
Topic Breakdown: ${JSON.stringify(req.topicBreakdown)}

Provide a strict JSON response:
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
        config: { responseMimeType: 'application/json' },
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
Target Score: ${req.targetScore ?? 'Top merit'}
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
        config: { responseMimeType: 'application/json' },
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
   */
  async chatWithAiTutor(req: AiTutorChatRequest): Promise<AiTutorChatResponse> {
    const ctx = req.context || {
      examType: req.examType || 'ECAT',
      subjectName: req.subjectName || 'Physics',
      topicId: 'topic-phy-general',
      topicName: req.topicName || 'Physics',
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
          question: `Subject: ${ctx.subjectName}, Active Topic Context: ${ctx.topicName}, Exam: ${ctx.examType}. Query: "${req.studentQuery}". Instructions: Explain the asked concept clearly. Do NOT refuse to answer questions about any science/curriculum topic. Never use greetings like "Assalam-o-Alaikum" or colloquial terms. Start directly with the answer. Mode: ${effectiveMode}`,
        }),
      });

      if (response.ok) {
        const liveData = await response.json();
        const rawAnswer = liveData?.answer || liveData?.message || '';

        if (rawAnswer) {
          // Sanitize any residual greetings
          const cleanAnswer = rawAnswer.replace(/assalam[- ]?o[- ]?alaikum[!.,]?\s*/gi, '').trim();

          return {
            message: cleanAnswer,
            modeUsed: effectiveMode as any,
            conceptIdentified: req.studentQuery || ctx.topicName,
            analogyUsed: undefined,
            hint: undefined,
            verificationQuestion: {
              question: `How would you define or calculate this in an exam scenario?`,
              conceptTested: ctx.topicName,
              suggestedAnswerOrHint: 'Review formulas and key relationships.',
            },
            followUpQuestions: [
              `Explain this step-by-step with formulas`,
              `Show an exam-style trap question on this concept`,
              `Provide a real-world application or analogy`,
            ],
            suggestedAction: 'try_question',
            encouragementNote: 'Review the steps and practice a numerical problem.',
          };
        }
      }
    } catch (apiError) {
      console.warn('Live backend call error, falling back to local model:', apiError);
    }

    // 2. Direct Gemini fallback
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = this.getClient();
        const systemInstruction = `You are a professional science and exam tutor for ${ctx.examType}.
RULES:
1. NEVER say "Assalam-o-Alaikum" or any greeting. Begin directly with the technical or conceptual answer.
2. ALWAYS answer the student's question directly, even if it belongs to another chapter or general science topic. Never reject or refuse relevant academic questions.
3. Keep the tone academic, clear, and objective.
4. Provide standard formulas, SI units, and exam tips.`;

        const res = await ai.models.generateContent({
          model: this.defaultModel,
          contents: `${systemInstruction}\n\nQuestion: "${req.studentQuery}"\nExplanation Mode: ${effectiveMode}`,
        });

        if (res.text) {
          const clean = res.text.replace(/assalam[- ]?o[- ]?alaikum[!.,]?\s*/gi, '').trim();
          return {
            message: clean,
            modeUsed: effectiveMode as any,
            conceptIdentified: req.studentQuery,
            followUpQuestions: [
              `How does this apply to past exam questions?`,
              `Show the mathematical derivation`,
            ],
            suggestedAction: 'try_question',
          };
        }
      } catch (geminiError) {
        console.error('Gemini call failed:', geminiError);
      }
    }

    // 3. Deterministic generic fallback
    return this.fallbackContextualTutorResponse(req, ctx, effectiveMode);
  }

  private fallbackContextualTutorResponse(
    req: AiTutorChatRequest,
    ctx: any,
    mode: string
  ): AiTutorChatResponse {
    const query = req.studentQuery || 'Concept';
    return {
      message: `### Overview: ${query}\n\nIn **${ctx.subjectName || 'Physics'}**, understanding the core definitions and their mathematical formulas is essential for solving entrance exam MCQs.\n\n• Ensure all values are converted to standard SI units.\n• Look out for vector vs scalar representations.\n• Focus on direct and inverse proportions between key variables.`,
      modeUsed: (mode as any) || 'simple',
      conceptIdentified: query,
      verificationQuestion: {
        question: `What are the standard SI units associated with this quantity?`,
        conceptTested: query,
        suggestedAnswerOrHint: 'Check dimensional analysis formulas.',
      },
      followUpQuestions: [
        `Show the complete formula breakdown`,
        `What are typical past paper traps here?`,
      ],
      suggestedAction: 'try_question',
      encouragementNote: 'Consistent conceptual practice ensures accuracy in speed tests.',
    };
  }

  async explainQuestionStepByStep(
    req: AiQuestionExplanationRequest
  ): Promise<AiQuestionExplanationResult> {
    const correctOpt = req.options.find((o) => o.isCorrect);
    const selectedOpt = req.options.find((o) => o.id === req.studentSelectedOptionId);
    const isCorrect = Boolean(selectedOpt?.isCorrect);

    if (!process.env.GEMINI_API_KEY) {
      return {
        isCorrect,
        coreConcept: 'Physics Core Principle',
        stepByStepSolution: [
          'Identify the given values from the problem statement.',
          `Eliminate distractor choices and note that "${correctOpt?.text}" satisfies the relation.`,
        ],
        commonMisconception: 'Neglecting sign conventions or SI unit conversions.',
        examShortcutOrTip: 'Use dimensional inspection to eliminate incompatible units.',
      };
    }

    try {
      const ai = this.getClient();
      const prompt = `Explain this exam question concisely without greetings:
Statement: ${req.questionContent}
Options: ${JSON.stringify(req.options)}
Student chose: ${selectedOpt ? selectedOpt.text : 'None yet'}

JSON response:
{
  "isCorrect": boolean,
  "coreConcept": "string",
  "stepByStepSolution": ["step 1", "step 2"],
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
      throw new Error('Empty response');
    } catch {
      return {
        isCorrect,
        coreConcept: 'Core Syllabus Principle',
        stepByStepSolution: [
          'Extract variables and identify target unknown.',
          `Correct choice is: ${correctOpt?.text}.`,
        ],
        commonMisconception: 'Arithmetic rush under time limits.',
        examShortcutOrTip: 'Estimate orders of magnitude before detailed math.',
      };
    }
  }

  async generatePersonalizationCoachAdvice(context: any): Promise<string> {
    return `Your current average mastery is ${context.averageMastery}%. Focusing your session on weak topics today will maximize your score improvement for ${context.examType}.`;
  }

  async generatePersonalizedWhyRationale(context: any): Promise<{ pedagogicalObjective: string; aiCoachTip: string }> {
    return {
      pedagogicalObjective: `Mastering ${context.topicName} prevents common errors in high-yield ${context.examType} questions.`,
      aiCoachTip: `Focus on mastering the governing equations and drawing diagrams before speed drills.`,
    };
  }

  private fallbackWeaknessAnalysis(req: AiWeaknessAnalysisRequest): AiWeaknessAnalysisResult {
    return {
      overallAssessment: `Diagnostic baseline completed for ${req.examType}. Total Score: ${req.totalScore}/${req.maxScore}.`,
      criticalWeaknesses: [
        {
          topicName: 'Core Principles',
          subjectName: 'Physics',
          gapAnalysis: 'Need conceptual consolidation on formula derivation and units.',
          recommendedAction: 'Review formula sheets and attempt 15 timed MCQs.',
          priority: 1,
        },
      ],
      strengths: ['Analytical reading', 'Pacing'],
      estimatedScorePotential: {
        current: Math.round((req.totalScore / (req.maxScore || 1)) * 100),
        potentialWithPlan: Math.min(100, Math.round((req.totalScore / (req.maxScore || 1)) * 100) + 25),
      },
      coachNote: 'Targeted practice on high-frequency questions yields consistent improvement.',
    };
  }

  private fallbackStudyPlan(req: AiStudyPlanRequest): AiStudyPlanResult {
    return {
      planTitle: `${req.examType} High-Yield Study Plan`,
      overviewSummary: `Focused roadmap targeting key syllabus concepts over 4 weeks.`,
      totalWeeks: 4,
      items: (req.criticalWeaknesses || []).map((w, i) => ({
        topicId: w.topicId,
        topicName: w.topicName,
        subjectName: w.subjectName,
        priorityOrder: i + 1,
        estimatedHours: 4,
        suggestedFocus: 'Concept derivation and past paper practice.',
        reason: 'Identified as a high-weight syllabus area.',
      })),
    };
  }
}

export const aiService = new GeminiAiService();
export const geminiAiService = aiService;

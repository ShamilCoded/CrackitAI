import type {
  ExamType,
  AiTutorChatRequest,
  AiTutorChatResponse,
  ExplanationMode,
  TutorContextPayload,
  VerificationQuestion,
  TutorSessionMessage,
} from '@/types';
import { tutorSessionService } from './tutor-session.service';

const LIVE_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://exam-ai-backend-liart.vercel.app';

export interface SendTutorMessageParams {
  studentId?: string;
  query: string;
  context: TutorContextPayload;
  mode?: ExplanationMode;
  quickAction?: 'explain_simply' | 'give_hint' | 'show_example' | 'test_me';
  conversationHistory?: TutorSessionMessage[];
  sessionId?: string;
}

export class AiTutorClientService {
  getSuggestedPrompts(context: TutorContextPayload): string[] {
    const topic = context.topicName;
    const formulaHint = context.keyFormulas?.[0] ? ` (${context.keyFormulas[0]})` : '';

    return [
      `Explain ${topic} simply for ${context.examType}`,
      `Show the step-by-step formula breakdown${formulaHint}`,
      `Give an intuitive analogy for ${topic}`,
      `What are the most common exam traps in ${context.examType}?`,
      `Test my understanding with a conceptual challenge question`,
    ];
  }

  getWelcomeMessage(context: TutorContextPayload): TutorSessionMessage {
    const formulaSnippet =
      context.keyFormulas && context.keyFormulas.length > 0
        ? ` Key relation: "${context.keyFormulas[0]}".`
        : '';

    return {
      id: `welcome-${context.topicId}-${Date.now()}`,
      role: 'tutor',
      content: `Welcome to your AI Tutor for **${context.topicName}** (${context.subjectName} - ${context.examType}).${formulaSnippet}\n\nFeel free to ask any question about this topic or general ${context.subjectName} concepts. You can request simple explanations, step-by-step derivations, or practice questions.`,
      mode: 'simple',
      timestamp: new Date().toISOString(),
      followUpQuestions: [
        `Explain ${context.topicName} simply`,
        `Show step-by-step derivation`,
        `Give an analogy for this`,
        `What are the frequent traps in ${context.topicName}?`,
      ],
      suggestedAction: 'review_formula',
    };
  }

  async sendMessage(params: SendTutorMessageParams): Promise<TutorSessionMessage> {
    const {
      studentId = '00000000-0000-0000-0000-000000000001',
      query,
      context,
      mode = 'simple',
      quickAction,
      conversationHistory = [],
      sessionId,
    } = params;

    const studentMessage: TutorSessionMessage = {
      id: `msg-student-${Date.now()}`,
      role: 'student',
      content: query,
      mode,
      timestamp: new Date().toISOString(),
    };

    if (sessionId) {
      tutorSessionService.addMessage(sessionId, studentMessage);
    }

    const promptPayload = {
      topic: context.topicName || 'General',
      question: `Subject: ${context.subjectName || 'Science'}, Context: ${context.topicName || 'General'}, Exam: ${context.examType || 'Exam'}, Mode: ${mode}. Question: "${query}". Instructions: Explain this concept thoroughly. Do not reject questions outside the current subtopic. Never greet with Assalam-o-Alaikum or greetings; answer directly with clear definitions, formulas, and examples.`,
    };

    try {
      const response = await fetch(`${LIVE_BACKEND_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptPayload),
      });

      if (response.ok) {
        const data = await response.json();
        let answerText = data.answer || data.message || '';
        answerText = answerText.replace(/assalam[- ]?o[- ]?alaikum[!.,]?\s*/gi, '').trim();

        const tutorMessage: TutorSessionMessage = {
          id: `msg-tutor-${Date.now()}`,
          role: 'tutor',
          content: answerText,
          mode,
          verificationQuestion: {
            question: `How would you apply this concept in a numerical problem?`,
            conceptTested: context.topicName,
            suggestedAnswerOrHint: 'Check formulas and SI units before solving.',
          },
          followUpQuestions: [
            `Show a step-by-step example with numbers`,
            `What is the most common exam distractor for this?`,
            `How does this relate to other physics laws?`,
          ],
          suggestedAction: 'try_question',
          timestamp: new Date().toISOString(),
        };

        if (sessionId) {
          tutorSessionService.addMessage(sessionId, tutorMessage);
        }
        return tutorMessage;
      }
      throw new Error(`Server returned status: ${response.status}`);
    } catch (err) {
      console.warn('Live AI call failed, generating contextual fallback:', err);
      const fallback = this.generateDynamicTopicFallback(query, context, mode);
      if (sessionId) {
        tutorSessionService.addMessage(sessionId, fallback);
      }
      return fallback;
    }
  }

  private generateDynamicTopicFallback(
    query: string,
    context: TutorContextPayload,
    mode: ExplanationMode
  ): TutorSessionMessage {
    const formulas = context.keyFormulas || [];
    const primaryFormula = formulas[0] || 'Governing relation';

    let content = `### Concept Explanation\n\nWhen studying **${query}** within ${context.subjectName || 'Physics'}:\n\n* **Core Definition**: Relate physical quantities using standard definitions and boundary conditions.\n* **Formula Reference**: \`${primaryFormula}\`\n* **Unit Verification**: Always ensure values match standard SI units prior to solving.`;

    if (mode === 'step_by_step') {
      content = `### Step-by-Step Breakdown: ${query}\n\n1. **Identify Knowns and Unknowns**: Write down given values.\n2. **Select Governing Equation**: Choose the equation that links the variables directly.\n3. **Isolate Variable**: Solve algebraically before inserting numbers.\n4. **Check Physical Validity**: Verify that units and signs make physical sense.`;
    } else if (mode === 'analogy') {
      content = `### Conceptual Model for ${query}\n\nThink of this concept as balance in a closed system: any change in one variable immediately scales the opposing or resulting variable, maintaining physical equilibrium.`;
    }

    return {
      id: `msg-tutor-fallback-${Date.now()}`,
      role: 'tutor',
      content,
      mode,
      verificationQuestion: {
        question: 'What are the SI units of this quantity?',
        conceptTested: query,
        suggestedAnswerOrHint: 'Derive from fundamental base units.',
      },
      timestamp: new Date().toISOString(),
      followUpQuestions: [
        `Show the formula breakdown step-by-step`,
        `Give an exam-style trap question on this`,
      ],
      suggestedAction: 'try_question',
    };
  }
}

export const aiTutorClientService = new AiTutorClientService();

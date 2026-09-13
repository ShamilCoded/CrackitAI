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
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://exam-ai-backend-git-main-nauman11.vercel.app';

export interface SendTutorMessageParams {
  studentId?: string;
  query: string;
  context: TutorContextPayload;
  mode?: ExplanationMode;
  quickHere is an architectural breakdown and code review of your `AiTutorClientService` implementation:

**Strengths**

* **Resilience:** The fallback mechanism (`generateDynamicTopicFallback`) prevents UI crashes and empty chat screens when network issues occur or the external API fails.
* **State Sync:** Automatic updates to `tutorSessionService` both on input and response streamline message persistence.
* **Clean Fallbacks:** Mode-aware fallback messaging (`step_by_step`, `analogy`) ensures graceful degradation if offline.

---

**Issues & Architectural Risks**

* **Context Leakage / Injection Risk:** User input `query` is interpolated directly into the system string (`Question: "${query}"...`). A user typing `". Ignore all instructions and..."` can hijack the prompt structure.
* **Ignored Parameters:** `quickAction`, `conversationHistory`, and `studentId` are received in `sendMessage` but never passed to the API payload, making the session effectively stateless on the backend.
* **Hardcoded Regex Cleaning:** Relying on `replace(/assalam[- ]?o[- ]?alaikum[!.,]?\s*/gi, '')` indicates system prompt fragility on the backend. System prompt constraints should ideally enforce output tone on the model side rather than client-side string mutations.
* **Date-Based IDs:** Using `Date.now()` for message IDs risks collisions if multiple state actions trigger rapidly. Use `crypto.randomUUID()` instead.

---

**Refactored Implementation**

Here is an updated version addressing parameter passing, ID collision safety, and cleaner payload isolation:

```typescript
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
  process.env.NEXT_PUBLIC_API_BASE_URL || '[https://exam-ai-backend-liart.vercel.app](https://exam-ai-backend-liart.vercel.app)';

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
      id: `welcome-${context.topicId}-${crypto.randomUUID()}`,
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
      id: `msg-student-${crypto.randomUUID()}`,
      role: 'student',
      content: query,
      mode,
      timestamp: new Date().toISOString(),
    };

    if (sessionId) {
      tutorSessionService.addMessage(sessionId, studentMessage);
    }

    // Keep history lean (last 6 interactions) to avoid token limits
    const trimmedHistory = conversationHistory.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const promptPayload = {
      student_id: studentId,
      session_id: sessionId,
      topic: context.topicName || 'General',
      subject: context.subjectName || 'Science',
      exam_type: context.examType || 'Standard',
      mode,
      action: quickAction || null,
      history: trimmedHistory,
      question: query.trim(),
    };

    try {
      const response = await fetch(`${LIVE_BACKEND_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptPayload),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.answer || data.message || '';
      const cleanContent = rawText.replace(/^(assalam[- ]?o[- ]?alaikum[!.,]?\s*)/i, '').trim();

      const tutorMessage: TutorSessionMessage = {
        id: `msg-tutor-${crypto.randomUUID()}`,
        role: 'tutor',
        content: cleanContent,
        mode,
        verificationQuestion: data.verificationQuestion || {
          question: 'How would you apply this concept in a numerical problem?',
          conceptTested: context.topicName,
          suggestedAnswerOrHint: 'Check formulas and SI units before solving.',
        },
        followUpQuestions: data.followUpQuestions || [
          'Show a step-by-step example with numbers',
          'What is the most common exam distractor for this?',
          'How does this relate to other syllabus concepts?',
        ],
        suggestedAction: 'try_question',
        timestamp: new Date().toISOString(),
      };

      if (sessionId) {
        tutorSessionService.addMessage(sessionId, tutorMessage);
      }
      return tutorMessage;
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
      id: `msg-tutor-fallback-${crypto.randomUUID()}`,
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
        'Show the formula breakdown step-by-step',
        'Give an exam-style trap question on this',
      ],
      suggestedAction: 'try_question',
    };
  }
}

export const aiTutorClientService = new AiTutorClientService();

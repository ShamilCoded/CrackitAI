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
  /**
   * Generates dynamic starter prompts tailored to the active topic
   */
  getSuggestedPrompts(context: TutorContextPayload): string[] {
    const topic = context.topicName;
    const formulaHint = context.keyFormulas?.[0] ? ` (${context.keyFormulas[0]})` : '';

    return [
      `Explain ${topic} simply for ${context.examType}`,
      `Show me the step-by-step formula breakdown${formulaHint}`,
      `Give me an intuitive analogy for ${topic}`,
      `What are the most common traps and tricks in ${context.examType}?`,
      `Test my conceptual understanding with a challenge question`,
    ];
  }

  /**
   * Generates initial greeting grounded in the current topic context
   */
  getWelcomeMessage(context: TutorContextPayload): TutorSessionMessage {
    const formulaSnippet =
      context.keyFormulas && context.keyFormulas.length > 0
        ? ` Key governing formula: "${context.keyFormulas[0]}".`
        : '';

    return {
      id: `welcome-${context.topicId}-${Date.now()}`,
      role: 'tutor',
      content: `Salam! I am your CrackIt.ai Tutor for **${context.topicName}** (${context.subjectName} for ${context.examType}).${formulaSnippet}\n\nAsk me to explain this concept simply, show a step-by-step calculation, share a real-world analogy, or test your readiness with a verification question. What would you like to focus on?`,
      mode: 'simple',
      timestamp: new Date().toISOString(),
      followUpQuestions: [
        `Explain ${context.topicName} simply`,
        `Show step-by-step derivation`,
        `Give me a real-world analogy`,
        `What is the #1 exam trap in ${context.topicName}?`,
      ],
      suggestedAction: 'review_formula',
    };
  }

  /**
   * Dispatches student query to the secure server API route with complete topic context
   */
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

    // If session ID is provided, record student query
    if (sessionId) {
      tutorSessionService.addMessage(sessionId, studentMessage);
    }

    const payload: AiTutorChatRequest = {
      studentId,
      studentQuery: query,
      mode,
      quickAction,
      context,
      conversationHistory: conversationHistory.map((m) => ({
        id: m.id,
        role: m.role as 'student' | 'tutor',
        content: m.content,
        timestamp: m.timestamp,
      })),
      // Legacy compatibility
      examType: context.examType,
      subjectName: context.subjectName,
      topicName: context.topicName,
      currentQuestion: context.currentQuestion
        ? {
            statement: context.currentQuestion.statement,
            options: context.currentQuestion.options.map((o) => o.text),
            selectedOption: context.currentQuestion.selectedOptionText,
            correctOption: context.currentQuestion.correctOptionText,
            explanation: context.currentQuestion.explanation,
          }
        : undefined,
    };

    try {
      const response = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data: AiTutorChatResponse = await response.json();
        const tutorMessage: TutorSessionMessage = {
          id: `msg-tutor-${Date.now()}`,
          role: 'tutor',
          content: data.message,
          mode: data.modeUsed || mode,
          verificationQuestion: data.verificationQuestion,
          followUpQuestions: data.followUpQuestions,
          suggestedAction: data.suggestedAction,
          timestamp: new Date().toISOString(),
        };

        if (sessionId) {
          tutorSessionService.addMessage(sessionId, tutorMessage);
        }
        return tutorMessage;
      }
      throw new Error(`Server returned status: ${response.status}`);
    } catch (err) {
      console.warn('Network call to AI tutor route failed, generating contextual fallback:', err);
      const fallback = this.generateDynamicTopicFallback(query, context, mode);
      if (sessionId) {
        tutorSessionService.addMessage(sessionId, fallback);
      }
      return fallback;
    }
  }

  /**
   * Dynamic fallback grounded in topic data when offline or without API keys.
   */
  private generateDynamicTopicFallback(
    query: string,
    context: TutorContextPayload,
    mode: ExplanationMode
  ): TutorSessionMessage {
    const topic = context.topicName;
    const formulas = context.keyFormulas || [];
    const primaryFormula = formulas[0] || 'Core governing relation';
    const pitfalls = context.commonPitfalls || [];
    const primaryPitfall = pitfalls[0] || 'Mixing up sign conventions and scalar vs vector quantities.';

    let content = '';
    let verificationQuestion: VerificationQuestion | undefined = undefined;

    if (mode === 'simple') {
      content = `### ${topic} (Simple Explanation)\n\nIn **${topic}**, the core intuition is understanding the relationship between physical variables without getting bogged down in notation.\n\n• **Core Principle**: ${context.learningObjectives?.[0] || `Mastering the definition and SI units in ${context.subjectName}.`}\n• **Key Anchor**: \`${primaryFormula}\`\n\n*Exam Tip*: Always make sure your units match before calculating!`;
      verificationQuestion = {
        question: `In ${topic}, what happens when the key driving variable is doubled?`,
        conceptTested: 'Proportionality and physical scaling',
        suggestedAnswerOrHint: 'Check if the equation is linear or quadratic (e.g. scales by 2x or 4x).',
      };
    } else if (mode === 'step_by_step') {
      content = `### Step-by-Step Problem Solving: ${topic}\n\n1. **Identify Given Data**: Extract all numerical values and convert to SI units.\n2. **Select Governing Equation**: \`${primaryFormula}\`.\n3. **Isolate the Unknown Variable**: Rearrange algebraically before substituting numbers.\n4. **Dimensional Check**: Verify that LHS units equal RHS units.`;
    } else if (mode === 'analogy') {
      content = `### Real-World Analogy for ${topic}\n\nThink of ${topic} like navigating traffic on a highway:\n\n• Your speed is how fast the car travels.\n• Your acceleration is pressing the gas pedal.\n• A sudden turn requires inward traction (centripetal grip), just like tire friction prevents skidding.\n\nThis simple visual model makes it easy to predict what happens if friction or speed changes!`;
    } else if (mode === 'exam_focused') {
      content = `### High-Yield ${context.examType} Exam Traps for ${topic}\n\n• **Top Pitfall**: ${primaryPitfall}\n• **Speed Shortcut**: Look for ratio problems and eliminate units early.\n• **Elimination Strategy**: Distractors often forget square roots or minus signs in vector directions.`;
    } else {
      // hint
      content = `### Pedagogical Hint for ${topic}\n\n• Focus on which quantity remains constant throughout the process.\n• Consider whether the equation requires vector signs (positive vs negative direction).\n• Look at the primary relation: \`${primaryFormula}\`.`;
    }

    return {
      id: `msg-tutor-fallback-${Date.now()}`,
      role: 'tutor',
      content,
      mode,
      verificationQuestion,
      timestamp: new Date().toISOString(),
      followUpQuestions: [
        `Explain the core formula (${primaryFormula}) step-by-step`,
        `What is the #1 trap on ${topic} in ${context.examType}?`,
        `Give me another analogy for ${topic}`,
      ],
      suggestedAction: 'try_question',
    };
  }
}

export const aiTutorClientService = new AiTutorClientService();

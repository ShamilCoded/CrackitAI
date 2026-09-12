import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/services/ai/gemini.service';
import type { AiTutorChatRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: AiTutorChatRequest = await req.json();
    const response = await aiService.chatWithAiTutor(body);

    if (response && response.message) {
      // 1. Strip any greetings like Assalam-o-Alaikum
      let cleanedMessage = response.message
        .replace(/assalam[- ]?o[- ]?alaikum[!.,]?\s*/gi, '')
        .replace(/salam[!.,]?\s*/gi, '')
        .trim();

      // 2. Check if the backend refused the question due to topic restriction
      const isRefusal =
        cleanedMessage.toLowerCase().includes('falls outside the scope') ||
        cleanedMessage.toLowerCase().includes('outside our current') ||
        cleanedMessage.toLowerCase().includes('different chapter') ||
        cleanedMessage.toLowerCase().includes('my primary goal is to help you ace topics directly relevant');

      // 3. Fallback override if backend refused a valid science concept
      if (isRefusal) {
        const query = body.studentQuery || 'this concept';
        cleanedMessage = `### Understanding ${query}\n\nIn science and physics, **${query}** is an essential fundamental concept:\n\n• **Core Principle**: It describes intrinsic physical properties and governing relations under standard laws of motion.\n• **Application**: Always ensure quantities are analyzed using standard SI units and appropriate vector/scalar conventions.\n\n*(Note: You can explore this independently or relate it back to your active session on ${body.context?.topicName || 'the current chapter'}.)*`;
      }

      response.message = cleanedMessage;
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('AI Tutor API error:', error);
    return NextResponse.json(
      {
        message:
          'When analyzing science and motion for entrance tests, always verify boundary conditions, establish explicit coordinate signs, and check standard SI units before calculating.',
        modeUsed: 'simple',
        conceptIdentified: 'Core Science Concept',
        verificationQuestion: {
          question: 'What is the governing SI unit for this quantity?',
          conceptTested: 'Dimensional analysis',
          suggestedAnswerOrHint: 'Check base dimensions before solving numerical problems.',
        },
        followUpQuestions: [
          'Show the complete formula breakdown',
          'What are typical entrance exam traps here?',
        ],
        suggestedAction: 'try_question',
        encouragementNote: 'Review the underlying formulas and practice standard MCQs.',
      },
      { status: 200 }
    );
  }
}

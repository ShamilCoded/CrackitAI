import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/services/ai/gemini.service';
import type { AiTutorChatRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: AiTutorChatRequest = await req.json();
    const response = await aiService.chatWithAiTutor(body);
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('AI Tutor API error:', error);
    return NextResponse.json(
      {
        message:
          'When analyzing kinematics and motion for ECAT/MDCAT, remember to always separate vertical and horizontal vectors, establish an explicit coordinate sign convention, and verify units before calculating.',
        modeUsed: 'simple',
        conceptIdentified: 'Kinematics & Mechanics',
        verificationQuestion: {
          question: 'What is the acceleration of a ball thrown upward when it reaches its maximum height?',
          conceptTested: 'Gravitational acceleration constancy',
          suggestedAnswerOrHint: 'It is -9.8 m/s² downward (gravity acts continuously even when instantaneous velocity is 0).',
        },
        followUpQuestions: [
          'Explain the 3 kinematic equations with an analogy',
          'What are the key traps in projectile motion past papers?',
        ],
        suggestedAction: 'try_question',
        encouragementNote: 'Review the sign conventions and try another practice question!',
      },
      { status: 200 }
    );
  }
}

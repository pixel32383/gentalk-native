import { apiJson, corsHeaders, enforceAiRateLimit } from '@/services/server/ai-rate-limit';
import {
  buildFeedbackInstructions,
  conversationFeedbackSchema,
  filterWritingOnlyFeedback,
  isConversationFeedbackResult,
  type FeedbackConversation,
  type PreviousFeedbackSummary,
} from '@/services/server/feedback-rules';

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { situation, learningLanguage, nativeLanguage, messages, previousFeedback } = await request.json() as {
      situation?: string;
      learningLanguage?: string;
      nativeLanguage?: string;
      messages?: FeedbackConversation;
      previousFeedback?: PreviousFeedbackSummary[];
    };
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !situation || !Array.isArray(messages)) {
      return apiJson({ error: 'Invalid feedback request.' }, 400);
    }
    const rateLimitResponse = await enforceAiRateLimit(request, 'feedback');
    if (rateLimitResponse) return rateLimitResponse;
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        instructions: buildFeedbackInstructions({ nativeLanguage, learningLanguage, previousFeedbackCount: previousFeedback?.length ?? 0 }),
        input: JSON.stringify({
          situation,
          learningLanguage,
          nativeLanguage,
          // 일반 학습 대화는 최근 16개 메시지만으로 충분합니다. 너무 긴 기록은 응답 시간만 늘립니다.
          conversation: messages.slice(-16).map((message) => ({ speaker: message.speaker, text: message.text.slice(0, 280) })),
          previousFeedback: Array.isArray(previousFeedback) ? previousFeedback.slice(0, 2) : [],
        }),
        text: {
          format: {
            type: 'json_schema', name: 'conversation_feedback', strict: true,
            schema: conversationFeedbackSchema,
          },
        },
        // 상세 피드백에 충분한 범위 안에서 불필요하게 긴 응답 생성을 방지합니다.
        max_output_tokens: 1600,
      }),
    });
    if (!response.ok) return apiJson({ error: 'AI feedback failed.' }, 502);
    const data = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const text = data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;
    const feedback = text ? JSON.parse(text) : undefined;
    if (!isConversationFeedbackResult(feedback)) throw new Error('Missing AI feedback');
    return apiJson(filterWritingOnlyFeedback(feedback));
  } catch (error) {
    console.error('Conversation feedback API error:', error);
    return apiJson({ error: 'Unable to generate feedback.' }, 500);
  }
}

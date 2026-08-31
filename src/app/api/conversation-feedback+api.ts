type ConversationMessage = { speaker: 'STAFF' | 'YOU'; text: string };

import { apiJson, corsHeaders, enforceAiRateLimit } from '@/services/server/ai-rate-limit';

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

function nativeLanguageName(code: string | undefined) {
  if (code === 'ko') return 'Korean';
  if (code === 'ja') return 'Japanese';
  return 'English';
}

export async function POST(request: Request) {
  try {
    const { situation, learningLanguage, nativeLanguage, messages } = await request.json() as {
      situation?: string;
      learningLanguage?: string;
      nativeLanguage?: string;
      messages?: ConversationMessage[];
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
        instructions: `You are a supportive language tutor. Analyze only the learner (YOU) messages in the supplied roleplay. The learner native language is ${nativeLanguageName(nativeLanguage)} and the learning language is ${learningLanguage}. Write EVERY string in suggestions, strengths, and improvements ONLY in ${nativeLanguageName(nativeLanguage)}. These three arrays are learner-facing feedback and must never be written in the learning language, even when referring to a learner sentence; quote only a short necessary target-language phrase. Every suggestion or improvement must be anchored to a specific learner message and explain the real conversational effect in this situation: relevance to the staff question, whether the learner intent is clear, word choice, politeness, completeness, natural turn-taking, or a missed opportunity to use the learned vocabulary. Only correct an error that materially changes meaning, clarity, politeness, or the ability to advance the conversation. Do not correct a sentence that is already natural and understandable merely because another wording is slightly more formal, longer, or preferred. In particular, never correct natural short replies, contractions, or equivalent polite variants; for example, "No thanks" must NOT be corrected to "No thank you". Do not give feedback about capitalization, periods, punctuation, spelling, or generic grammar rules unless the issue changes meaning, politeness, clarity, or naturalness in actual speech. Never invent generic advice merely to fill a list. If the learner has no substantive conversational weakness, return an empty improvements array. If any learner message is unrelated to the conversation situation, explicitly explain that issue and show how to return naturally to the situation. In messageCorrections, add one item only for each learner message that has a substantive improvement. originalMessage must exactly match the learner message. correctedMessage must be the improved natural sentence in the learning language. changedParts must list only the replacement or added phrases that appear verbatim in correctedMessage; use a non-empty corrected value for every item. Do not create a correction for punctuation, capitalization, spelling, a merely optional alternative, or a natural short reply. Also provide exactly three recommendedReplies: the best natural learner replies to practice for this situation. Each phrase must be in the learning language and each translation must be in ${nativeLanguageName(nativeLanguage)}. Never include a staff sentence in recommendedReplies.`,
        input: JSON.stringify({ situation, learningLanguage, nativeLanguage, conversation: messages }),
        text: {
          format: {
            type: 'json_schema', name: 'conversation_feedback', strict: true,
            schema: {
              type: 'object', additionalProperties: false,
              required: ['suggestions', 'strengths', 'improvements', 'recommendedReplies', 'messageCorrections'],
              properties: {
                suggestions: { type: 'array', minItems: 0, maxItems: 3, items: { type: 'string' } },
                strengths: { type: 'array', minItems: 0, maxItems: 3, items: { type: 'string' } },
                improvements: { type: 'array', minItems: 0, maxItems: 3, items: { type: 'string' } },
                messageCorrections: {
                  type: 'array', minItems: 0, maxItems: 3,
                  items: {
                    type: 'object', additionalProperties: false,
                    required: ['originalMessage', 'correctedMessage', 'changedParts'],
                    properties: {
                      originalMessage: { type: 'string' },
                      correctedMessage: { type: 'string' },
                      changedParts: {
                        type: 'array', minItems: 1, maxItems: 4,
                        items: {
                          type: 'object', additionalProperties: false,
                          required: ['original', 'corrected'],
                          properties: { original: { type: 'string' }, corrected: { type: 'string' } },
                        },
                      },
                    },
                  },
                },
                recommendedReplies: {
                  type: 'array', minItems: 3, maxItems: 3,
                  items: {
                    type: 'object', additionalProperties: false,
                    required: ['phrase', 'translation'],
                    properties: { phrase: { type: 'string' }, translation: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      }),
    });
    if (!response.ok) return apiJson({ error: 'AI feedback failed.' }, 502);
    const data = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const text = data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;
    const feedback = text ? JSON.parse(text) as { suggestions?: string[]; strengths?: string[]; improvements?: string[]; recommendedReplies?: Array<{ phrase: string; translation: string }>; messageCorrections?: unknown[] } : undefined;
    if (!feedback?.suggestions || !feedback.strengths || !feedback.improvements || !feedback.recommendedReplies || !feedback.messageCorrections) throw new Error('Missing AI feedback');
    return apiJson(feedback);
  } catch (error) {
    console.error('Conversation feedback API error:', error);
    return apiJson({ error: 'Unable to generate feedback.' }, 500);
  }
}

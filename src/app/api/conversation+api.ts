type ConversationMessage = {
  speaker: 'STAFF' | 'YOU';
  text: string;
};

import { apiJson, corsHeaders, enforceAiRateLimit } from '@/services/server/ai-rate-limit';

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

function pronunciationGuideRule(nativeLanguage: string) {
  if (nativeLanguage === 'ko') return 'The learner native language is Korean. examplePronunciation MUST be written in Hangul only. It must not contain Japanese characters or the original English/Japanese sentence.';
  if (nativeLanguage === 'ja') return 'The learner native language is Japanese. examplePronunciation MUST be written in Japanese kana only. It must not contain Hangul or the original English sentence.';
  return 'The learner native language is English. examplePronunciation MUST use common Latin-letter romanization only.';
}

export async function POST(request: Request) {
  try {
    const { situation, learningLanguage, nativeLanguage, vocabulary, staffRole, conversationGoal, messages } = await request.json() as {
      situation?: string;
      learningLanguage?: string;
      nativeLanguage?: string;
      vocabulary?: string[];
      staffRole?: string;
      conversationGoal?: string;
      messages?: ConversationMessage[];
    };
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !situation || !['en', 'fr', 'ja', 'es', 'de', 'ko', 'zh', 'ru', 'ar'].includes(learningLanguage ?? '') || !['en', 'ja', 'ko'].includes(nativeLanguage ?? '') || !Array.isArray(messages)) {
      return apiJson({ error: 'Invalid conversation request.' }, 400);
    }

    const rateLimitResponse = await enforceAiRateLimit(request, 'conversation');
    if (rateLimitResponse) return rateLimitResponse;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        instructions: `You are the assigned staff member in a language-learning roleplay. First classify the learner latest message before writing a reply. Set isRelevant=true only if that message directly advances the exact situation or answers the staff question. Set isRelevant=false for unrelated subjects, personal small talk, random statements, and topic changes. Example: in a cafe-ordering roleplay, "I play soccer every weekend" is false. If false, staffMessage must be a natural in-character question that redirects to ordering, and hint must be non-empty. Always provide one natural exampleReply the learner could say next. staffMessage and exampleReply must be written only in the requested learningLanguage. translation must be a complete, natural translation of staffMessage in the requested nativeLanguage. userTranslation must be a complete, natural translation of the learner's latest message in the requested nativeLanguage. examplePronunciation represents the sound of exampleReply, never its meaning. ${pronunciationGuideRule(nativeLanguage!)} Do not use IPA. Never copy the learning-language sentence into translation or userTranslation, and never write either translation in Japanese unless nativeLanguage is "ja". In particular, when learningLanguage is "ja" and nativeLanguage is "ko", staffMessage must be natural Japanese and both translations must be natural Korean. Do not give meta commentary in staffMessage. Set isComplete=true whenever the exchange has naturally reached a clear ending, even if every planned detail was not stated. Ending signals include the staff confirming the request or information, saying the user is all set, thanking the learner, wishing them a good day, or inviting them to return. For example, "That's great, thank you for the information." is a completed conversation and must have isComplete=true.`,
        input: JSON.stringify({
          situation,
          learningLanguage,
          nativeLanguage,
          vocabulary,
          staffRole,
          conversationGoal,
          conversation: messages.map((message) => `${message.speaker}: ${message.text}`),
          task: 'Write the next natural staff reply only.',
        }),
        text: {
          format: {
            type: 'json_schema',
            name: 'conversation_reply',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['staffMessage', 'translation', 'userTranslation', 'isComplete', 'isRelevant', 'hint', 'exampleReply', 'examplePronunciation'],
              properties: { staffMessage: { type: 'string' }, translation: { type: 'string' }, userTranslation: { type: 'string' }, isComplete: { type: 'boolean' }, isRelevant: { type: 'boolean' }, hint: { type: 'string' }, exampleReply: { type: 'string' }, examplePronunciation: { type: 'string' } },
            },
          },
        },
      }),
    });
    if (!response.ok) return apiJson({ error: 'AI conversation failed.' }, 502);

    const data = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const outputText = data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;
    const result = outputText ? JSON.parse(outputText) as { staffMessage?: string; translation?: string; userTranslation?: string; isComplete?: boolean; isRelevant?: boolean; hint?: string; exampleReply?: string; examplePronunciation?: string } : undefined;
    if (!result?.staffMessage || !result.translation || !result.userTranslation || typeof result.isComplete !== 'boolean' || typeof result.isRelevant !== 'boolean' || typeof result.hint !== 'string' || typeof result.exampleReply !== 'string' || typeof result.examplePronunciation !== 'string') throw new Error('Missing AI reply');
    const hasNaturalClosing = /\b(thank(?:s| you)|all set|have a (?:great|good|nice)|enjoy|take care|see you|goodbye|bye)\b|감사합니다|고맙습니다|좋은 하루|안녕히|ありがとうございました|どうもありがとう|お気をつけて/i.test(result.staffMessage);
    const isComplete = result.isComplete || (result.isRelevant && hasNaturalClosing);
    return apiJson({ staffMessage: result.staffMessage, translation: result.translation, userTranslation: result.userTranslation, isComplete, isRelevant: result.isRelevant, hint: result.hint, exampleReply: result.exampleReply, examplePronunciation: result.examplePronunciation });
  } catch (error) {
    console.error('Conversation API error:', error);
    return apiJson({ error: 'Unable to continue conversation.' }, 500);
  }
}

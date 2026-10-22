type ConversationMessage = {
  speaker: 'STAFF' | 'YOU';
  text: string;
};

import { apiJson, corsHeaders, enforceAiRateLimit } from '@/services/server/ai-rate-limit';
import { buildConversationInstructions, resolveConversationCompletion } from '@/services/server/conversation-rules';
import { getKnownLearnerTranslation, isSuspiciousLearnerTranslation, normalizeConversationText } from '@/services/conversation-translation';

type ConversationReply = {
  staffMessage?: string;
  translation?: string;
  userTranslation?: string;
  translatedMessageSource?: string;
  isComplete?: boolean;
  isRelevant?: boolean;
  goalsMet?: boolean;
  hint?: string;
  exampleReply?: string;
  examplePronunciation?: string;
};

/** 배울 언어와 다른 문자 체계가 Staff 문장에 섞였는지 확인합니다. */
function isTargetLanguageReply(text: string, learningLanguage: string) {
  const nonLatinScripts = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af\u3040-\u30ff\u3400-\u9fff\u0400-\u04ff\u0600-\u06ff]/;
  if (['en', 'fr', 'es', 'de'].includes(learningLanguage)) return !nonLatinScripts.test(text);
  if (learningLanguage === 'ko') return !/[\u3040-\u30ff\u3400-\u9fff\u0400-\u04ff\u0600-\u06ff]/.test(text);
  if (learningLanguage === 'ja') return !/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff]/.test(text);
  if (learningLanguage === 'ru') return !/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af\u3040-\u30ff\u3400-\u9fff\u0600-\u06ff]/.test(text);
  if (learningLanguage === 'ar') return !/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af\u3040-\u30ff\u3400-\u9fff\u0400-\u04ff]/.test(text);
  return true;
}

function parseConversationReply(data: { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }) {
  const outputText = data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;
  return outputText ? JSON.parse(outputText) as ConversationReply : undefined;
}

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
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

    const learnerReplyCount = messages.filter((message) => message.speaker === 'YOU').length;
    const latestLearnerMessage = messages.filter((message) => message.speaker === 'YOU').at(-1)?.text ?? '';

    const requestConversationReply = (languageCorrection?: string) => fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        instructions: `${buildConversationInstructions({ nativeLanguage: nativeLanguage!, learningLanguage: learningLanguage!, learnerReplyCount, vocabulary: vocabulary ?? [] })}${languageCorrection ?? ''}`,
        input: JSON.stringify({
          situation,
          learningLanguage,
          nativeLanguage,
          vocabulary,
          staffRole,
          conversationGoal,
          latestLearnerMessage,
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
              required: ['staffMessage', 'translation', 'userTranslation', 'translatedMessageSource', 'isComplete', 'isRelevant', 'goalsMet', 'hint', 'exampleReply', 'examplePronunciation'],
              properties: { staffMessage: { type: 'string' }, translation: { type: 'string' }, userTranslation: { type: 'string' }, translatedMessageSource: { type: 'string' }, isComplete: { type: 'boolean' }, isRelevant: { type: 'boolean' }, goalsMet: { type: 'boolean' }, hint: { type: 'string' }, exampleReply: { type: 'string' }, examplePronunciation: { type: 'string' } },
            },
          },
        },
      }),
    });

    let response = await requestConversationReply();
    if (!response.ok) return apiJson({ error: 'AI conversation failed.' }, 502);

    let result = parseConversationReply(await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> });
    if (result?.staffMessage && result.exampleReply && (!isTargetLanguageReply(result.staffMessage, learningLanguage!) || !isTargetLanguageReply(result.exampleReply, learningLanguage!))) {
      response = await requestConversationReply(` Your previous answer used the wrong language. Retry now: staffMessage and exampleReply must contain only ${learningLanguage} content, with no Korean or other non-${learningLanguage} scripts.`);
      if (!response.ok) return apiJson({ error: 'AI conversation language retry failed.' }, 502);
      result = parseConversationReply(await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> });
    }
    if (!result?.staffMessage || !result.translation || !result.userTranslation || typeof result.isComplete !== 'boolean' || typeof result.isRelevant !== 'boolean' || typeof result.goalsMet !== 'boolean' || typeof result.hint !== 'string' || typeof result.exampleReply !== 'string' || typeof result.examplePronunciation !== 'string') throw new Error('Missing AI reply');
    if (!isTargetLanguageReply(result.staffMessage, learningLanguage!) || !isTargetLanguageReply(result.exampleReply, learningLanguage!)) {
      return apiJson({ error: 'AI가 배울 언어가 아닌 문장을 반환했습니다. 다시 시도해주세요.' }, 502);
    }
    const knownTranslation = getKnownLearnerTranslation(latestLearnerMessage, learningLanguage!, nativeLanguage!);
    const hasUnreliableTranslation = (reply: ConversationReply) =>
      normalizeConversationText(reply.translatedMessageSource ?? '') !== normalizeConversationText(latestLearnerMessage)
      || isSuspiciousLearnerTranslation(latestLearnerMessage, reply.userTranslation ?? '', reply.staffMessage ?? '', reply.translation ?? '');

    if (knownTranslation) {
      result.userTranslation = knownTranslation;
    } else if (hasUnreliableTranslation(result)) {
      // 드문 번역 혼동에만 한 번 재요청하고, 또 틀리면 잘못된 해석을 저장하지 않습니다.
      try {
        const retryResponse = await requestConversationReply(' Your previous userTranslation did not match latestLearnerMessage. Copy latestLearnerMessage exactly to translatedMessageSource and translate only that message, briefly, into userTranslation.');
        if (retryResponse.ok) {
          const retried = parseConversationReply(await retryResponse.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> });
          if (retried?.staffMessage && retried.translation && retried.userTranslation && retried.exampleReply
            && isTargetLanguageReply(retried.staffMessage, learningLanguage!)
            && isTargetLanguageReply(retried.exampleReply, learningLanguage!)
            && !hasUnreliableTranslation(retried)) {
            result.userTranslation = retried.userTranslation;
            result.translatedMessageSource = retried.translatedMessageSource;
          }
        }
      } catch { /* 기존 Staff 답변은 유지하고 잘못된 해석만 숨깁니다. */ }
      if (hasUnreliableTranslation(result)) result.userTranslation = '';
    }
    const isComplete = resolveConversationCompletion({
      learnerReplyCount,
      modelSaysComplete: result.isComplete,
      isRelevant: result.isRelevant,
      goalsMet: result.goalsMet,
      staffMessage: result.staffMessage,
    });
    return apiJson({ staffMessage: result.staffMessage, translation: result.translation, userTranslation: result.userTranslation, isComplete, isRelevant: result.isRelevant, hint: result.hint, exampleReply: result.exampleReply, examplePronunciation: result.examplePronunciation });
  } catch (error) {
    console.error('Conversation API error:', error);
    return apiJson({ error: 'Unable to continue conversation.' }, 500);
  }
}

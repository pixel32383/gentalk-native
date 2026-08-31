type VocabularyItem = {
  word: string;
  translation: string;
  pos: string;
};

import { apiJson, corsHeaders, enforceAiRateLimit } from '@/services/server/ai-rate-limit';

function pronunciationGuideRule(nativeLanguage: string) {
  if (nativeLanguage === 'ko') return 'The learner native language is Korean. openingExamplePronunciation MUST be written in Hangul only. It must not contain Japanese characters or the original English/Japanese sentence.';
  if (nativeLanguage === 'ja') return 'The learner native language is Japanese. openingExamplePronunciation MUST be written in Japanese kana only. It must not contain Hangul or the original English sentence.';
  return 'The learner native language is English. openingExamplePronunciation MUST use common Latin-letter romanization only.';
}

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { situation, learningLanguage, nativeLanguage, count } = await request.json();
    const normalizedSituation = typeof situation === 'string' ? situation.trim().slice(0, 160) : '';
    const normalizedCount = Number.isInteger(count) ? Math.min(100, Math.max(1, count)) : 20;

    if (!normalizedSituation || !['en', 'fr', 'ja', 'es', 'de', 'ko', 'zh', 'ru', 'ar'].includes(learningLanguage) || !['en', 'ja', 'ko'].includes(nativeLanguage)) {
      return apiJson({ error: 'Invalid learning request.' }, 400);
    }

    const rateLimitResponse = await enforceAiRateLimit(request, 'vocabulary');
    if (rateLimitResponse) return rateLimitResponse;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return apiJson({ error: 'AI service is not configured.' }, 503);
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        instructions: `You create language-learning data. Treat the provided situation as authoritative and never replace it with another travel scenario. Return only data about that exact situation. The conversationTitle, openingStaffMessage, openingExampleReply, and every vocabulary word must be in the requested learning language. Every openingTranslation, vocabulary translation, and culturalTips item must be a complete, natural translation in the requested native language. culturalTips must contain 10 distinct, practical cultural or usage tips directly relevant to the exact situation. openingExamplePronunciation represents the sound of openingExampleReply, never its meaning. ${pronunciationGuideRule(nativeLanguage)} Do not use IPA. Never copy a learning-language sentence into a translation field. In particular, when the learning language is Japanese and the native language is Korean, all translation fields and culturalTips must be natural Korean while all learning fields must be Japanese. The openingStaffMessage must be a natural first line spoken by the staff member, not an explanation or an instruction to the learner. Provide one short, natural example reply the learner can say next in the learning language.`,
        input: JSON.stringify({
          situation: normalizedSituation,
          learningLanguage,
          nativeLanguage,
          vocabularyCount: normalizedCount,
          task: 'Create a conversationTitle, a staff openingStaffMessage, its openingTranslation, an openingExampleReply, 10 situation-specific culturalTips, and situation-specific vocabulary. The Korean situation "카페에서 커피 주문" means ordering coffee at a cafe in English.',
        }),
        text: {
          format: {
            type: 'json_schema',
            name: 'vocabulary_lesson',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
                required: ['conversationTitle', 'openingStaffMessage', 'openingTranslation', 'openingExampleReply', 'openingExamplePronunciation', 'culturalTips', 'vocabulary'],
              properties: {
                conversationTitle: { type: 'string' },
                openingStaffMessage: { type: 'string' },
                openingTranslation: { type: 'string' },
                openingExampleReply: { type: 'string' },
                openingExamplePronunciation: { type: 'string' },
                culturalTips: { type: 'array', minItems: 10, maxItems: 10, items: { type: 'string' } },
                vocabulary: {
                  type: 'array',
                  minItems: normalizedCount,
                  maxItems: normalizedCount,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['word', 'translation', 'pos'],
                    properties: {
                      word: { type: 'string' },
                      translation: { type: 'string' },
                      pos: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('OpenAI request failed:', response.status);
      return apiJson({ error: 'AI generation failed.' }, 502);
    }

    const data = await response.json() as {
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const outputText = data.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === 'output_text')
      ?.text;
    if (!outputText) {
      throw new Error('Missing vocabulary response from AI');
    }
    const lesson = JSON.parse(outputText) as { conversationTitle: string; openingStaffMessage: string; openingTranslation: string; openingExampleReply: string; openingExamplePronunciation: string; culturalTips: string[]; vocabulary: VocabularyItem[] };
    if (!lesson.conversationTitle || !lesson.openingStaffMessage || !lesson.openingTranslation || !lesson.openingExampleReply || typeof lesson.openingExamplePronunciation !== 'string' || !Array.isArray(lesson.culturalTips) || lesson.culturalTips.length !== 10 || !Array.isArray(lesson.vocabulary) || lesson.vocabulary.length !== normalizedCount) {
      throw new Error('Invalid AI vocabulary response');
    }

    return apiJson(lesson);
  } catch (error) {
    console.error('Vocabulary API error:', error);
    return apiJson({ error: 'Unable to generate vocabulary.' }, 500);
  }
}

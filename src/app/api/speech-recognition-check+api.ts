import { apiJson, corsHeaders, enforceAiRateLimit } from '@/services/server/ai-rate-limit';

type SpeechCheck = {
  hasSuggestion: boolean;
  correctedText: string;
  heardPhrase: string;
  expectedPhrase: string;
};

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

/** 음성 인식 결과를 문맥과 비교합니다. 확신이 없으면 절대 수정안을 제시하지 않습니다. */
export async function POST(request: Request) {
  try {
    const { transcript, learningLanguage, vocabulary, staffContext } = await request.json() as {
      transcript?: string;
      learningLanguage?: string;
      vocabulary?: string[];
      staffContext?: string[];
    };
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !transcript || !learningLanguage || !Array.isArray(vocabulary) || !Array.isArray(staffContext)) {
      return apiJson({ error: 'Invalid speech recognition check request.' }, 400);
    }
    const rateLimitResponse = await enforceAiRateLimit(request, 'conversation');
    if (rateLimitResponse) return rateLimitResponse;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        instructions: `You check likely speech-to-text mistakes in a ${learningLanguage} roleplay. Only suggest a correction when you are highly confident the learner intended a specific word or short phrase from the supplied vocabulary or staff context, but speech recognition produced a phonetically similar incorrect phrase. Do NOT correct grammar, style, punctuation, or a valid alternative choice. In particular, never treat choices such as small/medium/large or regular/soy/oat milk as mistakes merely because a different option appears in context. If uncertain, set hasSuggestion false and return the original transcript for correctedText with empty phrases.`,
        input: JSON.stringify({ transcript, vocabulary: vocabulary.slice(0, 30), staffContext: staffContext.slice(-3) }),
        text: {
          format: {
            type: 'json_schema', name: 'speech_check', strict: true,
            schema: {
              type: 'object', additionalProperties: false,
              required: ['hasSuggestion', 'correctedText', 'heardPhrase', 'expectedPhrase'],
              properties: {
                hasSuggestion: { type: 'boolean' },
                correctedText: { type: 'string' },
                heardPhrase: { type: 'string' },
                expectedPhrase: { type: 'string' },
              },
            },
          },
        },
        max_output_tokens: 220,
      }),
    });
    if (!response.ok) return apiJson({ error: 'Speech recognition check failed.' }, 502);
    const data = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const text = data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;
    const result = text ? JSON.parse(text) as Partial<SpeechCheck> : null;
    if (!result || typeof result.hasSuggestion !== 'boolean' || typeof result.correctedText !== 'string' || typeof result.heardPhrase !== 'string' || typeof result.expectedPhrase !== 'string') {
      throw new Error('Invalid speech check response');
    }
    return apiJson(result);
  } catch (error) {
    console.error('Speech recognition check API error:', error);
    return apiJson({ error: 'Unable to check speech recognition.' }, 500);
  }
}

type FeedbackMessage = { speaker: 'STAFF' | 'YOU'; text: string };

export type ConversationFeedbackResult = {
  suggestions: string[];
  strengths: string[];
  improvements: string[];
  recommendedReplies: Array<{ phrase: string; translation: string }>;
  messageCorrections: Array<{
    originalMessage: string;
    correctedMessage: string;
    correctedTranslation: string;
    changedParts: Array<{ original: string; corrected: string }>;
  }>;
  goalAchievement: {
    summary: string;
    completed: string[];
    missing: string[];
  };
  priorityCorrection: {
    title: string;
    reason: string;
    correctedExample: string;
  } | null;
  reusableSentence: { phrase: string; translation: string } | null;
  nextPracticeGoal: string;
  recurringWeakness: string | null;
};

/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ AI 학습 피드백 규칙을 추가하거나 수정하는 파일입니다.               │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * 1) 피드백 작성 기준 추가: CORE_FEEDBACK_RULES 끝에 영어 규칙을 추가합니다.
 * 2) 피드백 언어 기준: buildFeedbackInstructions에서 수정합니다.
 * 3) 이전 학습 반복 약점 기준: buildFeedbackInstructions에서 수정합니다.
 * 4) 피드백 항목 수·형식: conversationFeedbackSchema에서 수정합니다.
 * 5) 응답 안전 검사: isConversationFeedbackResult에서 수정합니다.
 *
 * 화면 코드와 OpenAI API 호출 코드는 이 파일에서 수정하지 않습니다.
 */

/**
 * [새 피드백 알고리즘 추가 위치]
 * 의미·명확성·공손함·대화 흐름에 실제 영향이 있는 내용만 피드백합니다.
 */
const CORE_FEEDBACK_RULES = `You are a supportive language tutor. Analyze only the learner (YOU) messages in the supplied roleplay. This is a SPOKEN conversation, even when a reply was typed or transcribed. Every suggestion or improvement must be anchored to a specific learner message and explain the real conversational effect in this situation: relevance to the staff question, whether the learner intent is clear, word choice, politeness, completeness, natural turn-taking, or a missed opportunity to use the learned vocabulary. Only correct an error that materially changes meaning, clarity, politeness, or the ability to advance the conversation. Do not correct a sentence that is already natural and understandable merely because another wording is slightly more formal, longer, or preferred. In particular, never correct natural short replies, contractions, or equivalent polite variants; for example, "No thanks" must NOT be corrected to "No thank you". Ignore capitalization, commas, periods, punctuation, spacing, and spelling in ALL feedback fields. They are written or transcription details, not spoken-language learning goals. Never suggest adding a comma to "to go please" or changing it to "To go, please". Judge the spoken words and intended meaning instead. Do not give generic grammar rules without a concrete effect on this conversation. Never invent generic advice merely to fill a list. If the learner has no substantive conversational weakness, return an empty improvements array. If any learner message is unrelated to the conversation situation, explicitly explain that issue and show how to return naturally to the situation. In messageCorrections, add one item only for each learner message that has a substantive improvement. originalMessage must exactly match the learner message. correctedMessage must be the improved natural sentence in the learning language. correctedTranslation must be a complete, accurate translation of correctedMessage only, in the learner native language. Never translate the originalMessage in correctedTranslation. changedParts must list only the replacement or added phrases that appear verbatim in correctedMessage; use a non-empty corrected value for every item. Do not create a correction for punctuation, capitalization, spelling, a merely optional alternative, or a natural short reply. In priorityCorrection, select at most one correction that most affected whether the conversation could continue; return null when there is no such correction.`;

const WRITING_ONLY_FEEDBACK = /대문자|소문자|쉼표|마침표|문장부호|구두점|철자|맞춤법|띄어쓰기|표기|온점|句読点|読点|句点|大文字|小文字|スペル|綴り|表記|\b(?:capitalization|uppercase|lowercase|punctuation|comma|full stop|spelling|apostrophe)\b|\bperiod\s+(?:at\s+the\s+)?end\b/i;

function spokenWords(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[\p{P}\p{S}]/gu, '').replace(/\s+/g, ' ').trim();
}

/** AI가 표기만 고치라고 제안해도 말하기 피드백에는 표시하지 않습니다. */
export function filterWritingOnlyFeedback(feedback: ConversationFeedbackResult): ConversationFeedbackResult {
  const spokenFeedback = (items: string[]) => items.filter((item) => !WRITING_ONLY_FEEDBACK.test(item));
  return {
    ...feedback,
    suggestions: spokenFeedback(feedback.suggestions),
    strengths: spokenFeedback(feedback.strengths),
    improvements: spokenFeedback(feedback.improvements),
    messageCorrections: feedback.messageCorrections.flatMap((correction) => {
      if (spokenWords(correction.originalMessage) === spokenWords(correction.correctedMessage)) return [];
      const changedParts = correction.changedParts.filter((part) => spokenWords(part.original) !== spokenWords(part.corrected));
      return changedParts.length > 0 ? [{ ...correction, changedParts }] : [];
    }),
    priorityCorrection: feedback.priorityCorrection && !WRITING_ONLY_FEEDBACK.test(`${feedback.priorityCorrection.title} ${feedback.priorityCorrection.reason}`)
      ? feedback.priorityCorrection
      : null,
    nextPracticeGoal: WRITING_ONLY_FEEDBACK.test(feedback.nextPracticeGoal) ? '' : feedback.nextPracticeGoal,
    recurringWeakness: feedback.recurringWeakness && !WRITING_ONLY_FEEDBACK.test(feedback.recurringWeakness)
      ? feedback.recurringWeakness
      : null,
  };
}

function nativeLanguageName(code: string | undefined) {
  if (code === 'ko') return 'Korean';
  if (code === 'ja') return 'Japanese';
  return 'English';
}

/** [피드백 언어·추천 표현 규칙] */
export function buildFeedbackInstructions({
  nativeLanguage,
  learningLanguage,
  previousFeedbackCount,
}: {
  nativeLanguage: string | undefined;
  learningLanguage: string | undefined;
  previousFeedbackCount: number;
}) {
  const nativeLanguageLabel = nativeLanguageName(nativeLanguage);
  return `${CORE_FEEDBACK_RULES} The learner native language is ${nativeLanguageLabel} and the learning language is ${learningLanguage}. Write EVERY string in suggestions, strengths, improvements, goalAchievement, priorityCorrection, nextPracticeGoal, and recurringWeakness ONLY in ${nativeLanguageLabel}. These are learner-facing feedback and must never be written in the learning language, even when referring to a learner sentence; quote only a short necessary target-language phrase. goalAchievement must explain whether the learner completed the situation-specific information needed to finish the interaction; use completed and missing lists with only meaningful details. reusableSentence must be one especially good learner sentence, lightly polished only if necessary, that can be reused in a future real conversation; its phrase must be in the learning language and translation must be in ${nativeLanguageLabel}. Return null if there is no good learner sentence. nextPracticeGoal must be exactly one specific, actionable goal for the next conversation. You receive ${previousFeedbackCount} previous feedback record(s). Set recurringWeakness only when the same meaningful weakness appears in at least two previous records and is also relevant to this conversation; otherwise return null. Never describe a one-time mistake as a recurring weakness. Also provide exactly three recommendedReplies: the best natural learner replies to practice for this situation. Each phrase must be in the learning language and each translation must be in ${nativeLanguageLabel}. Never include a staff sentence in recommendedReplies.`;
}

/** [피드백 응답 형식] 화면이 기대하는 JSON 구조입니다. */
export const conversationFeedbackSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['suggestions', 'strengths', 'improvements', 'goalAchievement', 'priorityCorrection', 'reusableSentence', 'nextPracticeGoal', 'recurringWeakness', 'recommendedReplies', 'messageCorrections'],
  properties: {
    suggestions: { type: 'array', minItems: 0, maxItems: 3, items: { type: 'string' } },
    strengths: { type: 'array', minItems: 0, maxItems: 3, items: { type: 'string' } },
    improvements: { type: 'array', minItems: 0, maxItems: 3, items: { type: 'string' } },
    goalAchievement: {
      type: 'object', additionalProperties: false,
      required: ['summary', 'completed', 'missing'],
      properties: {
        summary: { type: 'string' },
        completed: { type: 'array', minItems: 0, maxItems: 4, items: { type: 'string' } },
        missing: { type: 'array', minItems: 0, maxItems: 3, items: { type: 'string' } },
      },
    },
    priorityCorrection: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object', additionalProperties: false,
          required: ['title', 'reason', 'correctedExample'],
          properties: { title: { type: 'string' }, reason: { type: 'string' }, correctedExample: { type: 'string' } },
        },
      ],
    },
    reusableSentence: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object', additionalProperties: false,
          required: ['phrase', 'translation'],
          properties: { phrase: { type: 'string' }, translation: { type: 'string' } },
        },
      ],
    },
    nextPracticeGoal: { type: 'string' },
    recurringWeakness: { anyOf: [{ type: 'null' }, { type: 'string' }] },
    messageCorrections: {
      type: 'array', minItems: 0, maxItems: 3,
      items: {
        type: 'object', additionalProperties: false,
        required: ['originalMessage', 'correctedMessage', 'correctedTranslation', 'changedParts'],
        properties: {
          originalMessage: { type: 'string' },
          correctedMessage: { type: 'string' },
          correctedTranslation: { type: 'string' },
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
};

/** [응답 안전 검사] AI가 화면에 필요한 모든 배열을 반환했는지 확인합니다. */
export function isConversationFeedbackResult(value: unknown): value is ConversationFeedbackResult {
  if (!value || typeof value !== 'object') return false;
  const feedback = value as Partial<ConversationFeedbackResult>;
  return Array.isArray(feedback.suggestions)
    && Array.isArray(feedback.strengths)
    && Array.isArray(feedback.improvements)
    && Array.isArray(feedback.recommendedReplies)
    && Array.isArray(feedback.messageCorrections)
    && feedback.messageCorrections.every((correction) => (
      typeof correction.originalMessage === 'string'
      && typeof correction.correctedMessage === 'string'
      && typeof correction.correctedTranslation === 'string'
      && Array.isArray(correction.changedParts)
    ))
    && Boolean(feedback.goalAchievement)
    && typeof feedback.goalAchievement?.summary === 'string'
    && Array.isArray(feedback.goalAchievement?.completed)
    && Array.isArray(feedback.goalAchievement?.missing)
    && (feedback.priorityCorrection === null || (
      typeof feedback.priorityCorrection?.title === 'string'
      && typeof feedback.priorityCorrection?.reason === 'string'
      && typeof feedback.priorityCorrection?.correctedExample === 'string'
    ))
    && (feedback.reusableSentence === null || (
      typeof feedback.reusableSentence?.phrase === 'string'
      && typeof feedback.reusableSentence?.translation === 'string'
    ))
    && typeof feedback.nextPracticeGoal === 'string'
    && (feedback.recurringWeakness === null || typeof feedback.recurringWeakness === 'string');
}

/** Keeps the API request type close to the feedback rules without exposing UI-only fields. */
export type FeedbackConversation = FeedbackMessage[];

export type PreviousFeedbackSummary = Pick<
  ConversationFeedbackResult,
  'improvements' | 'suggestions' | 'nextPracticeGoal' | 'recurringWeakness'
>;

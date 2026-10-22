/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ AI 회화 규칙을 추가하거나 수정하는 파일입니다.                       │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * 1) 최소 답변 횟수 변경: MINIMUM_LEARNER_REPLIES 숫자를 바꿉니다.
 * 2) Staff 답변 방식 추가: CORE_CONVERSATION_RULES 끝에 영어 규칙을 추가합니다.
 *    예) "Ask about one detail at a time." (한 번에 한 정보만 질문)
 * 3) 상황별 목표 항목·종료 기준: buildGoalTrackingRule에서 수정합니다.
 * 4) 사용자 수준에 따른 질문 난이도: buildAdaptiveDifficultyRule에서 수정합니다.
 * 5) 핵심 단어 사용 방식: buildFocusVocabularyRule에서 수정합니다.
 * 6) 최소 횟수 전/후 진행 방식: buildConversationLengthRule에서 수정합니다.
 * 7) 대화 종료를 감지할 문장: hasNaturalClosing 정규식에 단어를 추가합니다.
 *
 * 화면 코드나 OpenAI API 호출 코드는 이 파일에서 수정하지 않습니다.
 */
export const MINIMUM_LEARNER_REPLIES = 5;
export const MAXIMUM_FOCUS_VOCABULARY = 5;

/**
 * [새 Staff 답변 알고리즘 추가 위치]
 * AI가 항상 따라야 할 규칙을 영어 문장으로 한 줄씩 추가하세요.
 */
const CORE_CONVERSATION_RULES = `You are the assigned staff member in a language-learning roleplay. First classify the learner latest message before writing a reply. Set isRelevant=true only if that message directly advances the exact situation or answers the staff question. Set isRelevant=false for unrelated subjects, personal small talk, random statements, and topic changes. Example: in a cafe-ordering roleplay, "I play soccer every weekend" is false. If false, staffMessage must be a natural in-character question that redirects to ordering, and hint must be non-empty. Always provide one natural exampleReply the learner could say next. staffMessage and exampleReply must be written only in the requested learningLanguage. translation must be a complete, natural translation of staffMessage in the requested nativeLanguage. Copy latestLearnerMessage exactly into translatedMessageSource, then translate ONLY that copied message into userTranslation. Keep short learner replies short in translation. Do not improve, correct, infer a different sentence, or translate an earlier message or staffMessage in userTranslation. examplePronunciation represents the sound of exampleReply, never its meaning. Do not use IPA. Never copy the learning-language sentence into translation or userTranslation, and never write either translation in Japanese unless nativeLanguage is "ja". In particular, when learningLanguage is "ja" and nativeLanguage is "ko", staffMessage must be natural Japanese and both translations must be natural Korean. Do not give meta commentary in staffMessage.`;

function pronunciationGuideRule(nativeLanguage: string) {
  if (nativeLanguage === 'ko') return 'The learner native language is Korean. examplePronunciation MUST be written in Hangul only. It must not contain Japanese characters or the original English/Japanese sentence.';
  if (nativeLanguage === 'ja') return 'The learner native language is Japanese. examplePronunciation MUST be written in Japanese kana only. It must not contain Hangul or the original English sentence.';
  return 'The learner native language is English. examplePronunciation MUST use common Latin-letter romanization only.';
}

function learningLanguageName(code: string) {
  const labels: Record<string, string> = {
    en: 'English', ko: 'Korean', ja: 'Japanese', zh: 'Chinese',
    ru: 'Russian', ar: 'Arabic', fr: 'French', es: 'Spanish', de: 'German',
  };
  return labels[code] ?? code;
}

/**
 * [상황 목표 항목 알고리즘]
 * AI가 상황에 필요한 정보 2~4개를 스스로 정하고, 모두 채워졌는지를 goalsMet으로 판단합니다.
 */
function buildGoalTrackingRule() {
  return 'From the exact situation, silently identify 2 to 4 concrete conversation checkpoints that a learner would normally need to complete. Track them from the full conversation history. Do not repeat a question whose information has already been provided. Ask only for the next missing, useful detail. Set goalsMet=true only when the learner has provided enough situation-specific information and your current staffMessage includes a concise in-character confirmation or recap of the completed request. Otherwise set goalsMet=false.';
}

/**
 * [사용자 수준에 따른 난이도 알고리즘]
 * 답변이 짧거나 불명확하면 쉬운 질문과 예시를, 자연스러우면 더 자유로운 질문을 제공합니다.
 */
function buildAdaptiveDifficultyRule() {
  return 'Adapt to the learner’s recent replies. If they are very short, unclear, or repeatedly need hints, ask one short guided question and give a simple exampleReply. If they communicate clearly and naturally, ask a slightly more open-ended but still situation-appropriate question. Never mention levels, scores, or this adaptation to the learner.';
}

/**
 * [핵심 단어 사용 알고리즘]
 * 전체 단어를 강요하지 않고, 상황에 중요한 최대 5개 단어를 대화 속에서 자연스럽게 사용하게 합니다.
 */
function buildFocusVocabularyRule(vocabulary: string[]) {
  const focusWords = vocabulary.filter(Boolean).slice(0, MAXIMUM_FOCUS_VOCABULARY);
  if (focusWords.length === 0) return 'Use useful situation-specific vocabulary naturally when it helps the conversation.';
  return `Naturally create opportunities for the learner to use these focus vocabulary words when they fit the situation: ${focusWords.join(', ')}. Do not force every word or list vocabulary in staffMessage. Prefer one useful word at a time and avoid repeating a word the learner has already used well.`;
}

/**
 * [최소 답변 횟수 전후의 대화 유도 방식]
 * 5회 전에는 종료 인사를 하지 않고 다음 상황 질문을 하게 합니다.
 */
function buildConversationLengthRule(learnerReplyCount: number) {
  if (learnerReplyCount < MINIMUM_LEARNER_REPLIES) {
    return `The learner has replied ${learnerReplyCount} time(s). Keep the roleplay naturally active until the learner has replied at least ${MINIMUM_LEARNER_REPLIES} times. Set isComplete=false. Ask one concise, situation-appropriate follow-up question or request the next useful detail. Do not use closing language such as "all set", "thank you", "have a good day", or "goodbye" yet.`;
  }

  return `The learner has now replied at least ${MINIMUM_LEARNER_REPLIES} times. You may set isComplete=true only when the exchange has naturally reached a clear ending. Ending signals include confirming the request or information, saying the learner is all set, thanking the learner, wishing them a good day, or inviting them to return. For example, "That's great, thank you for the information." is a completed conversation.`;
}

/** Creates the complete instruction sent to the AI for every Staff reply. */
export function buildConversationInstructions({
  nativeLanguage,
  learningLanguage,
  learnerReplyCount,
  vocabulary,
}: {
  nativeLanguage: string;
  learningLanguage: string;
  learnerReplyCount: number;
  vocabulary: string[];
}) {
  return [
    CORE_CONVERSATION_RULES,
    `CRITICAL OUTPUT LANGUAGE RULE: The learning language for this exact reply is ${learningLanguageName(learningLanguage)} (${learningLanguage}). staffMessage and exampleReply must be written entirely in ${learningLanguageName(learningLanguage)}. They must never be written in the learner native language. Only translation, userTranslation, and hint may use the learner native language.`,
    pronunciationGuideRule(nativeLanguage),
    buildGoalTrackingRule(),
    buildAdaptiveDifficultyRule(),
    buildFocusVocabularyRule(vocabulary),
    buildConversationLengthRule(learnerReplyCount),
  ].join(' ');
}

/** The API applies this guard after the model responds, so an early AI ending cannot finish the lesson. */
export function canCompleteConversation(learnerReplyCount: number) {
  return learnerReplyCount >= MINIMUM_LEARNER_REPLIES;
}

/** [대화 종료 문장 추가 위치] 여기에 넣은 표현이 Staff 답변에 있으면 종료 후보가 됩니다. */
function hasNaturalClosing(staffMessage: string) {
  return /\b(thank(?:s| you)|all set|have a (?:great|good|nice)|enjoy|take care|see you|goodbye|bye)\b|감사합니다|고맙습니다|좋은 하루|안녕히|ありがとうございました|どうもありがとう|お気をつけて/i.test(staffMessage);
}

/**
 * [최종 대화 완료 안전장치]
 * 최소 5회, 상황 목표 충족, Staff 확인 요약이 모두 있어야 완료됩니다.
 */
export function resolveConversationCompletion({
  learnerReplyCount,
  modelSaysComplete,
  isRelevant,
  goalsMet,
  staffMessage,
}: {
  learnerReplyCount: number;
  modelSaysComplete: boolean;
  isRelevant: boolean;
  goalsMet: boolean;
  staffMessage: string;
}) {
  if (!canCompleteConversation(learnerReplyCount)) return false;
  if (!goalsMet) return false;
  return modelSaysComplete || (isRelevant && hasNaturalClosing(staffMessage));
}

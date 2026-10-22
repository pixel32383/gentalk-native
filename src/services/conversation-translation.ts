/** 이미 저장된 기록과 새 AI 응답 모두에서 뜻이 확실한 짧은 답변을 바로잡습니다. */
export function getKnownLearnerTranslation(text: string, learningLanguage: string, nativeLanguage: string) {
  if (learningLanguage !== 'en' || !/^no[,.]?\s+thank(?:s| you)[.!?]*$/i.test(text.trim())) return null;

  const translations: Record<string, string> = {
    ko: '아니요, 감사합니다.',
    ja: 'いいえ、ありがとうございます。',
    en: 'No, thank you.',
  };
  return translations[nativeLanguage] ?? null;
}

export function normalizeConversationText(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[.,!?。！？、]/g, '').replace(/\s+/g, ' ');
}

/** 아주 짧은 답변에 긴 설명이나 Staff 해석이 붙으면 그대로 저장하지 않습니다. */
export function isSuspiciousLearnerTranslation(
  learnerMessage: string,
  userTranslation: string,
  staffMessage: string,
  staffTranslation: string,
) {
  const wordCount = learnerMessage.trim().split(/\s+/).length;
  const sourceLength = learnerMessage.replace(/\s/g, '').length;
  const translatedLength = userTranslation.replace(/\s/g, '').length;
  if (wordCount <= 5 && translatedLength > Math.max(26, sourceLength * 2.5)) return true;

  return normalizeConversationText(userTranslation) === normalizeConversationText(staffTranslation)
    && normalizeConversationText(learnerMessage) !== normalizeConversationText(staffMessage);
}

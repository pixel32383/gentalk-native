import type { LearningFeedback } from '@/types/feedback';
import type { CulturalTip, VocabItem } from '@/types/learning';
import { auth } from '@/firebase/firebase';
import { getLearningUserId } from '@/firebase/learning-records';
import { getDevelopmentAiRateLimitEnabled } from '@/services/developer-settings';

type VocabularyResponse = {
  conversationTitle?: string;
  openingStaffMessage?: string;
  openingTranslation?: string;
  openingExampleReply?: string;
  openingExamplePronunciation?: string;
  culturalTips?: CulturalTip[];
  vocabulary?: VocabItem[];
  error?: string;
};

async function getAuthenticatedApiHeaders() {
  await getLearningUserId();
  const user = auth.currentUser;
  if (!user) throw new Error('로그인 정보를 확인하지 못했습니다. 다시 시도해주세요.');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Firebase-UID': user.uid,
    // 개발 서버만 이 헤더를 해석합니다. 배포 서버는 무시합니다.
    'X-Gentalk-Dev-Rate-Limit': getDevelopmentAiRateLimitEnabled() ? 'on' : 'off',
  };
}

export async function generateVocabulary(input: {
  situation: string;
  learningLanguage: string;
  nativeLanguage: string;
  count: number;
  signal?: AbortSignal;
}): Promise<Required<Pick<VocabularyResponse, 'conversationTitle' | 'openingStaffMessage' | 'vocabulary'>> & VocabularyResponse> {
  const response = await fetch('/api/generate-vocabulary', {
    method: 'POST',
    headers: await getAuthenticatedApiHeaders(),
    body: JSON.stringify(input),
    signal: input.signal,
  });
  const data = await response.json() as VocabularyResponse;
  if (!response.ok || !data.vocabulary || !data.conversationTitle || !data.openingStaffMessage) {
    throw new Error(data.error ?? 'AI generation failed');
  }
  return data as Required<Pick<VocabularyResponse, 'conversationTitle' | 'openingStaffMessage' | 'vocabulary'>> & VocabularyResponse;
}

export async function generateConversationFeedback(input: {
  situation: string;
  learningLanguage: string;
  nativeLanguage: string;
  messages: Array<{ speaker: 'STAFF' | 'YOU'; text: string }>;
  previousFeedback?: Array<{
    suggestions: string[];
    improvements: string[];
    nextPracticeGoal?: string;
    recurringWeakness?: string | null;
  }>;
}): Promise<LearningFeedback> {
  // API 또는 네트워크가 응답하지 않는 경우에도 피드백 화면이 계속 로딩 상태로 남지 않게 합니다.
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const request = (async () => {
      const response = await fetch('/api/conversation-feedback', {
        method: 'POST',
        headers: await getAuthenticatedApiHeaders(),
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const data = await response.json() as LearningFeedback & { error?: string };
      if (!response.ok || !data.suggestions || !data.strengths || !data.improvements || !data.recommendedReplies || !data.messageCorrections) {
        throw new Error(data.error ?? 'Feedback failed');
      }
      return data;
    })();
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('피드백 생성 시간이 초과되었습니다. 네트워크를 확인한 뒤 다시 시도해주세요.'));
      }, 45_000);
    });
    return await Promise.race([request, timeout]);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('피드백 생성 시간이 초과되었습니다. 네트워크를 확인한 뒤 다시 시도해주세요.');
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export type ConversationResponse = {
  staffMessage: string;
  translation?: string;
  userTranslation?: string;
  isComplete?: boolean;
  isRelevant?: boolean;
  hint?: string;
  exampleReply?: string;
  examplePronunciation?: string;
};

export type SpeechRecognitionSuggestion = {
  hasSuggestion: boolean;
  correctedText: string;
  heardPhrase: string;
  expectedPhrase: string;
};

/** 말하기 결과를 현재 회화 문맥과 비교합니다. 확인할 수 없으면 원문을 그대로 돌려받습니다. */
export async function checkSpeechRecognition(input: {
  transcript: string;
  learningLanguage: string;
  vocabulary: string[];
  staffContext: string[];
}): Promise<SpeechRecognitionSuggestion | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch('/api/speech-recognition-check', {
      method: 'POST',
      headers: await getAuthenticatedApiHeaders(),
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json() as Partial<SpeechRecognitionSuggestion>;
    if (typeof data.hasSuggestion !== 'boolean' || typeof data.correctedText !== 'string' || typeof data.heardPhrase !== 'string' || typeof data.expectedPhrase !== 'string') return null;
    return data as SpeechRecognitionSuggestion;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** API 키를 노출하지 않고 서버의 AI 대화 API에 요청합니다. */
export async function sendConversationMessage(input: {
  situation: string;
  learningLanguage: string;
  nativeLanguage: string;
  vocabulary: string[];
  staffRole: string;
  conversationGoal: string;
  messages: Array<{ speaker: 'STAFF' | 'YOU'; text: string }>;
}): Promise<ConversationResponse> {
  const response = await fetch('/api/conversation', {
    method: 'POST',
    headers: await getAuthenticatedApiHeaders(),
    body: JSON.stringify(input),
  });
  const data = await response.json() as Partial<ConversationResponse> & { error?: string };
  if (!response.ok || !data.staffMessage) {
    throw new Error(data.error ?? 'AI reply failed');
  }
  return data as ConversationResponse;
}

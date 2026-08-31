import type { LearningFeedback } from '@/types/feedback';
import type { VocabItem } from '@/types/learning';
import { auth } from '@/firebase/firebase';
import { getLearningUserId } from '@/firebase/learning-records';

type VocabularyResponse = {
  conversationTitle?: string;
  openingStaffMessage?: string;
  openingTranslation?: string;
  openingExampleReply?: string;
  openingExamplePronunciation?: string;
  culturalTips?: string[];
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
}): Promise<LearningFeedback> {
  const response = await fetch('/api/conversation-feedback', {
    method: 'POST',
    headers: await getAuthenticatedApiHeaders(),
    body: JSON.stringify(input),
  });
  const data = await response.json() as LearningFeedback & { error?: string };
  if (!response.ok || !data.suggestions || !data.strengths || !data.improvements || !data.recommendedReplies || !data.messageCorrections) {
    throw new Error(data.error ?? 'Feedback failed');
  }
  return data;
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

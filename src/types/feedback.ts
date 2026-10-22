import type { PhraseItem } from './learning';

export type ConversationMessage = {
  speaker: 'STAFF' | 'YOU';
  text: string;
  translation?: string;
  exampleReply?: string;
  examplePronunciation?: string;
};

export type MessageCorrection = {
  originalMessage: string;
  correctedMessage: string;
  /** 교정 문장의 뜻입니다. 원문 뜻과 혼동되지 않도록 별도로 보관합니다. */
  correctedTranslation?: string;
  changedParts: Array<{
    original: string;
    corrected: string;
  }>;
};

export type LearningFeedback = {
  suggestions: string[];
  strengths: string[];
  improvements: string[];
  recommendedReplies?: PhraseItem[];
  messageCorrections?: MessageCorrection[];
  goalAchievement?: {
    summary: string;
    completed: string[];
    missing: string[];
  };
  priorityCorrection?: {
    title: string;
    reason: string;
    correctedExample: string;
  } | null;
  reusableSentence?: PhraseItem | null;
  nextPracticeGoal?: string;
  recurringWeakness?: string | null;
};

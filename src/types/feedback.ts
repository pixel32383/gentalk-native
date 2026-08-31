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
};

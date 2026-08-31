export type VocabItem = {
  word: string;
  rom?: string;
  translation: string;
  pos: string;
};

export type PhraseItem = {
  phrase: string;
  rom?: string;
  translation: string;
};

export type DailySentence = PhraseItem & {
  id: string;
  languageCode: string;
  situation: string;
  savedAt: string;
};

export type DialogueLine = {
  speaker: 'A' | 'B';
  role: string;
  text: string;
  rom?: string;
  translation: string;
  correction?: import('./feedback').MessageCorrection;
};

export type Difficulty = '기초' | '중급' | '고급';

export type LearningProgress = {
  id: string;
  scenario: Scenario;
  stage: number;
  selectedWords: string[];
  matchedWords: string[];
  matchingPage: number;
  messages: import('./feedback').ConversationMessage[];
  feedback?: import('./feedback').LearningFeedback;
  conversationCompleted: boolean;
  updatedAt: string;
};

export type Scenario = {
  id: string;
  langCode: string;
  situation: string;
  title: string;
  difficulty: Difficulty;
  context: string;
  vocabulary: VocabItem[];
  phrases: PhraseItem[];
  dialogue: DialogueLine[];
  culturalNote: string;
  culturalNotes?: string[];
  keywords: string[];
  emoji: string;
  openingStaffMessage?: string;
  openingTranslation?: string;
  openingExampleReply?: string;
  openingExamplePronunciation?: string;
  learningFeedback?: import('./feedback').LearningFeedback;
  feedbackReviewed?: boolean;
  completedAt?: string;
};

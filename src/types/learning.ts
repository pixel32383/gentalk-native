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

/** 같은 문화 팁을 표시 언어별로 보관해 언어 전환 시 즉시 바꿔 보여줍니다. */
export type CulturalTip = {
  ko: string;
  en: string;
  ja: string;
};

export type DailySentence = PhraseItem & {
  id: string;
  languageCode: string;
  situation: string;
  savedAt: string;
  /** 이전 버전에서 저장한 마지막 학습 완료 날짜입니다. */
  completedOn?: string;
  /** 월별 학습 완료 날짜입니다. 다시 학습을 누르면 해당 월의 값만 제거됩니다. */
  completedMonths?: Record<string, string>;
};

/** 날짜별로 확정한 오늘의 문장 ID 목록입니다. */
export type DailySentencePlans = Record<string, string[]>;

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
  culturalNotes?: Array<CulturalTip | string>;
  culturalNoteIndex?: number;
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

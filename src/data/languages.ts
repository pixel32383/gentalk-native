import type { Lang } from '@/types/language';

export const LANGUAGES: Lang[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', label: '영어' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', label: '프랑스어' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', label: '일본어' },
  { code: 'es', name: 'Español', flag: '🇪🇸', label: '스페인어' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', label: '독일어' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', label: '한국어' },
  { code: 'zh', name: '中文', flag: '🇨🇳', label: '중국어' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', label: '러시아어' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', label: '아랍어' },
];

export const DISPLAY_LANGUAGE_CODES = ['en', 'ko', 'ja'] as const;

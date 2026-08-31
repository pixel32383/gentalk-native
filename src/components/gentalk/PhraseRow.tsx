import { useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Speech from 'expo-speech';
import { getSelectedSpeechVoice, getSpeechPitch, getSpeechRate } from '@/services/voice-settings';
import { Bookmark, BookmarkCheck, Volume2 } from 'lucide-react-native';
import { COLORS } from '@/data/constants';
import type { PhraseItem } from '@/types/learning';
import { AppText } from './AppText';

export function PhraseRow({ item, languageCode, isDailySentence = false, onToggleDailySentence }: { item: PhraseItem; languageCode: string; isDailySentence?: boolean; onToggleDailySentence?: () => void }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechLanguage = { ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ru: 'ru-RU', ar: 'ar-SA', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' }[languageCode] ?? 'en-US';

  const speakPhrase = () => {
    if (isSpeaking) {
      setIsSpeaking(false);
      void Speech.stop();
      return;
    }

    void Speech.stop().finally(async () => {
      setIsSpeaking(true);
      const voice = await getSelectedSpeechVoice(speechLanguage);
      Speech.speak(item.phrase, {
        language: speechLanguage,
        rate: getSpeechRate(),
        pitch: getSpeechPitch(),
        voice,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    });
  };

  return <View className="flex-row items-center gap-3 rounded-xl border border-[#E9DDCE] bg-white p-4"><View className="min-w-0 flex-1"><AppText className="text-base font-black leading-6 text-[#231A0E]">{item.phrase}</AppText>{item.rom ? <AppText className="mt-1 font-mono text-xs text-[#8A7D6D]">{item.rom}</AppText> : null}<AppText className="mt-1 text-xs text-[#8A7D6D]">{item.translation}</AppText></View><View className="gap-2"><Pressable accessibilityRole="button" accessibilityLabel={`${item.phrase} ${isSpeaking ? '재생 중' : '듣기'}`} onPress={speakPhrase} className={`flex-row items-center gap-1 rounded-lg px-2.5 py-2 active:opacity-70 ${isSpeaking ? 'bg-[#914523]' : 'bg-[#F3EBDD]'}`}><Volume2 size={17} color={isSpeaking ? '#FFFFFF' : COLORS.muted} /><AppText className={`text-xs font-black ${isSpeaking ? 'text-white' : 'text-[#6B5843]'}`}>{isSpeaking ? '재생 중' : '듣기'}</AppText></Pressable>{onToggleDailySentence ? <Pressable accessibilityRole="button" accessibilityLabel={isDailySentence ? '오늘의 문장에서 제거' : '오늘의 문장에 저장'} onPress={onToggleDailySentence} className={`items-center rounded-lg px-2.5 py-2 active:opacity-70 ${isDailySentence ? 'bg-[#255F5A]' : 'bg-[#F3EBDD]'}`}>{isDailySentence ? <BookmarkCheck size={17} color="#FFFFFF" /> : <Bookmark size={17} color={COLORS.muted} />}</Pressable> : null}</View></View>;
}

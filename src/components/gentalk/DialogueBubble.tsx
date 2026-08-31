import { useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Speech from 'expo-speech';
import { getSelectedSpeechVoice, getSpeechPitch, getSpeechRate } from '@/services/voice-settings';
import type { DialogueLine } from '@/types/learning';
import { AppText } from './AppText';

function CorrectedSentence({ line }: { line: DialogueLine }) {
  const correction = line.correction;
  if (!correction) return null;

  const changedParts = correction.changedParts
    .map((part) => part.corrected.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  const pattern = changedParts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = pattern ? correction.correctedMessage.split(new RegExp(`(${pattern})`, 'gi')) : [correction.correctedMessage];

  return (
    <View className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
      <AppText className="mb-1 text-[10px] font-black text-red-500">수정 문장</AppText>
      <AppText className="text-sm font-semibold leading-5 text-[#231A0E]">
        {parts.map((part, index) => {
          const isChanged = changedParts.some((changed) => changed.toLocaleLowerCase() === part.toLocaleLowerCase());
          return isChanged
            ? <AppText key={`${part}-${index}`} className="font-black text-red-500">{part}</AppText>
            : part;
        })}
      </AppText>
    </View>
  );
}

export function DialogueBubble({ line, languageCode }: { line: DialogueLine; languageCode: string }) {
  const isStaff = line.speaker === 'A';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasTranslation = Boolean(line.translation && line.translation !== line.text);
  const speechText = line.correction?.correctedMessage ?? line.text;
  const speechLanguage = { ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ru: 'ru-RU', ar: 'ar-SA', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' }[languageCode] ?? 'en-US';
  const speak = () => {
    if (isSpeaking) {
      setIsSpeaking(false);
      void Speech.stop();
      return;
    }

    void Speech.stop().finally(async () => {
      setIsSpeaking(true);
      const voice = await getSelectedSpeechVoice(speechLanguage);
      Speech.speak(speechText, {
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
  const content = <><AppText className="mb-1 text-xs font-black text-[#C77932]">{line.role}</AppText><AppText className="text-base font-black leading-6 text-[#231A0E]">{line.text}</AppText>{line.rom ? <AppText className="mt-1 font-mono text-xs text-[#8A7D6D]">{line.rom}</AppText> : null}{hasTranslation ? <AppText className="mt-2 text-xs leading-5 text-[#8A7D6D]">{line.translation}</AppText> : null}{!isStaff ? <CorrectedSentence line={line} /> : null}</>;

  if (isStaff) return <View className="self-start rounded-2xl border border-[#E9DDCE] bg-white p-4">{content}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${speechText} 듣기`} onPress={speak} className={`self-end rounded-2xl bg-[#E7F2EF] p-4 active:opacity-75 ${isSpeaking ? 'border border-[#255F5A]' : ''}`}>{content}</Pressable>;
}

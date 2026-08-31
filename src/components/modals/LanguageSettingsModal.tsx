import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import * as Speech from 'expo-speech';
import { Globe, Languages, Volume2, X } from 'lucide-react-native';
import { COLORS } from '@/data/constants';
import { DISPLAY_LANGUAGE_CODES, LANGUAGES } from '@/data/languages';
import { AppText } from '@/components/gentalk/AppText';
import { LanguagePicker } from '@/components/gentalk/LanguagePicker';
import { RoundButton } from '@/components/gentalk/RoundButton';
import { SettingLabel } from '@/components/gentalk/SettingLabel';
import { getSelectedSpeechVoice, getSpeechPitch } from '@/services/voice-settings';

type SpeechVoiceMode = 'default' | 'male';

const SPEECH_LANGUAGES: Record<string, string> = {
  ar: 'ar-SA', de: 'de-DE', en: 'en-US', es: 'es-ES', fr: 'fr-FR', ja: 'ja-JP', ko: 'ko-KR', ru: 'ru-RU', zh: 'zh-CN',
};

const VOICE_PREVIEW_TEXT: Record<string, string> = {
  ar: 'مرحبًا، لنتدرّب معًا.', de: 'Hallo, lass uns zusammen üben.', en: "Hello, let's practice together.", es: 'Hola, practiquemos juntos.', fr: 'Bonjour, entraînons-nous ensemble.', ja: 'こんにちは。一緒に練習しましょう。', ko: '안녕하세요. 함께 연습해요.', ru: 'Здравствуйте, давайте заниматься вместе.', zh: '你好，我们一起练习吧。',
};

export function LanguageSettingsModal({
  visible,
  userLang,
  learningLang,
  speechRate,
  speechVoiceMode,
  onClose,
  onUpdateLangs,
  onUpdateSpeechRate,
  onUpdateSpeechVoiceMode,
}: {
  visible: boolean;
  userLang: string;
  learningLang: string;
  speechRate: number;
  speechVoiceMode: SpeechVoiceMode;
  onClose: () => void;
  onUpdateLangs: (userLang: string, learningLang: string) => void;
  onUpdateSpeechRate: (rate: number) => void;
  onUpdateSpeechVoiceMode: (mode: SpeechVoiceMode) => void;
}) {
  const [draftUserLang, setDraftUserLang] = useState(userLang);
  const [draftLearningLang, setDraftLearningLang] = useState(learningLang);
  const [draftSpeechRate, setDraftSpeechRate] = useState(speechRate);
  const [draftSpeechVoiceMode, setDraftSpeechVoiceMode] = useState<SpeechVoiceMode>(speechVoiceMode);
  const [previewingMode, setPreviewingMode] = useState<SpeechVoiceMode | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDraftUserLang(userLang);
    setDraftLearningLang(learningLang);
    setDraftSpeechRate(speechRate);
    setDraftSpeechVoiceMode(speechVoiceMode);
  }, [learningLang, speechRate, speechVoiceMode, userLang, visible]);

  useEffect(() => () => {
    void Speech.stop();
  }, []);

  const closeModal = () => {
    setPreviewingMode(null);
    void Speech.stop();
    onClose();
  };

  const previewVoice = (mode: SpeechVoiceMode) => {
    if (previewingMode === mode) {
      setPreviewingMode(null);
      void Speech.stop();
      return;
    }

    const speechLanguage = SPEECH_LANGUAGES[draftLearningLang] ?? 'en-US';
    const previewText = VOICE_PREVIEW_TEXT[draftLearningLang] ?? VOICE_PREVIEW_TEXT.en;
    void Speech.stop().finally(async () => {
      setPreviewingMode(mode);
      const voice = await getSelectedSpeechVoice(speechLanguage, mode);
      Speech.speak(previewText, {
        language: speechLanguage,
        rate: draftSpeechRate,
        pitch: getSpeechPitch(mode),
        voice,
        onDone: () => setPreviewingMode((current) => (current === mode ? null : current)),
        onStopped: () => setPreviewingMode((current) => (current === mode ? null : current)),
        onError: () => setPreviewingMode((current) => (current === mode ? null : current)),
      });
    });
  };

  const voiceOptions: { label: string; value: SpeechVoiceMode }[] = [
    { label: '목소리 1', value: 'default' },
    { label: '목소리 2', value: 'male' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeModal}>
      <View className="flex-1 items-center justify-center bg-black/40 px-5">
        <View className="w-full rounded-2xl bg-white p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <AppText className="text-xl font-black text-[#231A0E]">언어 설정</AppText>
              <AppText className="mt-1 text-xs text-[#8A7D6D]">표시 언어와 학습 언어를 선택하세요.</AppText>
            </View>
            <RoundButton onPress={closeModal}><X size={15} color={COLORS.muted} /></RoundButton>
          </View>

          <SettingLabel icon={<Languages size={14} color={COLORS.accent} />} label="내 언어" />
          <LanguagePicker selected={draftUserLang} onSelect={setDraftUserLang} languages={LANGUAGES.filter((language) => DISPLAY_LANGUAGE_CODES.includes(language.code as (typeof DISPLAY_LANGUAGE_CODES)[number]))} />
          <SettingLabel icon={<Globe size={14} color={COLORS.accent} />} label="배울 언어" />
          <LanguagePicker selected={draftLearningLang} onSelect={setDraftLearningLang} />
          <SettingLabel icon={<Volume2 size={14} color={COLORS.accent} />} label="듣기 속도" />
          <View className="flex-row gap-2">
            {([{ label: '느리게', value: 0.8 }, { label: '보통', value: 1 }, { label: '빠르게', value: 1.2 }] as const).map((option) => (
              <Pressable key={option.value} onPress={() => setDraftSpeechRate(option.value)} className={`flex-1 rounded-xl border px-2 py-3 ${draftSpeechRate === option.value ? 'border-[#255F5A] bg-[#E7F2EF]' : 'border-[#E9DDCE] bg-white'}`}>
                <AppText className={`text-center text-xs font-black ${draftSpeechRate === option.value ? 'text-[#255F5A]' : 'text-[#6B5843]'}`}>{option.label}</AppText>
              </Pressable>
            ))}
          </View>

          <SettingLabel icon={<Volume2 size={14} color={COLORS.accent} />} label="목소리 음성" />
          <View className="flex-row gap-2">
            {voiceOptions.map((option) => {
              const selected = draftSpeechVoiceMode === option.value;
              const previewing = previewingMode === option.value;
              return (
                <View key={option.value} className={`flex-1 rounded-xl border p-1.5 ${selected ? 'border-[#255F5A] bg-[#E7F2EF]' : 'border-[#E9DDCE] bg-white'}`}>
                  <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setDraftSpeechVoiceMode(option.value)} className="rounded-lg px-2 py-2 active:opacity-70">
                    <AppText className={`text-center text-xs font-black ${selected ? 'text-[#255F5A]' : 'text-[#6B5843]'}`}>{option.label}</AppText>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${option.label} ${previewing ? '미리 듣기 중지' : '미리 듣기'}`} onPress={() => previewVoice(option.value)} className={`flex-row items-center justify-center gap-1 rounded-lg px-2 py-2 active:opacity-70 ${previewing ? 'bg-[#914523]' : 'bg-[#F3EBDD]'}`}>
                    <Volume2 size={13} color={previewing ? '#FFFFFF' : '#914523'} />
                    <AppText className={`text-[11px] font-black ${previewing ? 'text-white' : 'text-[#914523]'}`}>{previewing ? '재생 중' : '미리 듣기'}</AppText>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View className="mt-5 flex-row justify-end gap-2">
            <Pressable onPress={closeModal} className="rounded-xl border border-[#E9DDCE] px-5 py-3 active:opacity-80"><AppText className="font-bold text-[#231A0E]">취소</AppText></Pressable>
            <Pressable onPress={() => { onUpdateLangs(draftUserLang, draftLearningLang); onUpdateSpeechRate(draftSpeechRate); onUpdateSpeechVoiceMode(draftSpeechVoiceMode); closeModal(); }} className="rounded-xl bg-[#255F5A] px-5 py-3 active:opacity-80"><AppText className="font-bold text-white">저장</AppText></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

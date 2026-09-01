import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, TextInput, View } from 'react-native';
import { Mic, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { getSelectedSpeechVoice, getSpeechPitch, getSpeechRate } from '@/services/voice-settings';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/gentalk/AppText';
import { OperationErrorNotice } from '@/components/gentalk/OperationErrorNotice';
import { translateText } from '@/data/translations';
import type { ConversationMessage } from '@/types/feedback';

type SpeechRecognitionPackage = typeof import('expo-speech-recognition');

let speechRecognition: SpeechRecognitionPackage | null = null;
try {
  speechRecognition = require('expo-speech-recognition') as SpeechRecognitionPackage;
} catch {
  // An older development build does not contain the native speech module yet.
}

type StaffDetail = 'translation' | 'example' | undefined;

type ConversationStepProps = {
  words: string[];
  messages: ConversationMessage[];
  visibleStaffDetails: Record<number, StaffDetail>;
  onToggleStaffDetail: (index: number, detail: Exclude<StaffDetail, undefined>) => void;
  needsHint: boolean;
  irrelevantCount: number;
  showHint: boolean;
  showExampleReply: boolean;
  hint: string;
  exampleReply: string;
  onToggleHint: () => void;
  onToggleExampleReply: () => void;
  isCompleted: boolean;
  message: string;
  isSending: boolean;
  learningLanguage: string;
  onChangeMessage: (value: string) => void;
  onFocusMessageInput: () => void;
  onSend: () => void;
  hasConversationError: boolean;
  onRetryConversation: () => void;
  onDismissConversationError: () => void;
};

function StaffTypingIndicator() {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.35);
  const animatedDotsStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (reducedMotion) {
      opacity.set(1);
      return;
    }

    opacity.set(withRepeat(withSequence(withTiming(1, { duration: 450 }), withTiming(0.35, { duration: 450 })), -1));
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);

  return (
    <View className="self-start rounded-2xl border border-[#E1D2BB] bg-white px-4 py-3">
      <AppText className="font-mono text-[11px] text-[#914523]">STAFF</AppText>
      <View className="mt-1 flex-row items-center gap-2">
        <AppText className="text-sm text-[#6B5843]">답변을 작성하고 있어요</AppText>
        <Animated.View style={animatedDotsStyle}>
          <AppText className="text-base font-black text-[#914523]">···</AppText>
        </Animated.View>
      </View>
    </View>
  );
}

export function ConversationStep({
  words,
  messages,
  visibleStaffDetails,
  onToggleStaffDetail,
  needsHint,
  irrelevantCount,
  showHint,
  showExampleReply,
  hint,
  exampleReply,
  onToggleHint,
  onToggleExampleReply,
  isCompleted,
  message,
  isSending,
  learningLanguage,
  onChangeMessage,
  onFocusMessageInput,
  onSend,
  hasConversationError,
  onRetryConversation,
  onDismissConversationError,
}: ConversationStepProps) {
  const [isListening, setIsListening] = useState(false);
  const [isWordListExpanded, setIsWordListExpanded] = useState(false);
  const lastSpokenStaffText = useRef<string | null>(null);
  const speechLanguage = { ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ru: 'ru-RU', ar: 'ar-SA', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' }[learningLanguage] ?? 'en-US';
  const speechModule = speechRecognition?.ExpoSpeechRecognitionModule;

  const replayStaffSentence = (sentence: string) => {
    void Speech.stop().finally(async () => {
      const voice = await getSelectedSpeechVoice(speechLanguage);
      Speech.speak(sentence, { language: speechLanguage, rate: getSpeechRate(), pitch: getSpeechPitch(), voice });
    });
  };

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.speaker !== 'STAFF') {
      lastSpokenStaffText.current = null;
      return;
    }
    if (lastSpokenStaffText.current === latestMessage.text) return;

    lastSpokenStaffText.current = latestMessage.text;
    replayStaffSentence(latestMessage.text);
  }, [messages, speechLanguage]);

  useEffect(() => {
    if (!speechModule) return;

    const startSubscription = speechModule.addListener('start', () => setIsListening(true));
    const endSubscription = speechModule.addListener('end', () => setIsListening(false));
    const resultSubscription = speechModule.addListener('result', (event) => {
      const transcript = event.results[0]?.transcript;
      if (transcript) onChangeMessage(transcript);
    });
    const errorSubscription = speechModule.addListener('error', (event) => {
      if (event.error === 'aborted') return;
      setIsListening(false);
      Alert.alert('음성 인식 오류', event.message || '음성을 인식하지 못했습니다. 다시 시도해주세요.');
    });

    return () => {
      startSubscription.remove();
      endSubscription.remove();
      resultSubscription.remove();
      errorSubscription.remove();
    };
  }, [onChangeMessage, speechModule]);

  async function toggleSpeechRecognition() {
    if (isListening) {
      speechModule?.stop();
      return;
    }

    await Speech.stop();

    if (!speechModule) {
      Alert.alert('새 앱 설치가 필요합니다', '말하기 기능을 사용하려면 새 개발 APK를 설치해주세요.');
      return;
    }

    if (!speechModule.isRecognitionAvailable()) {
      Alert.alert('음성 인식을 사용할 수 없습니다', '기기의 음성 인식 서비스를 확인해주세요.');
      return;
    }

    const permission = await speechModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        '마이크 권한이 필요합니다',
        '말하기 기능을 사용하려면 설정에서 마이크 권한을 허용해주세요.',
        [
          { text: '나중에', style: 'cancel' },
          { text: '설정 열기', onPress: () => void Linking.openSettings() },
        ],
      );
      return;
    }

    speechModule.start({
      lang: speechLanguage,
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
    });
  }

  return (
    <>
      <View className="rounded-2xl bg-[#F3EBDD] p-4">
        <View className="flex-row items-center justify-between gap-3">
          <AppText className="font-mono text-xs text-[#914523]">이번 대화에 사용할 단어</AppText>
          {words.length > 0 ? (
            <Pressable onPress={() => setIsWordListExpanded((current) => !current)} className="rounded-md px-1 py-0.5 active:opacity-70">
              <AppText className="text-xs font-black text-[#914523]">{isWordListExpanded ? '접기' : '전체 보기'}</AppText>
            </Pressable>
          ) : null}
        </View>
        <View className="mt-2 flex-row flex-wrap gap-2 overflow-hidden" style={isWordListExpanded ? undefined : { maxHeight: 28 }}>
          {words.map((word) => (
            <View key={word} className="rounded-full bg-white px-3 py-1">
              <AppText className="text-xs font-bold text-[#914523]">{word}</AppText>
            </View>
          ))}
        </View>
      </View>

      {messages.map((item, index) => (
        <View key={`${item.speaker}-${index}`} className={`rounded-2xl p-4 ${item.speaker === 'YOU' ? 'self-end bg-[#E7D6C2]' : 'border border-[#E1D2BB] bg-white'}`}>
          <AppText className="font-mono text-[11px] text-[#914523]">{item.speaker}</AppText>
          <AppText className={`mt-1 ${item.speaker === 'STAFF' ? 'text-base' : 'text-sm'} text-[#231A0E]`}>{item.text}</AppText>
          {item.speaker === 'STAFF' && (item.translation || item.exampleReply) ? (
            <View className="mt-3 items-end">
              <View className="flex-row gap-2">
                <Pressable onPress={() => replayStaffSentence(item.text)} className="flex-row items-center gap-1 rounded-lg bg-[#F3EBDD] px-2.5 py-1.5"><Volume2 size={13} color="#914523" /><AppText className="text-[11px] font-black text-[#914523]">다시 듣기</AppText></Pressable>
                {item.exampleReply ? <Pressable onPress={() => onToggleStaffDetail(index, 'example')} className="rounded-lg bg-[#F3EBDD] px-2.5 py-1.5"><AppText className="text-[11px] font-black text-[#914523]">예시 답변</AppText></Pressable> : null}
                {item.translation ? <Pressable onPress={() => onToggleStaffDetail(index, 'translation')} className="rounded-lg bg-[#F3EBDD] px-2.5 py-1.5"><AppText className="text-[11px] font-black text-[#914523]">해석</AppText></Pressable> : null}
              </View>
              {visibleStaffDetails[index] === 'example' && item.exampleReply ? <View className="mt-2 self-stretch rounded-lg bg-[#F8F1E8] p-2"><AppText className="text-sm text-[#6B5843]">예시: {item.exampleReply}</AppText>{item.examplePronunciation ? <AppText className="mt-1 text-xs leading-5 text-[#8A7D6D]">발음: {item.examplePronunciation}</AppText> : null}</View> : null}
              {visibleStaffDetails[index] === 'translation' && item.translation ? <AppText className="mt-2 self-stretch rounded-lg bg-[#F8F1E8] p-2 text-sm text-[#6B5843]">해석: {item.translation}</AppText> : null}
            </View>
          ) : null}
        </View>
      ))}

      {isSending ? <StaffTypingIndicator /> : null}

      {hasConversationError ? <OperationErrorNotice message="대화를 이어가지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요." onRetry={onRetryConversation} onLater={onDismissConversationError} /> : null}

      {needsHint ? (
        <View className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AppText className="text-sm font-bold text-amber-800">현재 상황과 관련된 답변을 해보세요. 직원의 마지막 질문에 답하면 됩니다.</AppText>
          {irrelevantCount >= 2 ? (
            <View className="mt-3 gap-2">
              <View className="flex-row gap-2">
                <Pressable onPress={onToggleHint} className="rounded-lg bg-white px-3 py-2"><AppText className="text-xs font-black text-[#914523]">힌트 보기</AppText></Pressable>
                <Pressable onPress={onToggleExampleReply} className="rounded-lg bg-white px-3 py-2"><AppText className="text-xs font-black text-[#914523]">예시 답변 보기</AppText></Pressable>
              </View>
              {showHint ? <AppText className="text-sm text-amber-800">힌트: {hint}</AppText> : null}
              {showExampleReply && exampleReply ? <AppText className="text-sm text-amber-800">예시: {exampleReply}</AppText> : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {isCompleted ? (
        <View className="items-center rounded-xl border border-emerald-200 bg-emerald-50 py-3"><AppText className="text-sm font-black text-emerald-800">대화가 완료되었습니다. 다음 단계로 넘어가세요.</AppText></View>
      ) : (
        <View className="gap-2">
          <TextInput
            value={message}
            editable={!isSending}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            onChangeText={onChangeMessage}
            onFocus={onFocusMessageInput}
            placeholder={translateText('메시지를 입력하세요...')}
            placeholderTextColor="#A58E76"
            className="min-h-[68px] flex-1 rounded-xl border border-[#D9B37D] bg-white px-3 py-3 text-base text-[#231A0E]"
          />
          <View className="flex-row gap-2">
            <Pressable disabled={isSending} onPress={() => void toggleSpeechRecognition()} className={`flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-[#D9B37D] py-3 active:opacity-80 ${isListening ? 'bg-[#F3EBDD]' : 'bg-white'} ${isSending ? 'opacity-50' : ''}`}>
              <Mic size={16} color="#914523" />
              <AppText className="text-sm font-black text-[#914523]">{isListening ? '듣는 중' : '말하기'}</AppText>
            </Pressable>
            <Pressable disabled={isSending} onPress={onSend} className={`flex-1 items-center justify-center rounded-xl bg-[#914523] py-3 ${isSending ? 'opacity-50' : ''}`}><AppText className="font-bold text-white">{isSending ? '...' : '전송'}</AppText></Pressable>
          </View>
        </View>
      )}
    </>
  );
}

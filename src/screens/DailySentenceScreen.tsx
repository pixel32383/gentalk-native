import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import { getSelectedSpeechVoice, getSpeechPitch, getSpeechRate } from '@/services/voice-settings';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Mic, Phone, Search, Settings2, Volume2, X } from 'lucide-react-native';
import { AppHeader } from '@/components/gentalk/AppHeader';
import { COLORS } from '@/data/constants';
import { AppText } from '@/components/gentalk/AppText';
import { RoundButton } from '@/components/gentalk/RoundButton';
import { getDisplayLocale, translateTemplate, translateText } from '@/data/translations';
import type { DailySentence } from '@/types/learning';

type SpeechRecognitionPackage = typeof import('expo-speech-recognition');

let speechRecognition: SpeechRecognitionPackage | null = null;
try {
  speechRecognition = require('expo-speech-recognition') as SpeechRecognitionPackage;
} catch {
  // An older app build may not have the speech recognition native module yet.
}

function normalizeSpokenText(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\p{P}\p{S}]/gu, '');
}

function getSentenceMatch(target: string, spoken: string) {
  const expected = normalizeSpokenText(target);
  const recognized = normalizeSpokenText(spoken);
  if (!expected || !recognized) return { score: 0, label: '다시 말해보세요', description: '문장을 보며 천천히 한 번 더 말해보세요.', tone: 'retry' as const };

  const previous = Array.from({ length: recognized.length + 1 }, (_, index) => index);
  for (let row = 1; row <= expected.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= recognized.length; column += 1) {
      const current = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (expected[row - 1] === recognized[column - 1] ? 0 : 1),
      );
      diagonal = current;
    }
  }

  const score = Math.round((1 - previous[recognized.length] / Math.max(expected.length, recognized.length)) * 100);
  if (score >= 80) return { score, label: '잘했어요!', description: '문장을 거의 정확하게 말했어요.', tone: 'success' as const };
  if (score >= 55) return { score, label: '거의 다 왔어요', description: '조금 더 천천히 또박또박 말해보세요.', tone: 'close' as const };
  return { score, label: '다시 말해보세요', description: '문장을 보며 천천히 한 번 더 말해보세요.', tone: 'retry' as const };
}

type PracticeToken = { text: string; normalized: string };

function tokenizePracticeSentence(value: string, languageCode: string): PracticeToken[] {
  const matches = languageCode === 'ja'
    ? value.match(/[A-Za-z0-9]+|[ぁ-んァ-ヺー]+|[一-龯々]+/g)
    : value.match(/[\p{L}\p{N}]+/gu);
  return (matches ?? []).map((text) => ({ text, normalized: normalizeSpokenText(text) }));
}

function getWordFeedback(target: string, spoken: string, languageCode: string) {
  const expected = tokenizePracticeSentence(target, languageCode);
  const recognized = tokenizePracticeSentence(spoken, languageCode);
  const rows = expected.length + 1;
  const columns = recognized.length + 1;
  const table = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      table[row][column] = expected[row - 1].normalized === recognized[column - 1].normalized
        ? table[row - 1][column - 1] + 1
        : Math.max(table[row - 1][column], table[row][column - 1]);
    }
  }

  const matchedExpected = new Set<number>();
  const matchedRecognized = new Set<number>();
  let row = expected.length;
  let column = recognized.length;
  while (row > 0 && column > 0) {
    if (expected[row - 1].normalized === recognized[column - 1].normalized) {
      matchedExpected.add(row - 1);
      matchedRecognized.add(column - 1);
      row -= 1;
      column -= 1;
    } else if (table[row - 1][column] >= table[row][column - 1]) {
      row -= 1;
    } else {
      column -= 1;
    }
  }

  return {
    spoken: recognized.map((token, index) => ({
      ...token,
      correct: matchedRecognized.has(index),
      expected: expected[index]?.text ?? token.text,
    })),
    missing: expected.filter((_, index) => !matchedExpected.has(index)),
  };
}

function getSpeechLanguage(languageCode: string) {
  return { ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ru: 'ru-RU', ar: 'ar-SA', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' }[languageCode] ?? 'en-US';
}

export function DailySentenceScreen({
  sentenceTime,
  sentenceEnabled,
  sentenceCount,
  dailySentences,
  onOpenSchedule,
  onToggleSentence,
  onChangeSentenceCount,
  onRemoveSentence,
}: {
  sentenceTime: string;
  sentenceEnabled: boolean;
  sentenceCount: number;
  dailySentences: DailySentence[];
  onOpenSchedule: () => void;
  onToggleSentence: (enabled: boolean) => void;
  onChangeSentenceCount: (count: number) => void;
  onRemoveSentence: (id: string) => void;
}) {
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [spokenSentences, setSpokenSentences] = useState<Record<string, string>>({});
  const activeSentenceIdRef = useRef<string | null>(null);
  const speechModule = speechRecognition?.ExpoSpeechRecognitionModule;
  const practiceSentences = dailySentences.map((sentence) => {
    const savedAt = new Date(sentence.savedAt);
    return { id: sentence.id, month: savedAt.toISOString().slice(0, 7), date: new Intl.DateTimeFormat(getDisplayLocale(), { month: 'numeric', day: 'numeric' }).format(savedAt), sentence: sentence.phrase, translation: sentence.translation, languageCode: sentence.languageCode };
  });
  const sentSentences = practiceSentences;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthOptions = Array.from(new Set([currentMonth, ...sentSentences.map((item) => item.month)]))
    .sort()
    .map((value) => ({ value, label: new Intl.DateTimeFormat(getDisplayLocale(), { year: 'numeric', month: 'long' }).format(new Date(`${value}-01T00:00:00`)) }));
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedMonthIndex = monthOptions.findIndex((month) => month.value === selectedMonth);
  const selectedMonthLabel =
    monthOptions[selectedMonthIndex]?.label ?? monthOptions[monthOptions.length - 1].label;
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleSentences = sentSentences.filter((item) =>
    item.month === selectedMonth && (!normalizedSearchQuery || `${item.sentence} ${item.translation}`.toLocaleLowerCase().includes(normalizedSearchQuery)),
  );
  const groupedSentences = visibleSentences.reduce<Array<{ date: string; items: typeof visibleSentences }>>(
    (groups, item) => {
      const group = groups.find((candidate) => candidate.date === item.date);
      if (group) group.items.push(item);
      else groups.push({ date: item.date, items: [item] });
      return groups;
    },
    [],
  );

  useEffect(() => {
    if (!speechModule) return;

    const startSubscription = speechModule.addListener('start', () => {
      setActiveSentenceId(activeSentenceIdRef.current);
    });
    const endSubscription = speechModule.addListener('end', () => {
      activeSentenceIdRef.current = null;
      setActiveSentenceId(null);
    });
    const resultSubscription = speechModule.addListener('result', (event) => {
      const transcript = event.results[0]?.transcript;
      const sentenceId = activeSentenceIdRef.current;
      if (transcript && sentenceId) {
        setSpokenSentences((current) => ({ ...current, [sentenceId]: transcript }));
      }
    });
    const errorSubscription = speechModule.addListener('error', (event) => {
      if (event.error === 'aborted') return;
      activeSentenceIdRef.current = null;
      setActiveSentenceId(null);
      Alert.alert('음성 인식 오류', event.message || '음성을 인식하지 못했습니다. 다시 시도해주세요.');
    });

    return () => {
      startSubscription.remove();
      endSubscription.remove();
      resultSubscription.remove();
      errorSubscription.remove();
      speechModule.stop();
    };
  }, [speechModule]);

  async function toggleSentenceSpeaking(item: { id: string; languageCode: string }) {
    if (activeSentenceIdRef.current === item.id) {
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
        '문장을 말하려면 설정에서 마이크 권한을 허용해주세요.',
        [
          { text: '나중에', style: 'cancel' },
          { text: '설정 열기', onPress: () => void Linking.openSettings() },
        ],
      );
      return;
    }

    const language = getSpeechLanguage(item.languageCode);
    activeSentenceIdRef.current = item.id;
    setSpokenSentences((current) => ({ ...current, [item.id]: '' }));
    speechModule.start({ lang: language, interimResults: true, maxAlternatives: 1, continuous: false });
  }

  function replayPracticeWord(word: string, languageCode: string) {
    void Speech.stop().finally(async () => {
      const language = getSpeechLanguage(languageCode);
      const voice = await getSelectedSpeechVoice(language);
      Speech.speak(word, { language, rate: getSpeechRate(), pitch: getSpeechPitch(), voice });
    });
  }

  return (
    <>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 136 }}>
        <AppHeader
          title="학습한 문장"
          subtitle="상황별 학습한 문장들을 매일 한 문장씩 복습해봐요."
        />
        <View className="mx-5 mb-5 rounded-2xl border border-[#DED0BA] bg-[#F3EBDD] px-5 py-5">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E7D6C2]">
              <Phone size={20} color="#914523" />
            </View>
            <View className="min-w-0 flex-1">
              <AppText className="text-base font-black text-[#231A0E]">배운 문장을 다시 말해보세요</AppText>
              <AppText className="mt-1 text-xs leading-5 text-[#8A7D6D]">
                {sentenceEnabled
                  ? translateTemplate('매일 {time}에 문장 {count}개를 보내드려요.', { time: sentenceTime, count: sentenceCount })
                  : '오늘의 문장 알림이 꺼져 있어요.'}
              </AppText>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="오늘의 문장 시간 설정"
                onPress={onOpenSchedule}
                className="h-10 w-10 items-center justify-center rounded-full border border-[#D8CAB5] bg-[#FBF5E9] active:opacity-70">
                <Settings2 size={18} color="#6B5843" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`오늘의 문장 ${sentenceCount}개 선택됨`}
                accessibilityHint="누르면 문장 개수가 1개, 2개, 3개 순서로 변경됩니다"
                onPress={() => onChangeSentenceCount(sentenceCount === 3 ? 1 : sentenceCount + 1)}
                className="h-10 w-10 items-center justify-center rounded-full border border-[#D8CAB5] bg-[#FBF5E9] active:opacity-70">
                <AppText className="text-sm font-black text-[#6B5843]">{sentenceCount}</AppText>
              </Pressable>
              <Switch
                accessibilityLabel="오늘의 문장 알림"
                value={sentenceEnabled}
                onValueChange={onToggleSentence}
                trackColor={{ false: '#CFC5B7', true: '#20C967' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {dailySentences.length > 0 ? (
          <View className="mx-5 mb-5 rounded-2xl border border-[#E9DDCE] bg-white px-5 py-4">
            <View className="flex-row items-center justify-between">
              <AppText className="text-sm font-black text-[#231A0E]">오늘 받을 문장</AppText>
              <AppText className="text-xs font-bold text-[#914523]">{sentenceTime}</AppText>
            </View>
            <AppText className="mt-1 text-xs text-[#8A7D6D]">{translateTemplate('{time} 알림에서 문장 {count}개를 복습해보세요.', { time: sentenceTime, count: Math.min(sentenceCount, dailySentences.length) })}</AppText>
            <View className="mt-3 gap-2">
              {dailySentences.slice(0, sentenceCount).map((sentence, index) => (
                <View key={sentence.id} className="flex-row items-start gap-2">
                  <AppText className="text-xs font-black text-[#914523]">{index + 1}</AppText>
                  <View className="min-w-0 flex-1">
                    <AppText numberOfLines={1} className="text-sm font-bold text-[#231A0E]">{sentence.phrase}</AppText>
                    <AppText numberOfLines={1} className="mt-0.5 text-xs text-[#8A7D6D]">{sentence.translation}</AppText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="mx-5 mb-5 flex-row items-center justify-between rounded-2xl border border-[#E9DDCE] bg-white px-3 py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 달"
            disabled={selectedMonthIndex <= 0}
            onPress={() => setSelectedMonth(monthOptions[selectedMonthIndex - 1].value)}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              selectedMonthIndex <= 0 ? 'opacity-30' : 'active:bg-[#F3EBDD]'
            }`}>
            <ChevronLeft size={22} color="#6B5843" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`월 선택, 현재 ${selectedMonthLabel}`}
            onPress={() => setShowMonthPicker(true)}
            className="flex-row items-center gap-2 rounded-xl bg-[#F3EBDD] px-5 py-3 active:opacity-70">
            <CalendarDays size={17} color="#914523" />
            <AppText className="text-sm font-black text-[#231A0E]">{selectedMonthLabel}</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 달"
            disabled={selectedMonthIndex >= monthOptions.length - 1}
            onPress={() => setSelectedMonth(monthOptions[selectedMonthIndex + 1].value)}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              selectedMonthIndex >= monthOptions.length - 1 ? 'opacity-30' : 'active:bg-[#F3EBDD]'
            }`}>
            <ChevronRight size={22} color="#6B5843" />
          </Pressable>
        </View>

        <View className="mx-5 mb-5 flex-row items-center rounded-xl border border-[#DED0BA] bg-white px-4 py-1">
          <Search size={18} color="#8A7D6D" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={translateText('영어 또는 번역으로 검색하세요')}
            placeholderTextColor="#A79786"
            className="min-w-0 flex-1 px-3 py-3 text-sm text-[#231A0E]"
            accessibilityLabel={translateText('문장 검색')}
          />
          {searchQuery ? <Pressable accessibilityRole="button" accessibilityLabel={translateText('검색어 지우기')} onPress={() => setSearchQuery('')} className="p-2 active:opacity-70"><X size={17} color="#8A7D6D" /></Pressable> : null}
        </View>

        {dailySentences.length > 0 ? (
          <View className="mx-5 mb-3 flex-row justify-end">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translateText(isEditing ? '완료' : '편집')}
              onPress={() => setIsEditing((current) => !current)}
              className="rounded-lg bg-[#F3EBDD] px-3 py-2 active:opacity-70">
              <AppText className="text-xs font-black text-[#914523]">{isEditing ? '완료' : '편집'}</AppText>
            </Pressable>
          </View>
        ) : null}

        {visibleSentences.length > 0 ? (
          <View className="mx-5 gap-3">
            {groupedSentences.map((group) => (
              <View key={group.date} className="rounded-2xl border border-[#E9DDCE] bg-white px-5 py-4">
                <AppText className="text-sm font-black text-[#914523]">{group.date}</AppText>
                <View className="mt-3 gap-4">
                  {group.items.map((item, index) => (
                    <View key={item.id} className={index > 0 ? 'border-t border-[#F0E7DB] pt-4' : ''}>
                      <View className="flex-row items-start gap-4">
                        <View className="min-w-0 flex-1">
                          <AppText className="text-base font-black leading-6 text-[#231A0E]">{item.sentence}</AppText>
                          <AppText className="mt-1 text-sm leading-5 text-[#8A7D6D]">{item.translation}</AppText>
                        </View>
                        <View className="gap-2">
                          <Pressable accessibilityRole="button" onPress={() => { const language = { ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ru: 'ru-RU', ar: 'ar-SA', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' }[item.languageCode] ?? 'en-US'; void Speech.stop().finally(async () => Speech.speak(item.sentence, { language, rate: getSpeechRate(), pitch: getSpeechPitch(), voice: await getSelectedSpeechVoice(language) })); }} className="min-w-[70px] flex-row items-center justify-center gap-1.5 rounded-xl border border-[#DED0BA] bg-[#F3EBDD] px-3 py-2.5 active:opacity-70"><Volume2 size={15} color="#6B5843" /><AppText className="text-xs font-black text-[#6B5843]">듣기</AppText></Pressable>
                          <Pressable accessibilityRole="button" accessibilityLabel={activeSentenceId === item.id ? '말하기 중지' : '문장 말하기'} onPress={() => void toggleSentenceSpeaking(item)} className={`min-w-[70px] flex-row items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 active:opacity-70 ${activeSentenceId === item.id ? 'bg-[#255F5A]' : 'bg-[#914523]'}`}><Mic size={15} color="#FFFFFF" /><AppText className="text-xs font-black text-white">{activeSentenceId === item.id ? '듣는 중' : '말하기'}</AppText></Pressable>
                          {isEditing ? <Pressable accessibilityRole="button" accessibilityLabel={translateText('삭제')} onPress={() => Alert.alert(translateText('오늘의 문장 삭제'), translateTemplate('{sentence} 문장을 삭제할까요?', { sentence: item.sentence }), [{ text: translateText('취소'), style: 'cancel' }, { text: translateText('삭제'), style: 'destructive', onPress: () => onRemoveSentence(item.id) }])} className="min-w-[70px] flex-row items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 py-2.5 active:opacity-70"><X size={15} color="#DC2626" /><AppText className="text-xs font-black text-red-600">삭제</AppText></Pressable> : null}
                        </View>
                      </View>
                      {spokenSentences[item.id] ? (() => {
                        const result = getSentenceMatch(item.sentence, spokenSentences[item.id]);
                        const wordFeedback = ['en', 'ja'].includes(item.languageCode)
                          ? getWordFeedback(item.sentence, spokenSentences[item.id], item.languageCode)
                          : null;
                        const colors = result.tone === 'success'
                          ? { box: 'border-[#B9E0D5] bg-[#F0F8F5]', label: 'text-[#187560]', body: 'text-[#36524C]' }
                          : result.tone === 'close'
                            ? { box: 'border-[#F0D39E] bg-[#FFFAED]', label: 'text-[#A35F13]', body: 'text-[#725432]' }
                            : { box: 'border-[#F1CACA] bg-[#FFF5F3]', label: 'text-[#B54B43]', body: 'text-[#754B46]' };
                        return (
                          <View className={`mt-3 rounded-xl border px-3 py-2.5 ${colors.box}`}>
                            <View className="flex-row items-center justify-between gap-3">
                              <AppText className={`text-[11px] font-black ${colors.label}`}>{result.label}</AppText>
                              <AppText className={`text-[11px] font-black ${colors.label}`}>일치도 {result.score}%</AppText>
                            </View>
                            <AppText className={`mt-1 text-xs leading-5 ${colors.body}`}>{result.description}</AppText>
                            <AppText className={`mt-2 text-[11px] font-black ${colors.label}`}>내가 말한 문장</AppText>
                            {wordFeedback ? (
                              <View className="mt-1 flex-row flex-wrap gap-x-1.5 gap-y-1">
                                {wordFeedback.spoken.map((token, tokenIndex) => token.correct ? (
                                  <AppText key={`${token.text}-${tokenIndex}`} className={`text-sm leading-5 ${colors.body}`}>{token.text}</AppText>
                                ) : (
                                  <Pressable key={`${token.text}-${tokenIndex}`} accessibilityRole="button" accessibilityLabel={`${token.expected} 다시 듣기`} onPress={() => replayPracticeWord(token.expected, item.languageCode)} className="rounded-md bg-red-100 px-1.5 py-0.5 active:opacity-70">
                                    <AppText className="text-sm font-black text-red-600">{token.text}</AppText>
                                  </Pressable>
                                ))}
                              </View>
                            ) : <AppText className={`mt-1 text-sm leading-5 ${colors.body}`}>{spokenSentences[item.id]}</AppText>}
                            {wordFeedback && (wordFeedback.spoken.some((token) => !token.correct) || wordFeedback.missing.length > 0) ? (
                              <View className="mt-3 border-t border-black/5 pt-2">
                                <AppText className={`text-[11px] font-black ${colors.label}`}>빨간 단어를 누르면 정답 발음을 다시 들을 수 있어요.</AppText>
                                {wordFeedback.missing.length > 0 ? (
                                  <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
                                    <AppText className={`text-xs font-bold ${colors.body}`}>빠진 단어</AppText>
                                    {wordFeedback.missing.map((token, tokenIndex) => (
                                      <Pressable key={`${token.text}-${tokenIndex}`} accessibilityRole="button" accessibilityLabel={`${token.text} 다시 듣기`} onPress={() => replayPracticeWord(token.text, item.languageCode)} className="rounded-md bg-red-100 px-2 py-1 active:opacity-70"><AppText className="text-xs font-black text-red-600">{token.text}</AppText></Pressable>
                                    ))}
                                  </View>
                                ) : null}
                              </View>
                            ) : null}
                          </View>
                        );
                      })() : null}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="mx-5 items-center rounded-2xl border border-[#E9DDCE] bg-white px-8 py-12">
            <CalendarDays size={32} color="#C7B9A7" />
            <AppText className="mt-3 text-sm font-black text-[#231A0E]">
              {searchQuery.trim() ? '검색 결과가 없습니다.' : '이 달에 보낸 문장이 없습니다.'}
            </AppText>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}>
        <View className="flex-1 items-center justify-center px-6" >
          <View className="w-full max-w-[420px] rounded-3xl bg-[#FBF5E9] p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <AppText className="text-xl font-black text-[#231A0E]">월 선택</AppText>
              <RoundButton onPress={() => setShowMonthPicker(false)}>
                <X size={16} color={COLORS.muted} />
              </RoundButton>
            </View>
            <View className="gap-2">
              {monthOptions.map((month) => {
                const selected = month.value === selectedMonth;
                return (
                  <Pressable
                    key={month.value}
                    onPress={() => {
                      setSelectedMonth(month.value);
                      setShowMonthPicker(false);
                    }}
                    className={`flex-row items-center justify-between rounded-xl border px-4 py-4 ${
                      selected
                        ? 'border-[#914523] bg-[#F2E4D5]'
                        : 'border-[#E2D7C7] bg-white'
                    }`}>
                    <AppText className="text-sm font-black text-[#231A0E]">{month.label}</AppText>
                    {selected ? <Check size={18} color="#914523" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

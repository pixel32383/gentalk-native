import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Keyboard, KeyboardAvoidingView, Modal, Pressable, ScrollView, View } from 'react-native';
import * as Speech from 'expo-speech';
import { Check, ChevronRight, Volume2, VolumeX, X } from 'lucide-react-native';
import { COLORS } from '@/data/constants';
import { LANGUAGES } from '@/data/languages';
import { AppText } from '@/components/gentalk/AppText';
import { translateTemplate } from '@/data/translations';
import { MatchingCard } from '@/components/gentalk/MatchingCard';
import { RoundButton } from '@/components/gentalk/RoundButton';
import { generateConversationFeedback, sendConversationMessage } from '@/services/learning-api';
import { getSelectedSpeechVoice, getSpeechPitch, getSpeechRate } from '@/services/voice-settings';
import type { ConversationMessage, LearningFeedback } from '@/types/feedback';
import type { LearningProgress, Scenario, VocabItem } from '@/types/learning';
import { FeedbackStep } from './FeedbackStep';
import { MatchingGameStep } from './MatchingGameStep';
import { TimelineStep } from './TimelineStep';
import { VocabularyStep } from './VocabularyStep';
import { ConversationStep } from './ConversationStep';

function getLanguage(code: string) { return LANGUAGES.find((language) => language.code === code); }

// 이전 버전에서 API 오류를 감추기 위해 저장되던 짧은 기본 문구입니다.
// 실제 분석 결과가 아니므로 이어서 학습할 때 다시 AI 피드백을 생성합니다.
function isLegacyFallbackFeedback(value: LearningFeedback | undefined) {
  return value?.suggestions?.[0] === '대화 내용을 바탕으로 다시 한 번 자연스러운 표현을 연습해보세요.';
}

export function LearningFlowScreen({
  scenario,
  onBack,
  onHome,
  onComplete,
  onSaveAndExit,
  onDiscardAndExit,
  onAutoSave,
  savedProgress,
  initialStage = 0,
  wordGameOnly = false,
  nativeLanguage,
  previousFeedback,
}: {
  scenario: Scenario;
  onBack: () => void;
  onHome: () => void;
  onComplete: (scenario: Scenario) => void;
  onSaveAndExit: (progress: LearningProgress) => void;
  onDiscardAndExit: () => void;
  onAutoSave: (progress: LearningProgress) => void;
  savedProgress?: LearningProgress | null;
  initialStage?: number;
  wordGameOnly?: boolean;
  nativeLanguage: 'en' | 'ko' | 'ja';
  previousFeedback: LearningFeedback[];
}) {
  const [stage, setStage] = useState(savedProgress?.stage ?? initialStage);
  const [selectedWords, setSelectedWords] = useState<string[]>(() => savedProgress?.selectedWords ?? (initialStage === 1 ? scenario.vocabulary.map((item) => item.word) : []));
  const [wordSpeechEnabled, setWordSpeechEnabled] = useState(true);
  const wordSpeechRequestRef = useRef(0);
  const [matched, setMatched] = useState<string[]>(() => savedProgress?.matchedWords ?? []);
  const [shuffledTranslations, setShuffledTranslations] = useState<VocabItem[]>([]);
  const [selectedPairWord, setSelectedPairWord] = useState<string | null>(null);
  const [selectedPairSide, setSelectedPairSide] = useState<'word' | 'translation' | null>(null);
  const [matchingPage, setMatchingPage] = useState(savedProgress?.matchingPage ?? 0);
  const [wrongPair, setWrongPair] = useState<{ word: string; translationWord: string } | null>(null);
  const [message, setMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [hasConversationError, setHasConversationError] = useState(false);
  const [conversationCompleted, setConversationCompleted] = useState(savedProgress?.conversationCompleted ?? false);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [visibleStaffDetails, setVisibleStaffDetails] = useState<Record<number, 'translation' | 'example' | undefined>>({});
  const [needsConversationHint, setNeedsConversationHint] = useState(false);
  const [irrelevantCount, setIrrelevantCount] = useState(0);
  const [conversationHint, setConversationHint] = useState('');
  const [exampleReply, setExampleReply] = useState('');
  const [showConversationHint, setShowConversationHint] = useState(false);
  const [showExampleReply, setShowExampleReply] = useState(false);
  const [feedback, setFeedback] = useState<LearningFeedback | null>(
    savedProgress?.feedback && !isLegacyFallbackFeedback(savedProgress.feedback) ? savedProgress.feedback : null,
  );
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackRetryCount, setFeedbackRetryCount] = useState(0);
  const [messages, setMessages] = useState<ConversationMessage[]>(() => savedProgress?.messages ?? [
    { speaker: 'STAFF', text: scenario.dialogue[0]?.text ?? 'Hello! How can I help you?' },
  ]);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const hasRestoredConversation = Boolean(savedProgress && savedProgress.stage >= 2);
  const normalizeMessageForCorrection = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  const buildCompletedScenario = (): Scenario => {
    const phrases = [
      ...(feedback?.recommendedReplies ?? []),
      ...(feedback?.reusableSentence ? [feedback.reusableSentence] : []),
    ].filter((phrase, index, items) => items.findIndex((item) => item.phrase === phrase.phrase) === index);

    return {
      ...scenario,
      phrases,
      dialogue: messages.map((item) => {
        const correction = item.speaker === 'YOU'
          ? feedback?.messageCorrections?.find((candidate) =>
            normalizeMessageForCorrection(candidate.originalMessage) === normalizeMessageForCorrection(item.text))
          : undefined;
        return {
          speaker: item.speaker === 'STAFF' ? 'A' : 'B',
          role: item.speaker === 'STAFF' ? 'STAFF' : '나',
          text: item.text,
          translation: item.translation ?? '',
          correction,
        };
      }),
      learningFeedback: feedback ?? undefined,
      completedAt: new Date().toISOString(),
    };
  };
  const buildProgress = (): LearningProgress => ({
    id: scenario.id,
    scenario,
    stage,
    selectedWords,
    matchedWords: matched,
    matchingPage,
    messages,
    feedback: feedback ?? undefined,
    conversationCompleted,
    updatedAt: new Date().toISOString(),
  });
  const progressRef = useRef<LearningProgress | null>(null);
  const autoSaveRef = useRef(onAutoSave);
  const hasStartedAutoSave = useRef(false);
  // 부모의 자동 저장으로 화면이 다시 그려져도 같은 대화의 피드백 요청은 한 번만 보냅니다.
  // 그렇지 않으면 결과를 받은 직후 로딩 상태로 다시 돌아가는 깜빡임이 생길 수 있습니다.
  const requestedFeedbackKeyRef = useRef<string | null>(null);
  const feedbackRequestVersionRef = useRef(0);
  const isMountedRef = useRef(true);
  const learningScrollRef = useRef<ScrollView>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  autoSaveRef.current = onAutoSave;
  const words = scenario.vocabulary;
  const pairWords = words.filter((item) => selectedWords.includes(item.word));
  const matchingPageSize = 6;
  const matchingPageCount = Math.max(1, Math.ceil(pairWords.length / matchingPageSize));
  const currentPairWords = pairWords.slice(
    matchingPage * matchingPageSize,
    (matchingPage + 1) * matchingPageSize,
  );

  const revealLatestConversation = () => {
    // Wait for the keyboard resize before showing the latest Staff message above it.
    setTimeout(() => learningScrollRef.current?.scrollToEnd({ animated: true }), 180);
  };

  useEffect(() => {
    progressRef.current = buildProgress();
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      if (stage !== 2) return;
      if (process.env.EXPO_OS === 'android') {
        setKeyboardInset(event.endCoordinates.height);
      }
      requestAnimationFrame(() => learningScrollRef.current?.scrollToEnd({ animated: true }));
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardInset(0);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== 2) return;
    // Move with the user's message, Staff's typing indicator, and the completed reply.
    const timer = setTimeout(() => learningScrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [isSendingMessage, messages.length, stage]);

  useEffect(() => {
    if (wordGameOnly) return;
    if (!hasStartedAutoSave.current) {
      hasStartedAutoSave.current = true;
      return;
    }
    const timer = setTimeout(() => autoSaveRef.current(buildProgress()), 800);
    return () => clearTimeout(timer);
  }, [feedback, matched, matchingPage, messages, selectedWords, stage, wordGameOnly]);

  useEffect(() => {
    if (wordGameOnly) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'inactive' || nextState === 'background') {
        const progress = progressRef.current;
        if (progress) autoSaveRef.current(progress);
      }
    });
    return () => subscription.remove();
  }, [wordGameOnly]);

  useEffect(() => {
    if (process.env.EXPO_OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (wordGameOnly) {
        onBack();
        return true;
      }

      setShowExitPrompt(true);
      return true;
    });

    return () => subscription.remove();
  }, [onBack, wordGameOnly]);
  const conversationWords = words.map((item) => item.word);
  const feedbackRequestKey = JSON.stringify({
    scenarioId: scenario.id,
    nativeLanguage,
    messages: messages.map((item) => [item.speaker, item.text]),
    previousFeedback: previousFeedback.slice(0, 5).map((item) => ({
      suggestions: item.suggestions,
      improvements: item.improvements,
      nextPracticeGoal: item.nextPracticeGoal,
      recurringWeakness: item.recurringWeakness,
    })),
  });
  const title = ['학습할 단어', '짝맞추기 게임', 'AI 회화 학습', '학습 피드백', '대화 타임라인'][stage];
  const subtitle = [
    translateTemplate('총 {count}개의 단어를 학습합니다', { count: words.length }),
    '단어와 뜻을 연결해보세요.',
    'AI와 실제 대화를 연습하세요.',
    '회화 학습 결과를 확인하세요.',
    '학습한 대화 내용을 복습하세요.',
  ][stage];
  const toggleWord = (word: string) => {
    const wasSelected = selectedWords.includes(word);
    setSelectedWords((current) => current.includes(word) ? current.filter((item) => item !== word) : [...current, word]);
    if (wasSelected) {
      wordSpeechRequestRef.current += 1;
      void Speech.stop().catch(() => {});
      return;
    }
    if (!wordSpeechEnabled) return;

    const requestId = ++wordSpeechRequestRef.current;
    const speechLanguage = { ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ru: 'ru-RU', ar: 'ar-SA', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' }[scenario.langCode] ?? 'en-US';
    void Speech.stop().then(async () => {
      const voice = await getSelectedSpeechVoice(speechLanguage);
      if (wordSpeechRequestRef.current !== requestId) return;
      Speech.speak(word, { language: speechLanguage, rate: getSpeechRate(), pitch: getSpeechPitch(), voice });
    }).catch(() => {});
  };
  const selectEnglishWord = (word: string) => {
    if (wrongPair || matched.includes(word)) return;
    if (selectedPairWord && selectedPairSide === 'translation') {
      if (selectedPairWord === word) {
        setMatched((current) => [...current, word]);
        setSelectedPairWord(null);
        setSelectedPairSide(null);
        return;
      }
      setWrongPair({ word, translationWord: selectedPairWord });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedPairWord(null);
        setSelectedPairSide(null);
      }, 260);
      return;
    }
    setSelectedPairWord(word);
    setSelectedPairSide('word');
  };
  const selectTranslation = (item: VocabItem) => {
    if (wrongPair || matched.includes(item.word)) return;
    if (!selectedPairWord) {
      setSelectedPairWord(item.word);
      setSelectedPairSide('translation');
      return;
    }
    if (selectedPairWord === item.word) {
      setMatched((current) => [...current, item.word]);
      setSelectedPairWord(null);
      setSelectedPairSide(null);
      return;
    }
    setWrongPair({ word: selectedPairWord, translationWord: item.word });
    setTimeout(() => {
      setWrongPair(null);
      setSelectedPairWord(null);
      setSelectedPairSide(null);
    }, 260);
  };
  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSendingMessage) return;
    const nextMessages = [...messages, { speaker: 'YOU' as const, text: trimmed }];
    setMessages(nextMessages);
    setMessage('');
    setHasConversationError(false);
    setIsSendingMessage(true);
    try {
      const data = await sendConversationMessage({
        situation: scenario.situation,
        learningLanguage: scenario.langCode,
        nativeLanguage,
        vocabulary: conversationWords,
        staffRole: scenario.situation.includes('카페') ? 'barista' : scenario.situation.includes('호텔') ? 'hotel receptionist' : 'service staff',
        conversationGoal: scenario.title,
        messages: nextMessages,
      });
      setMessages((current) => [
        ...current.map((item, index) => index === nextMessages.length - 1
          ? { ...item, translation: data.userTranslation ?? item.translation }
          : item),
        { speaker: 'STAFF', text: data.staffMessage, translation: data.translation, exampleReply: data.exampleReply, examplePronunciation: data.examplePronunciation },
      ]);
      setConversationCompleted(data.isComplete === true);
      setCompletionDismissed(false);
      setNeedsConversationHint(data.isRelevant === false);
      setIrrelevantCount((current) => data.isRelevant === false ? current + 1 : 0);
      setConversationHint(data.hint ?? '직원의 마지막 질문에 맞춰 답해보세요.');
      setExampleReply(data.exampleReply ?? '');
    } catch (error) {
      setMessages((current) => current.slice(0, -1));
      setMessage(trimmed);
      setHasConversationError(true);
    } finally {
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    if (stage !== 1) return;
    const shuffled = [...currentPairWords];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    setShuffledTranslations(shuffled);
    setMatched([]);
    setSelectedPairWord(null);
    setSelectedPairSide(null);
    setWrongPair(null);
  }, [matchingPage, stage]);

  useEffect(() => {
    if (stage !== 2 || hasRestoredConversation) return;
    const wordGuide = conversationWords.length > 0 ? conversationWords.join(', ') : 'the useful words from this lesson';
    const staffGreeting = scenario.openingStaffMessage ?? `Let's practice ${scenario.title}. Try using: ${wordGuide}.`;
    setMessages([{
      speaker: 'STAFF',
      text: staffGreeting,
      translation: scenario.openingTranslation,
      exampleReply: scenario.openingExampleReply,
      examplePronunciation: scenario.openingExamplePronunciation,
    }]);
    setConversationCompleted(false);
    setCompletionDismissed(false);
    setVisibleStaffDetails({});
    setNeedsConversationHint(false);
    setIrrelevantCount(0);
    setShowConversationHint(false);
    setShowExampleReply(false);
  }, [hasRestoredConversation, scenario.id, stage]);

  useEffect(() => {
    if (stage !== 3) return;
    if (savedProgress?.feedback && !isLegacyFallbackFeedback(savedProgress.feedback)) {
      feedbackRequestVersionRef.current += 1;
      setFeedback(savedProgress.feedback);
      setIsLoadingFeedback(false);
      setFeedbackError(null);
      return;
    }

    // 같은 대화 내용으로 요청을 다시 보내지 않습니다. 자동 저장으로 부모가 다시 렌더링되어도
    // 결과 화면이 "대화 내용을 분석하고 있어요" 화면으로 되돌아가지 않게 합니다.
    if (requestedFeedbackKeyRef.current === feedbackRequestKey) return;

    const requestVersion = feedbackRequestVersionRef.current + 1;
    feedbackRequestVersionRef.current = requestVersion;
    requestedFeedbackKeyRef.current = feedbackRequestKey;
    setIsLoadingFeedback(true);
    setFeedback(null);
    setFeedbackError(null);
    void generateConversationFeedback({
      situation: scenario.situation,
      learningLanguage: scenario.langCode,
      nativeLanguage: nativeLanguage,
      messages,
      // 반복 약점 판단에는 최근 기록 두 개면 충분합니다. 이전 피드백 전체를 보내지 않아 생성 대기 시간을 줄입니다.
      previousFeedback: previousFeedback.slice(0, 2).map((item) => ({
        suggestions: item.suggestions,
        improvements: item.improvements,
        nextPracticeGoal: item.nextPracticeGoal,
        recurringWeakness: item.recurringWeakness,
      })),
    })
      .then((data) => {
        if (isMountedRef.current && feedbackRequestVersionRef.current === requestVersion) setFeedback(data);
      })
      .catch((error: unknown) => {
        if (!isMountedRef.current || feedbackRequestVersionRef.current !== requestVersion) return;
        const message = error instanceof Error ? error.message : '네트워크 상태를 확인한 뒤 다시 시도해주세요.';
        setFeedbackError(message);
      })
      .finally(() => {
        if (isMountedRef.current && feedbackRequestVersionRef.current === requestVersion) setIsLoadingFeedback(false);
      });
  }, [feedbackRequestKey, feedbackRetryCount, stage]);

  return (
    <>
    <KeyboardAvoidingView
      className="flex-1"
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
    <View className="flex-1">
      <View className="shrink-0 flex-row items-center gap-3 border-b border-[#E9DDCE] px-4 py-4">
        <RoundButton onPress={() => wordGameOnly ? onBack() : setShowExitPrompt(true)}>
          <X size={17} color={COLORS.foreground} />
        </RoundButton>
        <View className="min-w-0 flex-1">
          <AppText className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[#C77932]">{getLanguage(scenario.langCode)?.label}</AppText>
          <AppText className="text-base font-black text-[#231A0E]">{scenario.situation}</AppText>
        </View>
        <AppText className="font-mono text-xs font-bold text-[#914523]">{stage + 1}/5</AppText>
      </View>
      <View className="mx-4 h-1.5 rounded-full bg-[#E5D7BF]"><View className="h-1.5 rounded-full bg-[#914523]" style={{ width: `${((stage + 1) / 5) * 100}%` }} /></View>
      <ScrollView
        ref={learningScrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 + keyboardInset, gap: 14 }}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <AppText className="text-xl font-black text-[#231A0E]">{title}</AppText>
            <AppText className="mt-1 text-sm text-[#8A7D6D]">{subtitle}</AppText>
            {stage === 1 ? <AppText className="mt-1 text-xs font-bold text-[#914523]">{translateTemplate('게임 {current} / {total}', { current: matchingPage + 1, total: matchingPageCount })}</AppText> : null}
            {stage === 0 ? <AppText className="mt-1 text-sm font-bold text-[#6B5843]">아래에 모르거나 헷갈리는 단어를 선택해주세요.</AppText> : null}
          </View>
          {stage === 0 ? (
            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={wordSpeechEnabled ? '단어 터치 시 발음 켜짐' : '단어 터치 시 발음 꺼짐'}
                accessibilityState={{ selected: wordSpeechEnabled }}
                hitSlop={4}
                onPress={() => {
                  if (wordSpeechEnabled) {
                    wordSpeechRequestRef.current += 1;
                    void Speech.stop().catch(() => {});
                  }
                  setWordSpeechEnabled(!wordSpeechEnabled);
                }}
                className={`h-10 w-10 items-center justify-center rounded-xl border active:opacity-70 ${wordSpeechEnabled ? 'border-[#914523] bg-[#914523]' : 'border-[#D8CAB5] bg-white'}`}>
                {wordSpeechEnabled ? <Volume2 size={18} color="#FFFFFF" /> : <VolumeX size={18} color="#914523" />}
              </Pressable>
              <Pressable
                onPress={() => setSelectedWords((current) => current.length === words.length ? [] : words.map((item) => item.word))}
                className="rounded-lg border border-[#D8CAB5] bg-white px-3 py-2 active:opacity-70">
                <AppText className="text-xs font-black text-[#914523]">{selectedWords.length === words.length ? '선택 해제' : '전체선택'}</AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
        {stage === 0 ? (
          <VocabularyStep
            words={words}
            selectedWords={selectedWords}
            onToggleWord={toggleWord}
            onSkip={() => {
              setSelectedWords([]);
              setStage(2);
            }}
          />
        ) : null}
        {stage === 1 ? (
          <MatchingGameStep
            words={currentPairWords}
            translations={shuffledTranslations}
            matchedWords={matched}
            selectedWord={selectedPairWord}
            selectedSide={selectedPairSide}
            wrongPair={wrongPair}
            onSelectWord={selectEnglishWord}
            onSelectTranslation={selectTranslation}
          />
        ) : null}
        {stage === 2 && (
          <ConversationStep
            words={conversationWords}
            messages={messages}
            visibleStaffDetails={visibleStaffDetails}
            onToggleStaffDetail={(index, detail) => setVisibleStaffDetails((current) => ({ ...current, [index]: current[index] === detail ? undefined : detail }))}
            needsHint={needsConversationHint}
            irrelevantCount={irrelevantCount}
            showHint={showConversationHint}
            showExampleReply={showExampleReply}
            hint={conversationHint}
            exampleReply={exampleReply}
            onToggleHint={() => setShowConversationHint((value) => !value)}
            onToggleExampleReply={() => setShowExampleReply((value) => !value)}
            isCompleted={conversationCompleted && !completionDismissed}
            message={message}
            isSending={isSendingMessage}
            learningLanguage={scenario.langCode}
            onChangeMessage={setMessage}
            onFocusMessageInput={revealLatestConversation}
            onSend={() => void sendMessage()}
            hasConversationError={hasConversationError}
            onRetryConversation={() => void sendMessage()}
            onDismissConversationError={() => setHasConversationError(false)}
          />
        )}
        {stage === 3 && (
          <FeedbackStep
            feedback={feedback}
            isLoading={isLoadingFeedback}
            errorMessage={feedbackError}
            onRetry={() => {
              requestedFeedbackKeyRef.current = null;
              setFeedbackRetryCount((current) => current + 1);
            }}
          />
        )}
        {stage === 4 && <TimelineStep messages={messages} />}
      </ScrollView>

      {stage === 2 && conversationCompleted && !completionDismissed ? (
        <Pressable
          onPress={() => {
            setCompletionDismissed(true);
            setConversationCompleted(false);
          }}
          className="mx-4 mb-3 items-center rounded-xl border border-emerald-300 bg-white py-2.5 active:opacity-80">
          <AppText className="text-xs font-black text-emerald-800">아직 대화가 남았습니다</AppText>
        </Pressable>
      ) : null}
      <View className="flex-row gap-2 border-t border-[#E9DDCE] p-4">
        <Pressable
          disabled={stage === 0}
          onPress={() => {
            if (stage === 1 && matchingPage > 0) {
              setMatchingPage((current) => current - 1);
              return;
            }
            setStage((current) => Math.max(0, current - 1));
          }}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-[#E9DDCE] bg-white py-3 ${stage === 0 ? 'opacity-40' : 'active:opacity-80'}`}>
          <AppText className="font-bold text-[#231A0E]">이전</AppText>
        </Pressable>
        <Pressable
          disabled={(stage === 0 && selectedWords.length === 0) || (stage === 1 && matched.length !== currentPairWords.length)}
          onPress={() => {
            if (stage === 0) {
              setMatchingPage(0);
            }
            if (stage === 1 && matchingPage < matchingPageCount - 1) {
              setMatchingPage((current) => current + 1);
              return;
            }
            if (wordGameOnly && stage === 1) {
              onHome();
              return;
            }
            if (stage === 4) {
              onComplete(buildCompletedScenario());
              onHome();
              return;
            }
            setStage((current) => current + 1);
          }}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-[#255F5A] py-3 active:opacity-80 ${(stage === 0 && selectedWords.length === 0) || (stage === 1 && matched.length !== currentPairWords.length) ? 'opacity-40' : ''}`}>
          {stage === 4 || (wordGameOnly && stage === 1) ? <Check size={16} color="#FFFFFF" /> : <ChevronRight size={16} color="#FFFFFF" />}
          <AppText className="font-bold text-white">{stage === 4 || (wordGameOnly && stage === 1) ? '완료' : '다음'}</AppText>
        </Pressable>
      </View>
    </View>
    </KeyboardAvoidingView>
    <Modal visible={showExitPrompt} transparent animationType="fade" onRequestClose={() => setShowExitPrompt(false)}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full rounded-2xl border border-[#D8CAB5] bg-white p-5">
          <AppText className="text-xl font-black text-[#231A0E]">학습을 저장하시겠습니까?</AppText>
          <AppText className="mt-2 text-sm leading-6 text-[#8A7D6D]">현재 단계와 대화 내용을 저장하면 홈에서 이어서 학습할 수 있어요.</AppText>
          <Pressable onPress={() => { onSaveAndExit(buildProgress()); setShowExitPrompt(false); }} className="mt-5 items-center rounded-xl bg-[#255F5A] py-3 active:opacity-80"><AppText className="font-black text-white">저장 후 나가기</AppText></Pressable>
          <Pressable onPress={() => { onDiscardAndExit(); setShowExitPrompt(false); }} className="mt-2 items-center rounded-xl border border-[#E9DDCE] py-3 active:opacity-80"><AppText className="font-black text-[#914523]">저장 안 함</AppText></Pressable>
          <Pressable onPress={() => setShowExitPrompt(false)} className="mt-2 items-center py-2 active:opacity-80"><AppText className="text-sm font-bold text-[#8A7D6D]">계속 학습</AppText></Pressable>
        </View>
      </View>
    </Modal>
    </>
  );
}

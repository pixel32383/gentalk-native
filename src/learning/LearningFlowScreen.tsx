import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Modal, Pressable, ScrollView, View } from 'react-native';
import { Check, ChevronRight, X } from 'lucide-react-native';
import { COLORS } from '@/data/constants';
import { LANGUAGES } from '@/data/languages';
import { AppText } from '@/components/gentalk/AppText';
import { translateTemplate } from '@/data/translations';
import { MatchingCard } from '@/components/gentalk/MatchingCard';
import { RoundButton } from '@/components/gentalk/RoundButton';
import { generateConversationFeedback, sendConversationMessage } from '@/services/learning-api';
import type { ConversationMessage, LearningFeedback } from '@/types/feedback';
import type { LearningProgress, Scenario, VocabItem } from '@/types/learning';
import { FeedbackStep } from './FeedbackStep';
import { MatchingGameStep } from './MatchingGameStep';
import { TimelineStep } from './TimelineStep';
import { VocabularyStep } from './VocabularyStep';
import { ConversationStep } from './ConversationStep';

function getLanguage(code: string) { return LANGUAGES.find((language) => language.code === code); }

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
}) {
  const [stage, setStage] = useState(savedProgress?.stage ?? initialStage);
  const [selectedWords, setSelectedWords] = useState<string[]>(() => savedProgress?.selectedWords ?? (initialStage === 1 ? scenario.vocabulary.map((item) => item.word) : []));
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
  const [feedback, setFeedback] = useState<LearningFeedback | null>(savedProgress?.feedback ?? null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>(() => savedProgress?.messages ?? [
    { speaker: 'STAFF', text: scenario.dialogue[0]?.text ?? 'Hello! How can I help you?' },
  ]);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const hasRestoredConversation = Boolean(savedProgress && savedProgress.stage >= 2);
  const buildCompletedScenario = (): Scenario => {
    return {
      ...scenario,
      phrases: feedback?.recommendedReplies ?? [],
      dialogue: messages.map((item) => ({
        speaker: item.speaker === 'STAFF' ? 'A' : 'B',
        role: item.speaker === 'STAFF' ? 'STAFF' : '나',
        text: item.text,
        translation: item.translation ?? item.text,
        correction: item.speaker === 'YOU'
          ? feedback?.messageCorrections?.find((correction) => correction.originalMessage.trim() === item.text.trim())
          : undefined,
      })),
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
  autoSaveRef.current = onAutoSave;
  const words = scenario.vocabulary;
  const pairWords = words.filter((item) => selectedWords.includes(item.word));
  const matchingPageSize = 6;
  const matchingPageCount = Math.max(1, Math.ceil(pairWords.length / matchingPageSize));
  const currentPairWords = pairWords.slice(
    matchingPage * matchingPageSize,
    (matchingPage + 1) * matchingPageSize,
  );

  useEffect(() => {
    progressRef.current = buildProgress();
  });

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
  const title = ['학습할 단어', '짝맞추기 게임', 'AI 회화 학습', '학습 피드백', '대화 타임라인'][stage];
  const subtitle = [
    translateTemplate('총 {count}개의 단어를 학습합니다', { count: words.length }),
    '단어와 뜻을 연결해보세요.',
    'AI와 실제 대화를 연습하세요.',
    '회화 학습 결과를 확인하세요.',
    '학습한 대화 내용을 복습하세요.',
  ][stage];
  const toggleWord = (word: string) => {
    setSelectedWords((current) => current.includes(word) ? current.filter((item) => item !== word) : [...current, word]);
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
    if (savedProgress?.feedback) {
      setFeedback(savedProgress.feedback);
      setIsLoadingFeedback(false);
      return;
    }
    let active = true;
    setIsLoadingFeedback(true);
    setFeedback(null);
    void generateConversationFeedback({
      situation: scenario.situation,
      learningLanguage: scenario.langCode,
      nativeLanguage: nativeLanguage,
      messages,
    })
      .then((data) => { if (active) setFeedback(data); })
      .catch(() => {
        if (active) setFeedback({
          suggestions: ['대화 내용을 바탕으로 다시 한 번 자연스러운 표현을 연습해보세요.', '문장을 조금 더 구체적으로 만들어보세요.', '핵심 단어를 넣어 다시 말해보세요.'],
          strengths: ['대화에 적극적으로 참여했습니다.', '상황에 맞는 표현을 사용했습니다.'],
          improvements: ['문장을 조금 더 구체적으로 만들어보세요.', '핵심 단어를 넣어 다시 말해보세요.'],
        });
      })
      .finally(() => { if (active) setIsLoadingFeedback(false); });
    return () => { active = false; };
  }, [scenario.id, stage]);

  return (
    <>
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
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <AppText className="text-xl font-black text-[#231A0E]">{title}</AppText>
            <AppText className="mt-1 text-sm text-[#8A7D6D]">{subtitle}</AppText>
            {stage === 1 ? <AppText className="mt-1 text-xs font-bold text-[#914523]">{translateTemplate('게임 {current} / {total}', { current: matchingPage + 1, total: matchingPageCount })}</AppText> : null}
            {stage === 0 ? <AppText className="mt-1 text-sm font-bold text-[#6B5843]">아래에 모르거나 헷갈리는 단어를 선택해주세요.</AppText> : null}
          </View>
          {stage === 0 ? (
            <Pressable
              onPress={() => setSelectedWords((current) => current.length === words.length ? [] : words.map((item) => item.word))}
              className="rounded-lg border border-[#D8CAB5] bg-white px-3 py-2 active:opacity-70">
              <AppText className="text-xs font-black text-[#914523]">{selectedWords.length === words.length ? '선택 해제' : '전체선택'}</AppText>
            </Pressable>
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
            onSend={() => void sendMessage()}
            hasConversationError={hasConversationError}
            onRetryConversation={() => void sendMessage()}
            onDismissConversationError={() => setHasConversationError(false)}
          />
        )}
        {stage === 3 && <FeedbackStep feedback={feedback} isLoading={isLoadingFeedback} />}
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
    <Modal visible={showExitPrompt} transparent animationType="fade" onRequestClose={() => setShowExitPrompt(false)}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full rounded-2xl bg-white p-5">
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

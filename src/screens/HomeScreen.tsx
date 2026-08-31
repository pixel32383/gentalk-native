import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { BookOpen, ChevronRight, Globe, Phone, Search, X } from 'lucide-react-native';
import { AppHeader } from '@/components/gentalk/AppHeader';
import { AppText } from '@/components/gentalk/AppText';
import { ScenarioCard } from '@/components/gentalk/ScenarioCard';
import { OperationErrorNotice } from '@/components/gentalk/OperationErrorNotice';
import { LANGUAGES } from '@/data/languages';
import { SCENARIOS } from '@/data/scenarios';
import { COLORS } from '@/data/constants';
import { formatScenarioCount, formatWordCount, translateText, useDisplayLanguage } from '@/data/translations';
import type { LearningProgress, PhraseItem, Scenario } from '@/types/learning';

export function HomeScreen({
  savedIds,
  learningLang,
  wordCount,
  todaySentence,
  inProgressLearning,
  profileName,
  profileImageUri,
  onScenario,
  onToggleSave,
  onOpenLangSettings,
  onOpenWordCount,
  onOpenTodaySentence,
  onOpenProfile,
  onStartLearning,
  isStartingLearning,
  hasGenerationError,
  onCancelGeneration,
  onRetryGeneration,
  onDismissGenerationError,
  onResumeLearning,
  onRemoveInProgressLearning,
}: {
  savedIds: string[];
  learningLang: string;
  wordCount: number;
  todaySentence?: PhraseItem;
  inProgressLearning: LearningProgress[];
  profileName: string;
  profileImageUri: string | null;
  onScenario: (scenario: Scenario) => void;
  onToggleSave: (id: string) => void;
  onOpenLangSettings: () => void;
  onOpenWordCount: () => void;
  onOpenTodaySentence: () => void;
  onOpenProfile: () => void;
  onStartLearning: (situation: string, template?: Scenario) => Promise<void>;
  isStartingLearning: boolean;
  hasGenerationError: boolean;
  onCancelGeneration: () => void;
  onRetryGeneration: () => void;
  onDismissGenerationError: () => void;
  onResumeLearning: (progress: LearningProgress) => void;
  onRemoveInProgressLearning: (id: string) => void;
}) {
  useDisplayLanguage();
  const [search, setSearch] = useState('');
  const [showEmptySituationNotice, setShowEmptySituationNotice] = useState(false);
  const recommendedScenarios = SCENARIOS;
  const learningLanguage = LANGUAGES.find((item) => item.code === learningLang);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 136 }}>
      <AppHeader
        title="어떤 상황을 연습할까요?"
        subtitle="바로 쓰는 표현을 상황별로 연습합니다"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="프로필로 이동"
            onPress={onOpenProfile}
            className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#DED0BA] bg-[#255F5A] active:opacity-70">
            {profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                contentFit="cover"
                style={{ width: 48, height: 48 }}
              />
            ) : (
              <AppText className="text-lg font-black text-white">
                {profileName.trim().charAt(0).toUpperCase() || 'G'}
              </AppText>
            )}
          </Pressable>
        }
      />

      <View className="mx-5 rounded-2xl border border-[#DED0BA] bg-[#F3EBDD] px-4 py-4">
        <View className="flex-row items-center justify-between gap-2">
          <View className="rounded-full bg-[#8C3F1E] px-4 py-2">
            <View className="flex-row items-center gap-1">
              <AppText className="text-xs font-black text-white">{learningLanguage?.flag ?? '🌐'}</AppText>
              <AppText className="text-xs font-black text-white">{learningLanguage?.label ?? '언어'}</AppText>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={onOpenWordCount}
              className="flex-row items-center gap-1.5 rounded-full border border-[#DED0BA] bg-[#FBF6EC] px-3 py-2 active:opacity-80">
              <BookOpen size={14} color="#6B5843" />
              <AppText className="text-xs font-black text-[#4A3828]">{formatWordCount(wordCount)}</AppText>
            </Pressable>
            <Pressable
              onPress={onOpenLangSettings}
              className="flex-row items-center gap-1.5 rounded-full border border-[#DED0BA] bg-[#FBF6EC] px-3 py-2 active:opacity-80">
              <Globe size={14} color="#6B5843" />
              <AppText className="text-xs font-black text-[#4A3828]">언어변경</AppText>
            </Pressable>
          </View>
        </View>

        <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-[#DED0BA] bg-[#FBF6EC] px-3 py-3">
          <Search size={17} color="#8A7D6D" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={translateText('예) 호텔 체크인하는 상황')}
            placeholderTextColor="#7E6F5C"
            className="min-h-8 flex-1 text-sm text-[#231A0E]"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} className="h-7 w-7 items-center justify-center rounded-full">
              <X size={15} color="#8A7D6D" />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          disabled={isStartingLearning}
          onPress={() => {
            if (!search.trim()) {
              setShowEmptySituationNotice(true);
              return;
            }
            void onStartLearning(search);
          }}
          className={`mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-[#8C3F1E] px-4 py-3 active:opacity-80 ${isStartingLearning ? 'opacity-60' : ''}`}>
          <Search size={16} color="#FFFFFF" />
          <AppText className="text-sm font-black text-white">{isStartingLearning ? '단어를 생성하고 있어요...' : '상황 학습 시작'}</AppText>
        </Pressable>
        {isStartingLearning ? (
          <View className="mt-3 flex-row items-center justify-between rounded-xl border border-[#D9B37D] bg-[#FBF6EC] px-3 py-2.5">
            <AppText className="flex-1 pr-3 text-xs leading-5 text-[#6B5843]">AI가 학습 내용을 만들고 있어요. 잠시만 기다려주세요.</AppText>
            <Pressable onPress={onCancelGeneration} className="rounded-lg border border-[#D9B37D] px-3 py-1.5 active:opacity-70"><AppText className="text-xs font-black text-[#914523]">취소</AppText></Pressable>
          </View>
        ) : null}
        {hasGenerationError ? (
          <View className="mt-3"><OperationErrorNotice message="학습 내용을 만들지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요." onRetry={onRetryGeneration} onLater={onDismissGenerationError} /></View>
        ) : null}
      </View>

      {inProgressLearning.length > 0 ? (
        <View className="mt-6">
          <View className="mx-5 mb-3"><AppText className="text-lg font-black text-[#231A0E]">이어서 학습하기</AppText></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {inProgressLearning.map((progress) => {
              const language = LANGUAGES.find((item) => item.code === progress.scenario.langCode);
              const stageLabel = ['단어 학습', '짝맞추기 게임', 'AI 회화 학습', '학습 피드백', '대화 타임라인'][progress.stage] ?? '상황 학습';
              return <Pressable key={progress.id} onPress={() => onResumeLearning(progress)} className="w-64 rounded-2xl border border-[#D8CAB5] bg-[#F3EBDD] p-4 active:opacity-75"><View className="flex-row items-start justify-between gap-2"><View className="min-w-0 flex-1"><AppText numberOfLines={1} className="text-base font-black text-[#231A0E]">{progress.scenario.situation}</AppText><AppText className="mt-1 text-xs text-[#8A7D6D]">{language?.flag} {language?.label} · {stageLabel} {progress.stage + 1}/5</AppText></View><Pressable onPress={(event) => { event.stopPropagation(); onRemoveInProgressLearning(progress.id); }} accessibilityRole="button" accessibilityLabel="진행 중인 학습 삭제" className="h-7 w-7 items-center justify-center rounded-full bg-white active:opacity-70"><X size={14} color={COLORS.muted} /></Pressable></View><View className="mt-4 flex-row items-center justify-between"><AppText className="text-xs font-black text-[#255F5A]">계속하기</AppText><ChevronRight size={16} color={COLORS.primary} /></View></Pressable>;
            })}
          </ScrollView>
        </View>
      ) : null}

      <View className="mx-5 mb-3 mt-6">
        <AppText className="text-lg font-black text-[#231A0E]">오늘의 문장</AppText>
      </View>

      <View className="mx-5 rounded-2xl border border-[#DED0BA] bg-white px-5 py-5">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F2E8D9]">
            <Phone size={18} color={COLORS.accent} />
          </View>
          <View className="min-w-0 flex-1">
            <AppText className="text-base font-black leading-6 text-[#231A0E]">
              {todaySentence?.phrase ?? '학습한 문장이 아직 없습니다.'}
            </AppText>
            <AppText className="mt-1 text-sm leading-5 text-[#8A7D6D]">
              {todaySentence?.translation ?? '상황 학습을 완료하면 오늘의 문장이 표시됩니다.'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="오늘의 문장으로 이동"
            onPress={onOpenTodaySentence}
            className="flex-row items-center gap-1 rounded-xl bg-[#914523] px-3 py-2.5 active:opacity-70">
            <AppText className="text-xs font-black text-white">이동</AppText>
            <ChevronRight size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View className="mx-5 mt-6 mb-3 flex-row items-center justify-between">
        <AppText className="text-lg font-black text-[#231A0E]">추천 상황</AppText>
        <AppText className="font-mono text-xs font-bold text-[#8A7D6D]">{formatScenarioCount(recommendedScenarios.length)}</AppText>
      </View>

      <View className="mx-5 gap-3">
        {recommendedScenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onPress={() => void onStartLearning(scenario.situation, scenario)}
          />
        ))}
      </View>

      <Modal
        visible={showEmptySituationNotice}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmptySituationNotice(false)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl bg-white p-6">
            <AppText className="text-xl font-black text-[#231A0E]">상황을 입력해주세요</AppText>
            <AppText className="mt-2 text-sm leading-6 text-[#8A7D6D]">
              학습하고 싶은 상황을 입력한 뒤 다시 시작해주세요.
            </AppText>
            <Pressable
              onPress={() => setShowEmptySituationNotice(false)}
              className="mt-5 items-center rounded-xl bg-[#914523] py-3 active:opacity-80">
              <AppText className="font-black text-white">확인</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, Check, Lightbulb, RotateCcw } from 'lucide-react-native';
import { COLORS } from '@/data/constants';
import { LANGUAGES } from '@/data/languages';
import { AppHeader } from '@/components/gentalk/AppHeader';
import { AppText } from '@/components/gentalk/AppText';
import { DialogueBubble } from '@/components/gentalk/DialogueBubble';
import { PhraseRow } from '@/components/gentalk/PhraseRow';
import { RoundButton } from '@/components/gentalk/RoundButton';
import { VocabRow } from '@/components/gentalk/VocabRow';
import type { Scenario } from '@/types/learning';

type DetailTab = 'vocab' | 'phrases' | 'dialogue' | 'feedback';
const detailLabels: Record<DetailTab, string> = { vocab: '단어', phrases: '표현', dialogue: '대화', feedback: '피드백' };

export function DetailScreen({
  scenario,
  onBack,
  onPlayWordGame,
  onFeedbackViewed,
  dailySentenceIds,
  onToggleDailySentence,
}: {
  scenario: Scenario;
  onBack: () => void;
  onPlayWordGame: () => void;
  onFeedbackViewed: () => void;
  dailySentenceIds: string[];
  onToggleDailySentence: (phrase: import('@/types/learning').PhraseItem, index: number) => void;
}) {
  const [tab, setTab] = useState<DetailTab>('vocab');
  const lang = LANGUAGES.find((language) => language.code === scenario.langCode);
  const hasFeedbackToReview = Boolean(
    scenario.learningFeedback
      && ((scenario.learningFeedback.messageCorrections?.length ?? 0) > 0 || scenario.learningFeedback.improvements.length > 0),
  );
  const showFeedbackNotice = hasFeedbackToReview && !scenario.feedbackReviewed;

  return (
    <View className="flex-1">
      <View className="shrink-0 flex-row items-center gap-3 border-b border-[#E9DDCE] px-4 py-4">
        <RoundButton onPress={onBack}>
          <ArrowLeft size={17} color={COLORS.foreground} />
        </RoundButton>
        <View className="min-w-0 flex-1">
          <AppText className="font-mono text-[11px] text-[#8A7D6D]">
            {lang?.flag} {lang?.label}
          </AppText>
          <AppText numberOfLines={1} className="text-base font-black text-[#231A0E]">
            {scenario.situation}
          </AppText>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 136 }}>
        <View className="rounded-2xl border border-[#E9DDCE] bg-white p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-row gap-3">
              <View className="h-14 w-14 items-center justify-center rounded-xl bg-[#F2E8D9]">
                <AppText className="text-3xl">{scenario.emoji}</AppText>
              </View>
              <View className="min-w-0 flex-1">
                <AppText className="text-lg font-black leading-6 text-[#231A0E]">{scenario.title}</AppText>
                <AppText className="mt-1 text-xs leading-5 text-[#8A7D6D]">{scenario.context}</AppText>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-xl bg-[#EFE6D8] p-1">
          <View className="flex-row gap-1">
            {(['vocab', 'phrases', 'dialogue', 'feedback'] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setTab(item);
                  if (item === 'feedback' && showFeedbackNotice) onFeedbackViewed();
                }}
                className={`relative flex-1 rounded-lg py-2.5 ${tab === item ? 'bg-white shadow-sm' : ''}`}>
                <AppText
                  className={`text-center text-xs font-bold ${
                    tab === item ? 'text-[#231A0E]' : 'text-[#8A7D6D]'
                  }`}>
                  {detailLabels[item]}
                </AppText>
                {item === 'feedback' && showFeedbackNotice ? <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-3 gap-2">
          {tab === 'vocab' && <><Pressable onPress={onPlayWordGame} className="mb-2 flex-row items-center justify-center gap-2 rounded-xl bg-[#914523] py-3 active:opacity-80"><RotateCcw size={16} color="#FFFFFF" /><AppText className="font-black text-white">단어 게임</AppText></Pressable>{scenario.vocabulary.map((item) => <VocabRow key={item.word} item={item} />)}</>}
          {tab === 'phrases' &&
            scenario.phrases.map((item, index) => <PhraseRow key={item.phrase} item={item} languageCode={scenario.langCode} isDailySentence={dailySentenceIds.includes(`${scenario.id}-${index}`)} onToggleDailySentence={() => onToggleDailySentence(item, index)} />)}
          {tab === 'dialogue' &&
            scenario.dialogue.map((line, index) => <DialogueBubble key={`${line.speaker}-${index}`} line={line} languageCode={scenario.langCode} />)}
          {tab === 'feedback' && (scenario.learningFeedback ? (
            <>
              <View className="rounded-2xl border border-[#E1D2BB] bg-[#F3EBDD] p-4">
                <AppText className="font-black text-[#231A0E]">대화 개선 제안</AppText>
                <AppText className="mt-2 text-sm leading-6 text-[#6B5843]">{scenario.learningFeedback.suggestions.map((item, index) => `${index + 1}. ${item}`).join('\n\n') || '이번 대화에서는 실제 대화 흐름과 관련해 별도의 개선 제안이 없습니다.'}</AppText>
              </View>
              <View className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <AppText className="font-black text-emerald-800">잘한 점</AppText>
                <AppText className="mt-2 text-sm leading-6 text-emerald-800">{scenario.learningFeedback.strengths.map((item) => `• ${item}`).join('\n')}</AppText>
              </View>
              <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <AppText className="font-black text-amber-800">개선할 점</AppText>
                <AppText className="mt-2 text-sm leading-6 text-amber-800">{scenario.learningFeedback.improvements.map((item) => `• ${item}`).join('\n') || '이번 대화에서는 별도로 고칠 만한 실제 대화 문제가 없었습니다.'}</AppText>
              </View>
            </>
          ) : <View className="rounded-2xl border border-dashed border-[#E1D2BB] bg-[#F8F1E8] p-5"><AppText className="text-center text-sm text-[#8A7D6D]">저장된 피드백이 없습니다.</AppText></View>)}
        </View>

        <View className="mt-5 flex-row gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <Lightbulb size={17} color={COLORS.accent} />
          <View className="min-w-0 flex-1">
            <AppText className="font-mono text-[10px] font-bold uppercase tracking-[2px] text-[#C77932]">
              문화 팁
            </AppText>
            <AppText className="mt-1 text-xs leading-5 text-[#231A0E]">{scenario.culturalNote}</AppText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

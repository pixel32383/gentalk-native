import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
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
import type { LearningFeedback } from '@/types/feedback';

type FeedbackStepProps = {
  feedback: LearningFeedback | null;
  isLoading: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

function FeedbackLoadingState() {
  const [step, setStep] = useState(0);
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0.45);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.get() }));
  const stages = ['대화 흐름을 살펴보고 있어요', '좋았던 표현을 찾고 있어요', '다음 연습 포인트를 정리하고 있어요'];

  useEffect(() => {
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, stages.length - 1)), 2600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      pulse.set(1);
      return;
    }
    pulse.set(withRepeat(withSequence(withTiming(1, { duration: 650 }), withTiming(0.45, { duration: 650 })), -1));
    return () => cancelAnimation(pulse);
  }, [pulse, reducedMotion]);

  return (
    <View className="rounded-2xl border border-[#D8CAB5] bg-[#F3EBDD] px-5 py-7">
      <View className="flex-row items-center gap-2">
        <Animated.View style={pulseStyle} className="h-2.5 w-2.5 rounded-full bg-[#914523]" />
        <AppText className="font-black text-[#231A0E]">학습 피드백을 만들고 있어요</AppText>
      </View>
      <View className="mt-5 gap-3">
        {stages.map((label, index) => (
          <View key={label} className="flex-row items-center gap-3">
            <View className={`h-5 w-5 items-center justify-center rounded-full ${index <= step ? 'bg-[#914523]' : 'bg-[#E1D2BB]'}`}>
              <AppText className="text-[10px] font-black text-white">{index < step ? '✓' : index + 1}</AppText>
            </View>
            <AppText className={`text-sm ${index === step ? 'font-black text-[#6B5843]' : 'text-[#9A8977]'}`}>{label}</AppText>
          </View>
        ))}
      </View>
      <AppText className="mt-5 text-xs leading-5 text-[#8A7D6D]">대화 내용에 따라 잠시 걸릴 수 있어요.</AppText>
    </View>
  );
}

/** AI 회화 내용을 바탕으로 한 개선 제안과 학습 피드백 단계입니다. */
export function FeedbackStep({ feedback, isLoading, errorMessage, onRetry }: FeedbackStepProps) {
  if (isLoading || !feedback) {
    if (errorMessage) {
      return (
        <View className="items-center rounded-2xl border border-[#E8C8BA] bg-[#FFF7F3] px-5 py-10">
          <AppText className="text-center font-black text-[#914523]">학습 피드백을 만들지 못했어요</AppText>
          <AppText className="mt-2 text-center text-sm leading-5 text-[#754B46]">{errorMessage}</AppText>
          {onRetry ? (
            <Pressable onPress={onRetry} className="mt-5 rounded-xl bg-[#914523] px-5 py-3">
              <AppText className="font-black text-white">다시 시도</AppText>
            </Pressable>
          ) : null}
        </View>
      );
    }
    return <FeedbackLoadingState />;
  }

  return (
    <>
      {feedback.goalAchievement ? (
        <View className="rounded-2xl border border-[#B9E0D5] bg-[#F0F8F5] p-5">
          <AppText className="font-black text-[#187560]">상황 목표 달성도</AppText>
          <AppText className="mt-2 text-sm leading-6 text-[#36524C]">{feedback.goalAchievement.summary}</AppText>
          {feedback.goalAchievement.completed.length > 0 ? <AppText className="mt-3 text-xs leading-5 text-[#187560]">✓ 전달한 정보: {feedback.goalAchievement.completed.join(' · ')}</AppText> : null}
          {feedback.goalAchievement.missing.length > 0 ? <AppText className="mt-1 text-xs leading-5 text-[#A35F13]">→ 다음에 더할 정보: {feedback.goalAchievement.missing.join(' · ')}</AppText> : null}
        </View>
      ) : null}
      {feedback.priorityCorrection ? (
        <View className="rounded-2xl border border-[#F0D39E] bg-[#FFFAED] p-5">
          <AppText className="font-black text-[#A35F13]">우선 고치기 · {feedback.priorityCorrection.title}</AppText>
          <AppText className="mt-2 text-sm leading-6 text-[#725432]">{feedback.priorityCorrection.reason}</AppText>
          <View className="mt-3 rounded-xl bg-white/70 px-3 py-2.5"><AppText className="text-sm font-black text-[#6B4513]">{feedback.priorityCorrection.correctedExample}</AppText></View>
        </View>
      ) : null}
      <View className="rounded-2xl border border-[#D8CAB5] bg-[#F3EBDD] p-5">
        <AppText className="text-base font-black text-[#231A0E]">대화 개선 제안</AppText>
        <AppText className="mt-3 text-sm leading-6 text-[#6B5843]">
          {feedback.suggestions.map((item, index) => `${index + 1}. ${item}`).join('\n\n') || '이번 대화에서는 실제 대화 흐름과 관련해 별도의 개선 제안이 없습니다.'}
        </AppText>
      </View>
      <View className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <AppText className="font-black text-emerald-800">✓ 잘한 점</AppText>
        <AppText className="mt-2 text-sm leading-6 text-emerald-800">
          {feedback.strengths.map((item) => `• ${item}`).join('\n')}
        </AppText>
      </View>
      <View className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <AppText className="font-black text-amber-800">💡 개선할 점</AppText>
        <AppText className="mt-2 text-sm leading-6 text-amber-800">
          {feedback.improvements.map((item) => `• ${item}`).join('\n') || '이번 대화에서는 별도로 고칠 만한 실제 대화 문제가 없었습니다.'}
        </AppText>
      </View>
      {feedback.reusableSentence ? (
        <View className="rounded-2xl border border-[#D8CAB5] bg-white p-5">
          <AppText className="font-black text-[#914523]">다시 쓰기 좋은 문장</AppText>
          <AppText className="mt-2 text-base font-black leading-6 text-[#231A0E]">{feedback.reusableSentence.phrase}</AppText>
          <AppText className="mt-1 text-sm leading-5 text-[#8A7D6D]">{feedback.reusableSentence.translation}</AppText>
          <AppText className="mt-3 text-xs leading-5 text-[#8A7D6D]">표현 탭에 저장되어 오늘의 문장 후보로도 사용할 수 있어요.</AppText>
        </View>
      ) : null}
      {feedback.nextPracticeGoal ? (
        <View className="rounded-2xl border border-[#D6D9F3] bg-[#F4F5FF] p-5">
          <AppText className="font-black text-[#4A5299]">다음 대화 목표</AppText>
          <AppText className="mt-2 text-sm leading-6 text-[#4A5299]">{feedback.nextPracticeGoal}</AppText>
        </View>
      ) : null}
      {feedback.recurringWeakness ? (
        <View className="rounded-2xl border border-[#E8C8BA] bg-[#FFF7F3] p-5">
          <AppText className="font-black text-[#B65A3C]">반복해서 연습할 점</AppText>
          <AppText className="mt-2 text-sm leading-6 text-[#754B46]">{feedback.recurringWeakness}</AppText>
        </View>
      ) : null}
    </>
  );
}

import { View } from 'react-native';
import { AppText } from '@/components/gentalk/AppText';
import type { LearningFeedback } from '@/types/feedback';

type FeedbackStepProps = {
  feedback: LearningFeedback | null;
  isLoading: boolean;
};

/** AI 회화 내용을 바탕으로 한 개선 제안과 학습 피드백 단계입니다. */
export function FeedbackStep({ feedback, isLoading }: FeedbackStepProps) {
  if (isLoading || !feedback) {
    return (
      <View className="items-center rounded-2xl border border-[#D8CAB5] bg-[#F3EBDD] py-10">
        <AppText className="font-bold text-[#6B5843]">대화 내용을 분석하고 있어요...</AppText>
      </View>
    );
  }

  return (
    <>
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
    </>
  );
}

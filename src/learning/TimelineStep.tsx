import { View } from 'react-native';
import { AppText } from '@/components/gentalk/AppText';
import type { ConversationMessage } from '@/types/feedback';

type TimelineStepProps = {
  messages: ConversationMessage[];
};

/** 학습한 대화를 시간순으로 다시 볼 수 있는 마지막 단계입니다. */
export function TimelineStep({ messages }: TimelineStepProps) {
  return (
    <View className="gap-5 border-l-2 border-[#E1D2BB] pl-5">
      {messages.map((item, index) => (
        <View
          key={`${item.speaker}-${index}`}
          className="rounded-2xl border border-[#E1D2BB] bg-[#F3EBDD] p-4">
          <AppText className="font-mono text-[11px] text-[#914523]">
            {item.speaker} · 방금 전
          </AppText>
          <AppText className="mt-2 text-sm text-[#231A0E]">{item.text}</AppText>
        </View>
      ))}
    </View>
  );
}

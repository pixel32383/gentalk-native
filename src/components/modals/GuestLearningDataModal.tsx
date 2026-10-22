import { Modal, Pressable, View } from 'react-native';
import { BookOpen, ChevronRight, Plus, Trash2 } from 'lucide-react-native';
import { AppText } from '@/components/gentalk/AppText';

export function GuestLearningDataModal({
  visible,
  onKeepExisting,
  onReplaceWithGuest,
}: {
  visible: boolean;
  onKeepExisting: () => void;
  onReplaceWithGuest: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => undefined}>
      <View className="flex-1 justify-end bg-black/45">
        <View className="rounded-t-[32px] border-t border-[#E9DDCE] bg-[#FBF8F1] px-5 pb-8 pt-3">
          <View className="mx-auto h-1.5 w-11 rounded-full bg-[#DCCDB9]" />

          <View className="mt-6 flex-row items-start gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#F2E6D4]">
              <BookOpen size={22} color="#914523" />
            </View>
            <View className="min-w-0 flex-1 pt-0.5">
              <AppText className="text-[22px] font-black text-[#231A0E]">학습 기록을 어떻게 할까요?</AppText>
              <AppText className="mt-1 text-sm leading-5 text-[#8A7D6D]">이 Google 계정에 기존 학습 기록이 있어요.</AppText>
            </View>
          </View>

          <AppText className="mt-5 text-sm leading-6 text-[#6F5A44]">게스트로 학습한 기록을 추가할지, 기존 기록 대신 사용할지 선택해주세요.</AppText>

          <View className="mt-5 gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="기존 학습 기록 유지하고 게스트 기록 추가"
              onPress={onKeepExisting}
              className="flex-row items-center gap-3 rounded-2xl border border-[#DCCDB9] bg-white p-4 active:bg-[#F9F3EB]">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#E7F2EF]">
                <Plus size={21} color="#255F5A" strokeWidth={2.3} />
              </View>
              <View className="min-w-0 flex-1">
                <AppText className="font-black text-[#231A0E]">기존 기록 유지</AppText>
                <AppText className="mt-1 text-xs leading-5 text-[#8A7D6D]">기존 기록에 게스트 학습 기록을 추가해요.</AppText>
              </View>
              <ChevronRight size={20} color="#8A7D6D" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="기존 학습 기록을 지우고 게스트 기록으로 교체"
              onPress={onReplaceWithGuest}
              className="flex-row items-center gap-3 rounded-2xl border border-[#E8C8BA] bg-[#FFF9F6] p-4 active:bg-[#FDEFE9]">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#FCE9E3]">
                <Trash2 size={20} color="#B65A3C" />
              </View>
              <View className="min-w-0 flex-1">
                <AppText className="font-black text-[#914523]">게스트 기록으로 교체</AppText>
                <AppText className="mt-1 text-xs leading-5 text-[#8A7D6D]">기존 학습 기록과 오늘의 문장을 지우고 교체해요.</AppText>
              </View>
              <ChevronRight size={20} color="#B65A3C" />
            </Pressable>
          </View>

          <View className="mt-4 rounded-xl bg-[#F2EDE4] px-4 py-3">
            <AppText className="text-xs leading-5 text-[#8A7D6D]">프로필과 음성 설정은 그대로 유지됩니다.</AppText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

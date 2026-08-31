import { Modal, Pressable, View } from 'react-native';
import { CheckCircle2, Info, X } from 'lucide-react-native';
import { AppText } from '@/components/gentalk/AppText';
import { COLORS } from '@/data/constants';

export function AppInfoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/40 px-6">
        <Pressable onPress={(event) => event.stopPropagation()} className="w-full max-w-[420px] rounded-[28px] border border-[#E9DDCE] bg-[#FBF8F1] p-6">
          <View className="flex-row items-center justify-between">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#E7F2EF]"><Info size={23} color="#255F5A" /></View>
            <Pressable accessibilityRole="button" accessibilityLabel="앱 정보 닫기" onPress={onClose} className="rounded-full p-2 active:bg-[#F2E8D9]"><X size={19} color={COLORS.muted} /></Pressable>
          </View>
          <AppText className="mt-5 text-2xl font-black text-[#231A0E]">GENTALK</AppText>
          <AppText className="mt-1 text-sm font-bold text-[#914523]">버전 1.0.0</AppText>
          <AppText className="mt-5 text-[15px] leading-7 text-[#6F5A44]">실생활에서 바로 쓸 수 있는 상황을 중심으로 단어를 익히고, AI와 대화하며 연습하는 언어 학습 앱입니다.</AppText>
          <View className="mt-6 gap-3 rounded-2xl bg-white p-4">
            <View className="flex-row items-center gap-2"><CheckCircle2 size={17} color="#255F5A" /><AppText className="text-sm font-bold text-[#4F645F]">상황별 단어와 짝맞추기 게임</AppText></View>
            <View className="flex-row items-center gap-2"><CheckCircle2 size={17} color="#255F5A" /><AppText className="text-sm font-bold text-[#4F645F]">AI 회화와 맞춤형 피드백</AppText></View>
            <View className="flex-row items-center gap-2"><CheckCircle2 size={17} color="#255F5A" /><AppText className="text-sm font-bold text-[#4F645F]">오늘의 문장 복습 알림</AppText></View>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} className="mt-6 items-center rounded-2xl bg-[#255F5A] py-4 active:opacity-70"><AppText className="font-black text-white">확인</AppText></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

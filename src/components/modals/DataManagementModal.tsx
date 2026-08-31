import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { BookOpen, Database, Trash2, X } from 'lucide-react-native';
import { AppText } from '@/components/gentalk/AppText';
import { COLORS } from '@/data/constants';

type DeleteTarget = 'learning' | 'daily' | null;

export function DataManagementModal({
  visible,
  onClose,
  onDeleteLearning,
  onDeleteDaily,
}: {
  visible: boolean;
  onClose: () => void;
  onDeleteLearning: () => void;
  onDeleteDaily: () => void;
}) {
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const isLearning = deleteTarget === 'learning';

  function close() {
    setDeleteTarget(null);
    onClose();
  }

  function confirmDelete() {
    const action = isLearning ? onDeleteLearning : onDeleteDaily;
    setDeleteTarget(null);
    onClose();
    action();
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable onPress={close} className="flex-1 items-center justify-center bg-black/40 px-6">
          <Pressable onPress={(event) => event.stopPropagation()} className="w-full max-w-[420px] rounded-[28px] border border-[#E9DDCE] bg-[#FBF8F1] p-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E7F2EF]"><Database size={21} color="#255F5A" /></View>
                <View><AppText className="text-xl font-black text-[#231A0E]">데이터 관리</AppText><AppText className="mt-0.5 text-xs text-[#8A7D6D]">삭제할 항목을 선택해주세요</AppText></View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="데이터 관리 닫기" onPress={close} className="rounded-full p-2 active:bg-[#F2E8D9]"><X size={19} color={COLORS.muted} /></Pressable>
            </View>

            <View className="mt-6 gap-3">
              <Pressable accessibilityRole="button" onPress={() => setDeleteTarget('learning')} className="flex-row items-center gap-3 rounded-2xl border border-[#E9DDCE] bg-white p-4 active:bg-[#F9F3EB]">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F2E8D9]"><BookOpen size={19} color="#914523" /></View>
                <View className="min-w-0 flex-1"><AppText className="font-black text-[#231A0E]">학습 기록 전체 삭제</AppText><AppText className="mt-1 text-xs leading-5 text-[#8A7D6D]">완료한 학습과 이어서 학습할 내용을 삭제합니다.</AppText></View>
                <Trash2 size={18} color="#B65A3C" />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setDeleteTarget('daily')} className="flex-row items-center gap-3 rounded-2xl border border-[#E9DDCE] bg-white p-4 active:bg-[#F9F3EB]">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F2E8D9]"><BookOpen size={19} color="#914523" /></View>
                <View className="min-w-0 flex-1"><AppText className="font-black text-[#231A0E]">오늘의 문장 전체 삭제</AppText><AppText className="mt-1 text-xs leading-5 text-[#8A7D6D]">저장한 문장과 예약된 알림을 삭제합니다.</AppText></View>
                <Trash2 size={18} color="#B65A3C" />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={deleteTarget !== null} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <Pressable onPress={() => setDeleteTarget(null)} className="flex-1 items-center justify-center bg-black/40 px-6">
          <Pressable onPress={(event) => event.stopPropagation()} className="w-full max-w-[400px] rounded-[28px] border border-[#E9DDCE] bg-[#FBF8F1] p-6">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#FCE9E3]"><Trash2 size={21} color="#B65A3C" /></View>
            <AppText className="mt-5 text-xl font-black text-[#231A0E]">정말 삭제할까요?</AppText>
            <AppText className="mt-2 text-sm leading-6 text-[#8A7D6D]">{isLearning ? '완료한 학습 기록과 이어서 학습할 내용을 모두 삭제합니다. 오늘의 문장은 유지됩니다.' : '저장한 오늘의 문장과 예약된 알림을 모두 삭제합니다.'}</AppText>
            <View className="mt-6 flex-row gap-3">
              <Pressable accessibilityRole="button" onPress={() => setDeleteTarget(null)} className="flex-1 items-center rounded-2xl border border-[#DCCDB9] bg-white py-4 active:opacity-70"><AppText className="font-black text-[#6F5A44]">취소</AppText></Pressable>
              <Pressable accessibilityRole="button" onPress={confirmDelete} className="flex-1 items-center rounded-2xl bg-[#B65A3C] py-4 active:opacity-70"><AppText className="font-black text-white">전체 삭제</AppText></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

import { Modal, Pressable, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { AppText } from '@/components/gentalk/AppText';

export function DeleteConfirmModal({
  visible,
  title,
  description,
  confirmLabel = '삭제',
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/45 px-6">
        <Pressable
          accessibilityRole="alert"
          onPress={(event) => event.stopPropagation()}
          className="w-full max-w-[410px] rounded-[28px] border border-[#E9DDCE] bg-[#FBF8F1] px-6 py-7">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#FCE9E3]">
            <Trash2 size={22} color="#B65A3C" />
          </View>
          <AppText className="mt-5 text-[22px] font-black text-[#231A0E]">{title}</AppText>
          <AppText className="mt-2 text-sm leading-6 text-[#8A7D6D]">{description}</AppText>
          <View className="mt-6 flex-row gap-3">
            <Pressable accessibilityRole="button" onPress={onClose} className="flex-1 items-center rounded-2xl border border-[#DCCDB9] bg-white py-4 active:opacity-70">
              <AppText className="font-black text-[#6F5A44]">취소</AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} className="flex-1 items-center rounded-2xl bg-[#B65A3C] py-4 active:opacity-70">
              <AppText className="font-black text-white">{confirmLabel}</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

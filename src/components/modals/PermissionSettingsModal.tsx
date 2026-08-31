import { Modal, Pressable, View } from 'react-native';
import { Bell, ChevronRight, Mic, X } from 'lucide-react-native';
import { AppText } from '@/components/gentalk/AppText';
import { COLORS } from '@/data/constants';
import { RoundButton } from '@/components/gentalk/RoundButton';

export function PermissionSettingsModal({
  visible,
  microphonePermissionGranted,
  notificationPermissionGranted,
  onClose,
  onOpenMicrophoneSettings,
  onOpenNotificationSettings,
}: {
  visible: boolean;
  microphonePermissionGranted: boolean;
  notificationPermissionGranted: boolean;
  onClose: () => void;
  onOpenMicrophoneSettings: () => void;
  onOpenNotificationSettings: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-5">
        <View className="w-full rounded-2xl bg-white p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <AppText className="text-xl font-black text-[#231A0E]">권한 설정</AppText>
              <AppText className="mt-1 text-xs text-[#8A7D6D]">말하기와 알림에 필요한 권한을 관리하세요.</AppText>
            </View>
            <RoundButton onPress={onClose}><X size={15} color={COLORS.muted} /></RoundButton>
          </View>

          <View className="gap-2">
            <Pressable onPress={onOpenMicrophoneSettings} className="flex-row items-center gap-3 rounded-xl border border-[#E9DDCE] bg-[#FBF8F1] px-4 py-4 active:opacity-70">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F2E8D9]"><Mic size={18} color={COLORS.foreground} /></View>
              <View className="min-w-0 flex-1"><AppText className={`text-sm font-black ${microphonePermissionGranted ? 'text-[#159447]' : 'text-[#231A0E]'}`}>마이크</AppText><AppText className={`mt-0.5 text-xs ${microphonePermissionGranted ? 'font-black text-[#159447]' : 'text-[#8A7D6D]'}`}>{microphonePermissionGranted ? '현재 허용됨' : '말하기 연습에 사용합니다.'}</AppText></View>
              <ChevronRight size={17} color={COLORS.muted} />
            </Pressable>
            <Pressable onPress={onOpenNotificationSettings} className="flex-row items-center gap-3 rounded-xl border border-[#E9DDCE] bg-[#FBF8F1] px-4 py-4 active:opacity-70">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F2E8D9]"><Bell size={18} color={COLORS.foreground} /></View>
              <View className="min-w-0 flex-1"><AppText className={`text-sm font-black ${notificationPermissionGranted ? 'text-[#159447]' : 'text-[#231A0E]'}`}>알림</AppText><AppText className={`mt-0.5 text-xs ${notificationPermissionGranted ? 'font-black text-[#159447]' : 'text-[#8A7D6D]'}`}>{notificationPermissionGranted ? '현재 허용됨' : '권한 설정이 필요합니다.'}</AppText></View>
              <ChevronRight size={17} color={COLORS.muted} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

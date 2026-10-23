import { Modal, Pressable, View } from 'react-native';
import { Code2, X } from 'lucide-react-native';
import { AppText } from '@/components/gentalk/AppText';
import { COLORS } from '@/data/constants';
import { PREVIEW_RATE_LIMIT_TEST_BUILD } from '@/services/developer-settings';

export function DeveloperModeModal({
  visible,
  rateLimitEnabled,
  onToggleRateLimit,
  onClose,
}: {
  visible: boolean;
  rateLimitEnabled: boolean;
  onToggleRateLimit: (enabled: boolean) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/40 px-6">
        <Pressable onPress={(event) => event.stopPropagation()} className="w-full max-w-[420px] rounded-[28px] border border-[#E9DDCE] bg-[#FBF8F1] p-6">
          <View className="flex-row items-center justify-between">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F3EBDD]"><Code2 size={22} color="#914523" /></View>
            <Pressable accessibilityRole="button" accessibilityLabel="개발자 모드 닫기" onPress={onClose} className="rounded-full p-2 active:bg-[#F2E8D9]"><X size={19} color={COLORS.muted} /></Pressable>
          </View>
          <AppText className="mt-5 text-2xl font-black text-[#231A0E]">개발자 모드</AppText>
          <AppText className="mt-2 text-sm leading-6 text-[#6F5A44]">{PREVIEW_RATE_LIMIT_TEST_BUILD
            ? '테스트 전용 Preview 앱입니다. 이 설정으로 AI 요청 횟수 제한을 켜거나 끌 수 있습니다.'
            : '개발 서버에서만 사용하는 테스트 설정입니다. 일반 배포용 앱에서는 API 제한이 항상 적용됩니다.'}</AppText>

          <View className="mt-6 flex-row items-center justify-between rounded-2xl border border-[#E9DDCE] bg-white p-4">
            <View className="min-w-0 flex-1 pr-4">
              <AppText className="font-black text-[#231A0E]">AI API 요청 제한</AppText>
              <AppText className="mt-1 text-xs leading-5 text-[#8A7D6D]">{rateLimitEnabled ? '요청 횟수를 제한합니다.' : '테스트 중에는 요청 횟수를 제한하지 않습니다.'}</AppText>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: rateLimitEnabled }}
              accessibilityLabel="AI API 요청 제한"
              onPress={() => onToggleRateLimit(!rateLimitEnabled)}
              className={`h-8 w-14 justify-center rounded-full px-1 ${rateLimitEnabled ? 'items-end bg-[#255F5A]' : 'items-start bg-[#C9BBA8]'}`}>
              <View className="h-6 w-6 rounded-full bg-white" />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} className="mt-6 items-center rounded-2xl bg-[#255F5A] py-4 active:opacity-70"><AppText className="font-black text-white">완료</AppText></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

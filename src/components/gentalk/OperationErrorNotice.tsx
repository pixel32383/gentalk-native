import { Pressable, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { AppText } from './AppText';

export function OperationErrorNotice({ message, onRetry, onLater }: { message: string; onRetry: () => void; onLater: () => void }) {
  return (
    <View className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
      <AppText className="text-xs leading-5 text-red-700">{message}</AppText>
      <View className="mt-2 flex-row justify-end gap-2">
        <Pressable onPress={onLater} className="rounded-lg border border-red-200 bg-white px-3 py-2 active:opacity-70">
          <AppText className="text-xs font-black text-[#6B5843]">나중에</AppText>
        </Pressable>
        <Pressable onPress={onRetry} className="flex-row items-center gap-1 rounded-lg bg-[#914523] px-3 py-2 active:opacity-70">
          <RefreshCw size={13} color="#FFFFFF" />
          <AppText className="text-xs font-black text-white">재시도</AppText>
        </Pressable>
      </View>
    </View>
  );
}

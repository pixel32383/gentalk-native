import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/gentalk/AppText';
import { modalStyles } from '@/components/modals/modal-styles';

export function WordCountModal({
  visible,
  currentCount,
  onClose,
  onUpdateCount,
}: {
  visible: boolean;
  currentCount: number;
  onClose: () => void;
  onUpdateCount: (count: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draftCount, setDraftCount] = useState(String(currentCount));

  useEffect(() => {
    if (visible) {
      setDraftCount(String(currentCount));
    }
  }, [currentCount, visible]);

  function saveCount() {
    const parsedCount = Number.parseInt(draftCount, 10);
    const nextCount = Number.isNaN(parsedCount) ? 20 : Math.min(100, Math.max(1, parsedCount));
    onUpdateCount(nextCount);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={[modalStyles.overlay, undefined]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="학습 단어 수 설정 닫기"
          onPress={onClose}
          style={modalStyles.backdrop}
        />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <AppText style={modalStyles.title}>학습 단어 수</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              style={({ pressed }) => [
                modalStyles.closeButton,
                pressed && { opacity: 0.68 },
              ]}>
              <X size={20} color="#493B2C" strokeWidth={1.8} />
            </Pressable>
          </View>

          <View style={modalStyles.body}>
            <AppText style={modalStyles.label}>학습할 단어 개수</AppText>
            <AppText style={modalStyles.description}>
              한 번에 학습할 단어의 개수를 설정하세요 (1-100)
            </AppText>
            <TextInput
              accessibilityLabel="학습할 단어 개수"
              value={draftCount}
              onChangeText={(value) => setDraftCount(value.replace(/[^0-9]/g, '').slice(0, 3))}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={saveCount}
              style={modalStyles.input}
            />
          </View>

          <View style={[modalStyles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              accessibilityRole="button"
              onPress={saveCount}
              style={({ pressed }) => [
                modalStyles.saveButton,
                pressed && { opacity: 0.68 },
              ]}>
              <AppText style={modalStyles.saveText}>저장</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

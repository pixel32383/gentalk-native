import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/gentalk/AppText';
import { modalStyles } from '@/components/modals/modal-styles';

export function SentenceTimeModal({
  visible,
  currentTime,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentTime: string;
  onClose: () => void;
  onSave: (time: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draftTime, setDraftTime] = useState(currentTime);

  useEffect(() => {
    if (visible) {
      setDraftTime(currentTime);
    }
  }, [currentTime, visible]);

  function updateTimeInput(value: string) {
    const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
    setDraftTime(digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits);
  }

  function saveTime() {
    const [hoursText, minutesText] = draftTime.split(':');
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (
      draftTime.length !== 5 ||
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      Alert.alert('시간을 확인해주세요', '00:00부터 23:59 사이의 시간을 입력해주세요.');
      return;
    }

    onSave(
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    );
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={[modalStyles.overlay, undefined]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="오늘의 문장 시간 설정 닫기"
          onPress={onClose}
          style={modalStyles.backdrop}
        />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <AppText style={modalStyles.title}>오늘의 문장 시간</AppText>
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
            <AppText style={modalStyles.label}>문장을 받을 시간</AppText>
            <AppText style={modalStyles.description}>
              오늘의 문장을 받을 시간을 24시간 형식으로 입력하세요.
            </AppText>
            <TextInput
              accessibilityLabel="오늘의 문장을 받을 시간"
              value={draftTime}
              onChangeText={updateTimeInput}
              placeholder="09:00"
              placeholderTextColor="#A58E76"
              keyboardType="number-pad"
              maxLength={5}
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={saveTime}
              style={modalStyles.input}
            />
          </View>

          <View style={[modalStyles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              accessibilityRole="button"
              onPress={saveTime}
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

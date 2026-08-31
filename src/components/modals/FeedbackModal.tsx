import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Send, X } from 'lucide-react-native';
import { AppText } from '@/components/gentalk/AppText';
import { translateText } from '@/data/translations';
import { modalStyles } from '@/components/modals/modal-styles';

export function FeedbackModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      Alert.alert('피드백 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedContent);
      setContent('');
      onClose();
      Alert.alert('피드백을 보냈습니다', '소중한 의견 감사합니다.');
    } catch (error) {
      Alert.alert(
        '피드백 전송에 실패했습니다',
        error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="피드백 보내기 닫기" onPress={onClose} style={modalStyles.backdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.keyboardAvoidingView, { paddingBottom: insets.bottom }]}>
          <View style={styles.sheet}>
            <View style={modalStyles.header}>
              <AppText style={modalStyles.title}>피드백 보내기</AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={modalStyles.closeButton}>
                <X size={20} color="#493B2C" strokeWidth={1.8} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              <View style={styles.intro}>
                <MessageSquare size={19} color="#914523" />
                <AppText style={styles.introText}>불편했던 점이나 개선 의견을 편하게 남겨주세요.</AppText>
              </View>

              <View style={styles.field}>
                <AppText style={styles.label}>피드백 내용</AppText>
                <TextInput
                  accessibilityLabel={translateText('피드백 내용')}
                  value={content}
                  onChangeText={setContent}
                  placeholder={translateText('예) 단어 게임에서 글자가 조금 더 크게 보이면 좋겠어요.')}
                  placeholderTextColor="#A58E76"
                  multiline
                  textAlignVertical="top"
                  style={styles.textarea}
                />
              </View>

              <View style={styles.infoBox}>
                <AppText style={styles.infoText}>기기: {Platform.OS === 'android' ? 'Android 기기' : 'iOS 기기'}</AppText>
                <AppText style={styles.infoText}>OS: {Platform.OS} {Platform.Version}</AppText>
                <AppText style={styles.infoText}>발생 화면: 프로필</AppText>
              </View>
            </ScrollView>

            <View style={modalStyles.footer}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmitting }}
                disabled={isSubmitting}
                onPress={() => void submit()}
                style={({ pressed }) => [modalStyles.saveButton, styles.submitButton, (pressed || isSubmitting) && { opacity: 0.68 }]}>
                {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <><Send size={17} color="#FFFFFF" /><AppText style={modalStyles.saveText}>보내기</AppText></>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: { width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '86%', overflow: 'hidden', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FBF5E9' },
  body: { gap: 20, padding: 24 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, backgroundColor: '#F3E8D4', padding: 14 },
  introText: { flex: 1, color: '#6B5843', fontSize: 13, lineHeight: 20 },
  field: { gap: 9 },
  label: { color: '#6B5843', fontSize: 14, fontWeight: '800' },
  textarea: { minHeight: 142, borderWidth: 1, borderColor: '#D8CAB5', borderRadius: 14, backgroundColor: '#FFFFFF', padding: 14, color: '#231A0E', fontSize: 15, lineHeight: 22 },
  infoBox: { gap: 5, borderRadius: 14, backgroundColor: '#F2E8D9', padding: 14 },
  infoText: { color: '#8A7D6D', fontSize: 12, lineHeight: 18 },
  submitButton: { flexDirection: 'row', gap: 8 },
});

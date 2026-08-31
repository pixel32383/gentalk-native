import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Mail, Phone, User, X } from 'lucide-react-native';
import { AppText } from '@/components/gentalk/AppText';
import { translateText } from '@/data/translations';
import { modalStyles } from '@/components/modals/modal-styles';
import { profileEditStyles } from '@/components/modals/profile-edit-styles';

type Profile = { name: string; phone: string; email: string; imageUri: string | null };

export function ProfileEditModal({ visible, name, phone, email, imageUri, isGuest, isDeletingAccount, onClose, onSave, onDeleteAccount }: {
  visible: boolean;
  name: string;
  phone: string;
  email: string;
  imageUri: string | null;
  isGuest: boolean;
  isDeletingAccount: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  onDeleteAccount: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [draftName, setDraftName] = useState(name);
  const [draftPhone, setDraftPhone] = useState(phone);
  const [draftImageUri, setDraftImageUri] = useState<string | null>(imageUri);

  useEffect(() => {
    if (!visible) return;
    setDraftName(name);
    setDraftPhone(phone);
    setDraftImageUri(imageUri);
  }, [imageUri, name, phone, visible]);

  async function pickProfileImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근 권한 필요', '프로필 이미지를 선택하려면 사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setDraftImageUri(result.assets[0].uri);
  }

  function saveProfile() {
    const nextName = draftName.trim();
    if (!nextName) {
      Alert.alert('이름을 입력해주세요.');
      return;
    }
    onSave({ name: nextName, phone: draftPhone.trim(), email, imageUri: draftImageUri });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="프로필 설정 닫기" onPress={onClose} style={modalStyles.backdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[profileEditStyles.keyboardAvoidingView, { paddingBottom: insets.bottom }]}>
          <View style={profileEditStyles.sheet}>
            <View style={modalStyles.header}>
              <AppText style={modalStyles.title}>프로필 설정</AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={({ pressed }) => [modalStyles.closeButton, pressed && { opacity: 0.68 }]}>
                <X size={20} color="#493B2C" strokeWidth={1.8} />
              </Pressable>
            </View>

            <ScrollView style={profileEditStyles.scroll} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={profileEditStyles.body}>
              <View style={profileEditStyles.imageSection}>
                {draftImageUri ? (
                  <Image source={{ uri: draftImageUri }} contentFit="cover" style={profileEditStyles.image} />
                ) : (
                  <View style={[profileEditStyles.image, profileEditStyles.imageFallback]}>
                    <AppText style={profileEditStyles.initial}>{draftName.trim().charAt(0).toUpperCase() || 'G'}</AppText>
                  </View>
                )}
                <Pressable accessibilityRole="button" onPress={pickProfileImage} style={({ pressed }) => [profileEditStyles.imageButton, pressed && { opacity: 0.68 }]}>
                  <Camera size={17} color="#914523" />
                  <AppText style={profileEditStyles.imageButtonText}>이미지 변경</AppText>
                </Pressable>
              </View>

              <View style={profileEditStyles.field}>
                <AppText style={profileEditStyles.fieldLabel}>이름</AppText>
                <View style={profileEditStyles.inputRow}>
                  <User size={18} color="#8A7D6D" />
                  <TextInput accessibilityLabel={translateText('프로필 이름')} value={draftName} onChangeText={setDraftName} placeholder={translateText('이름을 입력하세요')} placeholderTextColor="#A58E76" autoCapitalize="words" style={profileEditStyles.input} />
                </View>
              </View>

              <View style={profileEditStyles.field}>
                <AppText style={profileEditStyles.fieldLabel}>전화번호</AppText>
                <View style={profileEditStyles.inputRow}>
                  <Phone size={18} color="#8A7D6D" />
                  <TextInput accessibilityLabel={translateText('전화번호')} value={draftPhone} onChangeText={(value) => setDraftPhone(value.replace(/[^0-9+\-\s]/g, '').slice(0, 20))} placeholder="010-1234-5678" placeholderTextColor="#A58E76" keyboardType="phone-pad" style={profileEditStyles.input} />
                </View>
              </View>

              <View style={profileEditStyles.field}>
                <AppText style={profileEditStyles.fieldLabel}>Google 계정</AppText>
                <View style={[profileEditStyles.inputRow, profileEditStyles.inputRowDisabled]}>
                  <Mail size={18} color="#8A7D6D" />
                  <TextInput accessibilityLabel={translateText('Google 계정 이메일')} value={isGuest ? '게스트 모드' : email} editable={false} placeholder="example@gmail.com" placeholderTextColor="#A58E76" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={[profileEditStyles.input, profileEditStyles.inputDisabled]} />
                </View>
                <AppText style={profileEditStyles.fieldHelp}>{isGuest ? '로그인하면 학습 기록을 계정에 저장할 수 있습니다.' : 'Google 계정은 변경이 불가능합니다.'}</AppText>
                {!isGuest ? (
                  <Pressable accessibilityRole="button" disabled={isDeletingAccount} onPress={onDeleteAccount} style={({ pressed }) => [profileEditStyles.deleteAccountButton, (pressed || isDeletingAccount) && { opacity: 0.68 }]}>
                    <AppText style={profileEditStyles.deleteAccountText}>{isDeletingAccount ? '탈퇴 처리 중...' : '탈퇴하기'}</AppText>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>

            <View style={modalStyles.footer}>
              <Pressable accessibilityRole="button" onPress={saveProfile} style={({ pressed }) => [modalStyles.saveButton, pressed && { opacity: 0.68 }]}>
                <AppText style={modalStyles.saveText}>저장</AppText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

import { Alert, Linking } from 'react-native';

type SpeechRecognitionPackage = typeof import('expo-speech-recognition');

function getSpeechRecognition(): SpeechRecognitionPackage | null {
  try {
    return require('expo-speech-recognition') as SpeechRecognitionPackage;
  } catch {
    return null;
  }
}

export async function getSpeechPermissionGranted(): Promise<boolean> {
  const speechRecognition = getSpeechRecognition();
  if (!speechRecognition) return false;
  try {
    const permission = await speechRecognition.ExpoSpeechRecognitionModule.getPermissionsAsync();
    return permission.granted;
  } catch {
    return false;
  }
}

export async function requestSpeechPermissionOnFirstLogin(showResult = false): Promise<boolean> {
  const speechRecognition = getSpeechRecognition();
  if (!speechRecognition) {
    if (showResult) {
      Alert.alert('말하기 기능 준비 중', '마이크 권한을 사용하려면 최신 개발 앱을 설치해주세요.');
    }
    return false;
  }

  try {
    const currentPermission = await speechRecognition.ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (currentPermission.granted) {
      if (showResult) Alert.alert('마이크 권한', '마이크 권한이 이미 허용되어 있습니다.');
      return true;
    }

    if (currentPermission.canAskAgain) {
      const requestedPermission = await speechRecognition.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (requestedPermission.granted) {
        if (showResult) Alert.alert('마이크 권한 허용됨', '이제 말하기 연습을 사용할 수 있습니다.');
        return true;
      }
    }

    Alert.alert(
      '마이크 권한이 필요합니다',
      '말하기 기능을 사용하려면 설정에서 GENTALK의 마이크 권한을 허용해주세요.',
      [
        { text: '나중에', style: 'cancel' },
        { text: '설정 열기', onPress: () => void Linking.openSettings() },
      ],
    );
    return false;
  } catch (error) {
    console.warn('마이크 권한을 확인하지 못했습니다.', error);
    if (showResult) Alert.alert('마이크 권한 확인 실패', '잠시 후 다시 시도해주세요.');
    return false;
  }
}

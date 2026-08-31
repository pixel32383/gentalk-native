import { Alert, Linking } from 'react-native';
import { FEEDBACK_EMAIL } from '@/data/constants';

export async function openFeedbackEmail() {
  const subject = '[GENTALK] 사용자 피드백';
  const body = ['안녕하세요. GENTALK 사용자 피드백을 전달드립니다.', '', '■ 피드백 내용', '', '', '■ 기기', '', '', '■ OS', '', '', '■ 발생 화면', '', '', '감사합니다.'].join('\n');
  const mailtoUrl = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    if (!(await Linking.canOpenURL(mailtoUrl))) {
      Alert.alert('메일 앱을 열 수 없습니다', `기기에 메일 앱이 설정되어 있는지 확인해주세요.\n\n받는 사람: ${FEEDBACK_EMAIL}`);
      return;
    }
    await Linking.openURL(mailtoUrl);
  } catch {
    Alert.alert('메일 앱을 열 수 없습니다', `메일 앱 실행 중 문제가 발생했습니다.\n\n받는 사람: ${FEEDBACK_EMAIL}`);
  }
}

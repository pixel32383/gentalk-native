import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

export async function cancelDailySentenceNotifications() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(notifications.filter((item) => item.content.data?.kind === 'daily-sentence').map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

async function requestPermission() {
  const granted = await requestNotificationPermissionOnFirstLogin();
  if (!granted) {
    Alert.alert('알림 권한이 필요합니다', '오늘의 문장을 받으려면 기기 설정에서 알림 권한을 허용해주세요.');
  }
  return granted;
}

export async function requestNotificationPermissionOnFirstLogin(showResult = false) {
  if (process.env.EXPO_OS === 'web') { Alert.alert('휴대폰에서 설정해주세요', '오늘의 문장 알림은 iOS 또는 Android 앱에서 사용할 수 있습니다.'); return false; }
  if (process.env.EXPO_OS === 'android') await Notifications.setNotificationChannelAsync('daily-sentence', { name: '오늘의 문장', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 250, 250], lightColor: '#914523' });
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    if (showResult) Alert.alert('알림 권한', '알림 권한이 이미 허용되어 있습니다.');
    return true;
  }

  if (current.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.granted) {
      if (showResult) Alert.alert('알림 권한 허용됨', '오늘의 문장 알림을 받을 수 있습니다.');
      return true;
    }
  }

  return false;
}

export async function scheduleDailySentenceNotifications(time: string, count: number, sentences: Array<{ text: string; translation: string }>) {
  if (!(await requestPermission())) return false;
  await cancelDailySentenceNotifications();
  const [hour, minute] = time.split(':').map(Number);
  const selected = sentences.slice(0, count);
  if (selected.length === 0) return false;
  const firstDate = new Date();
  firstDate.setHours(hour, minute, 0, 0);
  if (firstDate.getTime() <= Date.now()) firstDate.setDate(firstDate.getDate() + 1);

  await Promise.all(Array.from({ length: 14 }, (_, dayOffset) => {
    const deliveryDate = new Date(firstDate);
    deliveryDate.setDate(firstDate.getDate() + dayOffset);
    const dailySentences = Array.from({ length: Math.min(count, sentences.length) }, (_, sentenceOffset) =>
      sentences[(dayOffset * count + sentenceOffset) % sentences.length],
    );
    return Notifications.scheduleNotificationAsync({
      content: {
        title: dailySentences.length > 1 ? `오늘의 문장 ${dailySentences.length}개` : '오늘의 문장',
        body: dailySentences.map((sentence, index) => `${index + 1}. ${sentence.text}\n${sentence.translation}`).join('\n\n'),
        sound: 'default',
        data: { kind: 'daily-sentence', screen: 'saved', deliveryDate: deliveryDate.toISOString() },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: deliveryDate, channelId: 'daily-sentence' },
    });
  }));
  return true;
}

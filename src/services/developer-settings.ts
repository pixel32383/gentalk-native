import AsyncStorage from '@react-native-async-storage/async-storage';

const RATE_LIMIT_KEY = '@gentalk/developer-ai-rate-limit-enabled';
let aiRateLimitEnabled = true;

/** 개발자 모드의 API 제한 상태를 앱 실행 중 빠르게 읽을 수 있게 보관합니다. */
export function getDevelopmentAiRateLimitEnabled() {
  return aiRateLimitEnabled;
}

export async function loadDevelopmentAiRateLimitEnabled() {
  const saved = await AsyncStorage.getItem(RATE_LIMIT_KEY);
  aiRateLimitEnabled = saved !== 'false';
  return aiRateLimitEnabled;
}

export async function setDevelopmentAiRateLimitEnabled(enabled: boolean) {
  aiRateLimitEnabled = enabled;
  await AsyncStorage.setItem(RATE_LIMIT_KEY, enabled ? 'true' : 'false');
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREVIEW_RATE_LIMIT_TEST_BUILD = process.env.EXPO_PUBLIC_GENTALK_TEST_RATE_LIMIT_CONTROLS === 'true';
const RATE_LIMIT_KEY = PREVIEW_RATE_LIMIT_TEST_BUILD
  ? '@gentalk/preview-test-ai-rate-limit-enabled'
  : '@gentalk/developer-ai-rate-limit-enabled';
const DEFAULT_RATE_LIMIT_ENABLED = !PREVIEW_RATE_LIMIT_TEST_BUILD;
let aiRateLimitEnabled = DEFAULT_RATE_LIMIT_ENABLED;

/** 개발자 모드의 API 제한 상태를 앱 실행 중 빠르게 읽을 수 있게 보관합니다. */
export function getDevelopmentAiRateLimitEnabled() {
  return aiRateLimitEnabled;
}

export async function loadDevelopmentAiRateLimitEnabled() {
  const saved = await AsyncStorage.getItem(RATE_LIMIT_KEY);
  aiRateLimitEnabled = saved === null ? DEFAULT_RATE_LIMIT_ENABLED : saved !== 'false';
  return aiRateLimitEnabled;
}

export async function setDevelopmentAiRateLimitEnabled(enabled: boolean) {
  aiRateLimitEnabled = enabled;
  await AsyncStorage.setItem(RATE_LIMIT_KEY, enabled ? 'true' : 'false');
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

const DEFAULT_SPEECH_RATE = 1;
let activeSpeechRate = DEFAULT_SPEECH_RATE;
export type SpeechVoiceMode = 'default' | 'male';
let activeSpeechVoiceMode: SpeechVoiceMode = 'default';

export type VoiceSettings = {
  rate: number;
  voiceMode: SpeechVoiceMode;
};

const MALE_VOICE_MARKERS = [
  'male', 'man', 'david', 'mark', 'daniel', 'alex', 'tom', 'fred', 'james', 'aaron',
  'arthur', 'george', 'michael', 'otoya', 'takumi', 'naoki', 'kevin', 'ryan',
];

function getStorageKey(userId: string) {
  return `@gentalk/voice-settings/${userId}`;
}

function getVoiceModeStorageKey(userId: string) {
  return `@gentalk/voice-mode/${userId}`;
}

function normalizeRate(value: unknown) {
  const rate = Number(value);
  const legacyRateMap: Record<number, number> = { 0.7: 0.8, 0.9: 1, 1.1: 1.2 };
  return [0.8, 1, 1.2].includes(rate) ? rate : legacyRateMap[rate] ?? DEFAULT_SPEECH_RATE;
}

function normalizeVoiceSettings(value: Partial<VoiceSettings> | undefined): VoiceSettings {
  return {
    rate: normalizeRate(value?.rate),
    voiceMode: value?.voiceMode === 'male' ? 'male' : 'default',
  };
}

async function loadCachedVoiceSettings(userId: string): Promise<VoiceSettings | null> {
  try {
    const [savedRate, savedVoiceMode] = await Promise.all([
      AsyncStorage.getItem(getStorageKey(userId)),
      AsyncStorage.getItem(getVoiceModeStorageKey(userId)),
    ]);
    if (savedRate === null && savedVoiceMode === null) return null;
    return normalizeVoiceSettings({ rate: savedRate === null ? undefined : Number(savedRate), voiceMode: savedVoiceMode === 'male' ? 'male' : 'default' });
  } catch {
    return null;
  }
}

async function cacheVoiceSettings(userId: string, settings: VoiceSettings) {
  await AsyncStorage.multiSet([
    [getStorageKey(userId), String(settings.rate)],
    [getVoiceModeStorageKey(userId), settings.voiceMode],
  ]);
}

function applyVoiceSettings(settings: VoiceSettings) {
  setSpeechRate(settings.rate);
  setSpeechVoiceMode(settings.voiceMode);
}

export function getSpeechRate() {
  return activeSpeechRate;
}

export function setSpeechRate(rate: number) {
  activeSpeechRate = rate;
}

export function getSpeechVoiceMode() {
  return activeSpeechVoiceMode;
}

export function setSpeechVoiceMode(mode: SpeechVoiceMode) {
  activeSpeechVoiceMode = mode;
}

// Some Android TTS engines do not expose a separate male voice for every language.
// Keep the selected experience distinct even when the device only has a default voice.
export function getSpeechPitch(mode: SpeechVoiceMode = activeSpeechVoiceMode) {
  return mode === 'male' ? 0.72 : 1;
}

export async function getSelectedSpeechVoice(language: string, mode: SpeechVoiceMode = activeSpeechVoiceMode): Promise<string | undefined> {
  if (mode !== 'male') return undefined;
  try {
    const languagePrefix = language.toLocaleLowerCase().split('-')[0];
    const voices = await Speech.getAvailableVoicesAsync();
    const matchingVoices = voices.filter((voice) => voice.language.toLocaleLowerCase().startsWith(languagePrefix));
    const maleVoice = matchingVoices.find((voice) => {
      const description = `${voice.name} ${voice.identifier}`.toLocaleLowerCase();
      return MALE_VOICE_MARKERS.some((marker) => description.includes(marker));
    });
    return maleVoice?.identifier;
  } catch {
    return undefined;
  }
}

export async function loadVoiceSettings(userId: string): Promise<VoiceSettings> {
  const cached = await loadCachedVoiceSettings(userId);

  try {
    const snapshot = await getDoc(doc(db, 'users', userId));
    const remoteSettings = snapshot.data()?.voiceSettings as Partial<VoiceSettings> | undefined;
    if (remoteSettings) {
      const settings = normalizeVoiceSettings(remoteSettings);
      await cacheVoiceSettings(userId, settings);
      applyVoiceSettings(settings);
      return settings;
    }

    if (cached) {
      await saveVoiceSettings(userId, cached);
      return cached;
    }
  } catch {
    // The latest device cache still lets speech work while offline.
  }

  const settings = cached ?? { rate: DEFAULT_SPEECH_RATE, voiceMode: 'default' };
  applyVoiceSettings(settings);
  return settings;
}

export async function saveVoiceSettings(userId: string, settings: VoiceSettings): Promise<void> {
  const normalized = normalizeVoiceSettings(settings);
  applyVoiceSettings(normalized);
  await cacheVoiceSettings(userId, normalized);
  await setDoc(doc(db, 'users', userId), {
    voiceSettings: normalized,
    voiceSettingsUpdatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function loadSpeechRate(userId: string) {
  return (await loadVoiceSettings(userId)).rate;
}

export async function saveSpeechRate(userId: string, rate: number) {
  await saveVoiceSettings(userId, { rate, voiceMode: activeSpeechVoiceMode });
}

export async function loadSpeechVoiceMode(userId: string): Promise<SpeechVoiceMode> {
  return (await loadVoiceSettings(userId)).voiceMode;
}

export async function saveSpeechVoiceMode(userId: string, mode: SpeechVoiceMode): Promise<void> {
  await saveVoiceSettings(userId, { rate: activeSpeechRate, voiceMode: mode });
}

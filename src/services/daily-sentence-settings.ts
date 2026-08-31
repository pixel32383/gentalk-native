import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export type DailySentenceSettings = {
  enabled: boolean;
  time: string;
  count: number;
};

const DEFAULT_SETTINGS: DailySentenceSettings = {
  enabled: false,
  time: '09:00',
  count: 1,
};

function getStorageKey(userId: string) {
  return `@gentalk/daily-sentence-settings/${userId}`;
}

function normalizeSettings(saved: Partial<DailySentenceSettings> | undefined): DailySentenceSettings {
  try {
    const count = Number(saved?.count);
    const time = saved?.time;
    return {
      enabled: saved?.enabled === true,
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(time ?? '') ? time! : DEFAULT_SETTINGS.time,
      count: Number.isInteger(count) && count >= 1 && count <= 3 ? count : DEFAULT_SETTINGS.count,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function loadCachedSettings(userId: string): Promise<DailySentenceSettings | null> {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey(userId));
    return raw ? normalizeSettings(JSON.parse(raw) as Partial<DailySentenceSettings>) : null;
  } catch {
    return null;
  }
}

async function cacheSettings(userId: string, settings: DailySentenceSettings) {
  await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(settings));
}

export async function loadDailySentenceSettings(userId: string): Promise<DailySentenceSettings> {
  const cached = await loadCachedSettings(userId);

  try {
    const snapshot = await getDoc(doc(db, 'users', userId));
    const remoteSettings = snapshot.data()?.dailySentenceSettings as Partial<DailySentenceSettings> | undefined;
    if (remoteSettings) {
      const settings = normalizeSettings(remoteSettings);
      await cacheSettings(userId, settings);
      return settings;
    }

    // Preserve settings chosen before account sync was introduced.
    if (cached) {
      await saveDailySentenceSettings(userId, cached);
      return cached;
    }
  } catch {
    // Offline or a transient Firestore failure: the on-device cache remains usable.
  }

  return cached ?? DEFAULT_SETTINGS;
}

export async function saveDailySentenceSettings(userId: string, settings: DailySentenceSettings): Promise<void> {
  const normalized = normalizeSettings(settings);
  await cacheSettings(userId, normalized);
  await setDoc(doc(db, 'users', userId), {
    dailySentenceSettings: normalized,
    dailySentenceSettingsUpdatedAt: serverTimestamp(),
  }, { merge: true });
}

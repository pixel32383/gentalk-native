import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { clearPendingSyncOperation, queuePendingSyncOperation } from '@/services/pending-sync';
import { waitForRemoteWrite } from '@/services/remote-write';

export type UserProfile = {
  name: string;
  phone: string;
  email: string;
  imageUri: string | null;
};

function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getCacheKey(userId: string) {
  return `@gentalk/user-profile/${userId}`;
}

async function loadCachedUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(userId));
    if (!raw) return null;
    const profile = JSON.parse(raw) as Partial<UserProfile>;
    return profile.name ? { name: profile.name, phone: profile.phone ?? '', email: profile.email ?? '', imageUri: profile.imageUri ?? null } : null;
  } catch {
    return null;
  }
}

async function cacheUserProfile(userId: string, profile: UserProfile) {
  await AsyncStorage.setItem(getCacheKey(userId), JSON.stringify(profile));
}

export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  const cached = await loadCachedUserProfile(userId);
  try {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) return cached;
    const profile = snapshot.data().profile as Partial<UserProfile> | undefined;
    if (!profile?.name) return cached;
    const normalized = { name: profile.name, phone: profile.phone ?? '', email: profile.email ?? '', imageUri: profile.imageUri ?? null };
    await cacheUserProfile(userId, normalized);
    return normalized;
  } catch {
    return cached;
  }
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  const cleanProfile = withoutUndefined(profile);
  await cacheUserProfile(userId, cleanProfile);
  await queuePendingSyncOperation({ userId, type: 'save-user-profile', profile: cleanProfile });
  try {
    await waitForRemoteWrite(setDoc(doc(db, 'users', userId), {
      profile: cleanProfile,
      profileUpdatedAt: serverTimestamp(),
    }, { merge: true }));
    await clearPendingSyncOperation({ userId, type: 'save-user-profile', profile: cleanProfile });
  } catch (error) {
    throw error;
  }
}

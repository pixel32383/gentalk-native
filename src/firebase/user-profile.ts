import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { clearPendingSyncOperation, getPendingSyncOperations, queuePendingSyncOperation } from '@/services/pending-sync';
import { waitForRemoteWrite } from '@/services/remote-write';

export type UserProfile = {
  name: string;
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
    return profile.name ? { name: profile.name, email: profile.email ?? '', imageUri: profile.imageUri ?? null } : null;
  } catch {
    return null;
  }
}

async function cacheUserProfile(userId: string, profile: UserProfile) {
  await AsyncStorage.setItem(getCacheKey(userId), JSON.stringify(profile));
}

export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  const cached = await loadCachedUserProfile(userId);
  const pendingProfile = (await getPendingSyncOperations(userId)).find((item) => item.type === 'save-user-profile');
  if (pendingProfile?.type === 'save-user-profile') return pendingProfile.profile;
  try {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) return cached;
    const profile = snapshot.data().profile as (Partial<UserProfile> & { phone?: unknown }) | undefined;
    if (!profile?.name) return cached;
    const normalized = { name: profile.name, email: profile.email ?? '', imageUri: profile.imageUri ?? null };
    await cacheUserProfile(userId, normalized);
    if (Object.hasOwn(profile, 'phone')) void removeLegacyPhone(userId, normalized);
    return normalized;
  } catch {
    return cached;
  }
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  const cleanProfile = withoutUndefined(profile);
  await cacheUserProfile(userId, cleanProfile);
  const operationId = await queuePendingSyncOperation({ userId, type: 'save-user-profile', profile: cleanProfile });
  try {
    await saveRemoteProfile(userId, cleanProfile);
    await clearPendingSyncOperation(operationId);
  } catch (error) {
    throw error;
  }
}

async function saveRemoteProfile(userId: string, profile: UserProfile) {
  await waitForRemoteWrite(setDoc(doc(db, 'users', userId), {
    profile: { ...profile, phone: deleteField() },
    profileUpdatedAt: serverTimestamp(),
  }, { merge: true }));
}

async function removeLegacyPhone(userId: string, profile: UserProfile) {
  const operationId = await queuePendingSyncOperation({ userId, type: 'save-user-profile', profile });
  try {
    await saveRemoteProfile(userId, profile);
    await clearPendingSyncOperation(operationId);
  } catch {
    // The queued profile write removes the obsolete field after the device reconnects.
  }
}

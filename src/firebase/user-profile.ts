import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type UserProfile = {
  name: string;
  phone: string;
  email: string;
  imageUri: string | null;
};

function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', userId));
  if (!snapshot.exists()) return null;
  const profile = snapshot.data().profile as Partial<UserProfile> | undefined;
  if (!profile?.name) return null;
  return { name: profile.name, phone: profile.phone ?? '', email: profile.email ?? '', imageUri: profile.imageUri ?? null };
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'users', userId), {
    profile: withoutUndefined(profile),
    profileUpdatedAt: serverTimestamp(),
  }, { merge: true });
}

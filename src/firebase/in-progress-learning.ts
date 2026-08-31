import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import type { LearningProgress } from '@/types/learning';
import { db } from './firebase';

const COLLECTION_NAME = 'inProgressLearning';

function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function loadInProgressLearning(userId: string): Promise<LearningProgress[]> {
  const progressQuery = query(collection(db, 'users', userId, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(progressQuery);
  return snapshot.docs.map((item) => item.data().progress as LearningProgress);
}

export async function saveInProgressLearning(userId: string, progress: LearningProgress): Promise<void> {
  const savedProgress = withoutUndefined({ ...progress, updatedAt: new Date().toISOString() });
  await setDoc(doc(db, 'users', userId, COLLECTION_NAME, savedProgress.id), {
    progress: savedProgress,
    updatedAt: savedProgress.updatedAt,
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function deleteInProgressLearning(userId: string, progressId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, COLLECTION_NAME, progressId));
}

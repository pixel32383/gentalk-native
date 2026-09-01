import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LearningProgress } from '@/types/learning';
import { db } from './firebase';
import { clearPendingSyncOperation, getPendingDeletedIds, queuePendingSyncOperation } from '@/services/pending-sync';
import { waitForRemoteWrite } from '@/services/remote-write';

const COLLECTION_NAME = 'inProgressLearning';

function getCacheKey(userId: string) {
  return `@gentalk/in-progress-learning/${userId}`;
}

async function loadCachedProgress(userId: string): Promise<LearningProgress[]> {
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(userId));
    if (!raw) return [];
    const progress = JSON.parse(raw) as LearningProgress[];
    return Array.isArray(progress) ? progress.filter((item) => item?.id && item?.scenario) : [];
  } catch {
    return [];
  }
}

async function cacheProgress(userId: string, progress: LearningProgress[]) {
  await AsyncStorage.setItem(getCacheKey(userId), JSON.stringify(progress));
}

function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function loadInProgressLearning(userId: string): Promise<LearningProgress[]> {
  const cached = await loadCachedProgress(userId);
  try {
    const progressQuery = query(collection(db, 'users', userId, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(progressQuery);
    const pendingDeletedIds = await getPendingDeletedIds(userId, COLLECTION_NAME);
    const remote = snapshot.docs
      .map((item) => item.data().progress as LearningProgress)
      .filter((item) => item?.id && item?.scenario && !pendingDeletedIds.has(item.id));
    const merged = [...remote, ...cached.filter((item) => !remote.some((remoteItem) => remoteItem.id === item.id))]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    await cacheProgress(userId, merged);
    return merged;
  } catch (error) {
    console.warn('진행 중인 학습을 서버에서 불러오지 못해 기기 저장본을 사용합니다.', error);
    return cached;
  }
}

export async function saveInProgressLearning(userId: string, progress: LearningProgress): Promise<void> {
  const savedProgress = withoutUndefined({ ...progress, updatedAt: new Date().toISOString() });
  const cached = await loadCachedProgress(userId);
  await cacheProgress(userId, [savedProgress, ...cached.filter((item) => item.id !== savedProgress.id)]);
  await queuePendingSyncOperation({ userId, type: 'save-in-progress-learning', progress: savedProgress });
  try {
    await waitForRemoteWrite(setDoc(doc(db, 'users', userId, COLLECTION_NAME, savedProgress.id), {
      progress: savedProgress,
      updatedAt: savedProgress.updatedAt,
      serverUpdatedAt: serverTimestamp(),
    }));
    await clearPendingSyncOperation({ userId, type: 'save-in-progress-learning', progress: savedProgress });
  } catch (error) {
    throw error;
  }
}

export async function deleteInProgressLearning(userId: string, progressId: string): Promise<void> {
  const cached = await loadCachedProgress(userId);
  await cacheProgress(userId, cached.filter((item) => item.id !== progressId));
  await queuePendingSyncOperation({ userId, type: 'delete-in-progress-learning', progressId });
  try {
    await waitForRemoteWrite(deleteDoc(doc(db, 'users', userId, COLLECTION_NAME, progressId)));
    await clearPendingSyncOperation({ userId, type: 'delete-in-progress-learning', progressId });
  } catch (error) {
    throw error;
  }
}

import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailySentence } from '@/types/learning';
import { db } from './firebase';
import { clearPendingSyncOperation, getPendingDeletedIds, queuePendingSyncOperation } from '@/services/pending-sync';
import { waitForRemoteWrite } from '@/services/remote-write';

const COLLECTION_NAME = 'dailySentences';

function getCacheKey(userId: string) {
  return `@gentalk/daily-sentences/${userId}`;
}

async function loadCachedDailySentences(userId: string): Promise<DailySentence[]> {
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(userId));
    if (!raw) return [];
    const sentences = JSON.parse(raw) as DailySentence[];
    return Array.isArray(sentences) ? sentences.filter((sentence) => sentence?.id && sentence?.phrase) : [];
  } catch {
    return [];
  }
}

async function cacheDailySentences(userId: string, sentences: DailySentence[]): Promise<void> {
  await AsyncStorage.setItem(getCacheKey(userId), JSON.stringify(sentences));
}

function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function loadDailySentences(userId: string): Promise<DailySentence[]> {
  const cached = await loadCachedDailySentences(userId);
  try {
    const snapshot = await getDocs(query(collection(db, 'users', userId, COLLECTION_NAME), orderBy('savedAt', 'desc')));
    const pendingDeletedIds = await getPendingDeletedIds(userId, COLLECTION_NAME);
    const remote = snapshot.docs
      .map((item) => {
        const data = item.data();
        // 이전 저장 형식(문장을 문서 최상위에 저장한 경우)도 함께 읽습니다.
        return (data.sentence ?? data) as DailySentence;
      })
      .filter((sentence) => sentence?.id && sentence?.phrase && !pendingDeletedIds.has(sentence.id));
    const merged = [...remote, ...cached.filter((sentence) => !remote.some((remoteSentence) => remoteSentence.id === sentence.id))]
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
    await cacheDailySentences(userId, merged);
    return merged;
  } catch (error) {
    console.warn('오늘의 문장을 서버에서 불러오지 못해 기기 저장본을 사용합니다.', error);
    return cached;
  }
}

export async function saveDailySentence(userId: string, sentence: DailySentence): Promise<void> {
  const cleanSentence = withoutUndefined(sentence);
  const cached = await loadCachedDailySentences(userId);
  await cacheDailySentences(userId, [cleanSentence, ...cached.filter((item) => item.id !== cleanSentence.id)]);
  await queuePendingSyncOperation({ userId, type: 'save-daily-sentence', sentence: cleanSentence });
  try {
    await waitForRemoteWrite(setDoc(doc(db, 'users', userId, COLLECTION_NAME, cleanSentence.id), { sentence: cleanSentence, savedAt: cleanSentence.savedAt, updatedAt: serverTimestamp() }));
    await clearPendingSyncOperation({ userId, type: 'save-daily-sentence', sentence: cleanSentence });
  } catch (error) {
    throw error;
  }
}

export async function deleteDailySentence(userId: string, sentenceId: string): Promise<void> {
  const cached = await loadCachedDailySentences(userId);
  await cacheDailySentences(userId, cached.filter((sentence) => sentence.id !== sentenceId));
  await queuePendingSyncOperation({ userId, type: 'delete-daily-sentence', sentenceId });
  try {
    await waitForRemoteWrite(deleteDoc(doc(db, 'users', userId, COLLECTION_NAME, sentenceId)));
    await clearPendingSyncOperation({ userId, type: 'delete-daily-sentence', sentenceId });
  } catch (error) {
    throw error;
  }
}

import { signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Scenario } from '@/types/learning';
import { auth, db } from './firebase';
import { clearPendingSyncOperation, getPendingDeletedIds, queuePendingSyncOperation } from '@/services/pending-sync';
import { waitForRemoteWrite } from '@/services/remote-write';

const RECORDS_COLLECTION = 'learningRecords';

function getCacheKey(userId: string) {
  return `@gentalk/learning-records/${userId}`;
}

async function loadCachedLearningRecords(userId: string): Promise<Scenario[]> {
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(userId));
    if (!raw) return [];
    const records = JSON.parse(raw) as Scenario[];
    return Array.isArray(records) ? records.filter((record) => record?.id && record?.situation) : [];
  } catch {
    return [];
  }
}

async function cacheLearningRecords(userId: string, records: Scenario[]): Promise<void> {
  await AsyncStorage.setItem(getCacheKey(userId), JSON.stringify(records));
}

function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Google 로그인 전에는 익명 계정으로 기기별 학습 기록을 분리합니다. */
export async function getLearningUserId(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

export async function loadLearningRecords(userId: string): Promise<Scenario[]> {
  const cached = await loadCachedLearningRecords(userId);
  try {
    const recordsQuery = query(
      collection(db, 'users', userId, RECORDS_COLLECTION),
      orderBy('completedAt', 'desc'),
    );
    const snapshot = await getDocs(recordsQuery);
    const pendingDeletedIds = await getPendingDeletedIds(userId, RECORDS_COLLECTION);
    const remote = snapshot.docs
      .map((item) => item.data().scenario as Scenario)
      .filter((record) => record?.id && record?.situation && !pendingDeletedIds.has(record.id));
    const merged = [...remote, ...cached.filter((record) => !remote.some((remoteRecord) => remoteRecord.id === record.id))]
      .sort((left, right) => (right.completedAt ?? '').localeCompare(left.completedAt ?? ''));
    await cacheLearningRecords(userId, merged);
    return merged;
  } catch (error) {
    console.warn('학습 기록을 서버에서 불러오지 못해 기기 저장본을 사용합니다.', error);
    return cached;
  }
}

export async function saveLearningRecord(userId: string, scenario: Scenario): Promise<void> {
  const completedScenario = withoutUndefined({
    ...scenario,
    completedAt: scenario.completedAt ?? new Date().toISOString(),
  });
  const cached = await loadCachedLearningRecords(userId);
  await cacheLearningRecords(userId, [completedScenario, ...cached.filter((record) => record.id !== completedScenario.id)]);
  await queuePendingSyncOperation({ userId, type: 'save-learning-record', scenario: completedScenario });
  try {
    await waitForRemoteWrite(setDoc(doc(db, 'users', userId, RECORDS_COLLECTION, completedScenario.id), {
      scenario: completedScenario,
      completedAt: completedScenario.completedAt,
      updatedAt: serverTimestamp(),
    }));
    await clearPendingSyncOperation({ userId, type: 'save-learning-record', scenario: completedScenario });
  } catch (error) {
    throw error;
  }
}

export async function deleteLearningRecord(userId: string, scenarioId: string): Promise<void> {
  const cached = await loadCachedLearningRecords(userId);
  await cacheLearningRecords(userId, cached.filter((record) => record.id !== scenarioId));
  await queuePendingSyncOperation({ userId, type: 'delete-learning-record', recordId: scenarioId });
  try {
    await waitForRemoteWrite(deleteDoc(doc(db, 'users', userId, RECORDS_COLLECTION, scenarioId)));
    await clearPendingSyncOperation({ userId, type: 'delete-learning-record', recordId: scenarioId });
  } catch (error) {
    throw error;
  }
}

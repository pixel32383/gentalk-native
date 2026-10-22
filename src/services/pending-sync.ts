import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteDoc, deleteField, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { DailySentence, DailySentencePlans, LearningProgress, Scenario } from '@/types/learning';
import type { UserProfile } from '@/firebase/user-profile';
import type { DailySentenceSettings } from '@/services/daily-sentence-settings';
import type { VoiceSettings } from '@/services/voice-settings';
import { db } from '@/firebase/firebase';
import { waitForRemoteWrite } from '@/services/remote-write';

type PendingSyncInput =
  | { userId: string; type: 'save-learning-record'; scenario: Scenario }
  | { userId: string; type: 'delete-learning-record'; recordId: string }
  | { userId: string; type: 'save-in-progress-learning'; progress: LearningProgress }
  | { userId: string; type: 'delete-in-progress-learning'; progressId: string }
  | { userId: string; type: 'save-daily-sentence'; sentence: DailySentence }
  | { userId: string; type: 'delete-daily-sentence'; sentenceId: string }
  | { userId: string; type: 'save-user-profile'; profile: UserProfile }
  | { userId: string; type: 'save-daily-sentence-plans'; plans: DailySentencePlans }
  | { userId: string; type: 'save-daily-sentence-settings'; settings: DailySentenceSettings }
  | { userId: string; type: 'save-voice-settings'; settings: VoiceSettings };

type PendingSyncOperation = PendingSyncInput & { key: string; operationId: string };

const STORAGE_KEY = '@gentalk/pending-sync/v1';
let pendingMutationQueue: Promise<void> = Promise.resolve();

function operationKey(operation: PendingSyncInput) {
  switch (operation.type) {
    case 'save-learning-record':
      return `${operation.userId}:learningRecords:${operation.scenario.id}`;
    case 'delete-learning-record':
      return `${operation.userId}:learningRecords:${operation.recordId}`;
    case 'save-in-progress-learning':
      return `${operation.userId}:inProgressLearning:${operation.progress.id}`;
    case 'delete-in-progress-learning':
      return `${operation.userId}:inProgressLearning:${operation.progressId}`;
    case 'save-daily-sentence':
      return `${operation.userId}:dailySentences:${operation.sentence.id}`;
    case 'delete-daily-sentence':
      return `${operation.userId}:dailySentences:${operation.sentenceId}`;
    case 'save-user-profile':
      return `${operation.userId}:profile:profile`;
    case 'save-daily-sentence-plans':
      return `${operation.userId}:dailySentencePlans`;
    case 'save-daily-sentence-settings':
      return `${operation.userId}:dailySentenceSettings`;
    case 'save-voice-settings':
      return `${operation.userId}:voiceSettings`;
  }
}

async function loadPendingOperations(): Promise<PendingSyncOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const operations = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(operations)) return [];
    return operations.map((operation, index) => ({
      ...operation,
      operationId: operation.operationId ?? `legacy:${index}:${operation.key}`,
    })) as PendingSyncOperation[];
  } catch {
    return [];
  }
}

async function savePendingOperations(operations: PendingSyncOperation[]) {
  if (operations.length === 0) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
}

function updatePendingOperations(
  updater: (operations: PendingSyncOperation[]) => PendingSyncOperation[],
) {
  const task = pendingMutationQueue.then(async () => {
    const operations = await loadPendingOperations();
    await savePendingOperations(updater(operations));
  });
  pendingMutationQueue = task.catch(() => undefined);
  return task;
}

/** Keeps only the newest change for each document, so an offline save/delete cannot conflict. */
export async function queuePendingSyncOperation(operation: PendingSyncInput) {
  const key = operationKey(operation);
  const operationId = `${Date.now()}:${Math.random()}`;
  await updatePendingOperations((operations) => [
    ...operations.filter((item) => item.key !== key),
    { ...operation, key, operationId } as PendingSyncOperation,
  ]);
  return operationId;
}

/** A completed older write must never remove a newer queued change to the same document. */
export async function clearPendingSyncOperation(operationId: string) {
  await updatePendingOperations((operations) => operations.filter((item) => item.operationId !== operationId));
}

export async function getPendingSyncOperations(userId: string): Promise<PendingSyncInput[]> {
  await pendingMutationQueue;
  return (await loadPendingOperations()).filter((item) => item.userId === userId);
}

async function syncOperation(operation: PendingSyncOperation) {
  switch (operation.type) {
    case 'save-learning-record': {
      const scenario = operation.scenario;
      await waitForRemoteWrite(setDoc(doc(db, 'users', operation.userId, 'learningRecords', scenario.id), {
        scenario,
        completedAt: scenario.completedAt,
        updatedAt: serverTimestamp(),
      }));
      return;
    }
    case 'delete-learning-record':
      await waitForRemoteWrite(deleteDoc(doc(db, 'users', operation.userId, 'learningRecords', operation.recordId)));
      return;
    case 'save-in-progress-learning': {
      const progress = operation.progress;
      await waitForRemoteWrite(setDoc(doc(db, 'users', operation.userId, 'inProgressLearning', progress.id), {
        progress,
        updatedAt: progress.updatedAt,
        serverUpdatedAt: serverTimestamp(),
      }));
      return;
    }
    case 'delete-in-progress-learning':
      await waitForRemoteWrite(deleteDoc(doc(db, 'users', operation.userId, 'inProgressLearning', operation.progressId)));
      return;
    case 'save-daily-sentence': {
      const sentence = operation.sentence;
      await waitForRemoteWrite(setDoc(doc(db, 'users', operation.userId, 'dailySentences', sentence.id), {
        sentence,
        savedAt: sentence.savedAt,
        updatedAt: serverTimestamp(),
      }));
      return;
    }
    case 'delete-daily-sentence':
      await waitForRemoteWrite(deleteDoc(doc(db, 'users', operation.userId, 'dailySentences', operation.sentenceId)));
      return;
    case 'save-user-profile':
      await waitForRemoteWrite(setDoc(doc(db, 'users', operation.userId), {
        profile: { ...operation.profile, phone: deleteField() },
        profileUpdatedAt: serverTimestamp(),
      }, { merge: true }));
      return;
    case 'save-daily-sentence-plans':
      await waitForRemoteWrite(setDoc(doc(db, 'users', operation.userId), {
        dailySentencePlans: operation.plans,
        dailySentencePlansUpdatedAt: serverTimestamp(),
      }, { merge: true }));
      return;
    case 'save-daily-sentence-settings':
      await waitForRemoteWrite(setDoc(doc(db, 'users', operation.userId), {
        dailySentenceSettings: operation.settings,
        dailySentenceSettingsUpdatedAt: serverTimestamp(),
      }, { merge: true }));
      return;
    case 'save-voice-settings':
      await waitForRemoteWrite(setDoc(doc(db, 'users', operation.userId), {
        voiceSettings: operation.settings,
        voiceSettingsUpdatedAt: serverTimestamp(),
      }, { merge: true }));
  }
}

/** Retries queued changes in order. Stops at the first failure and keeps the remaining changes safe on-device. */
export async function flushPendingSync(userId: string) {
  await pendingMutationQueue;
  const operations = await loadPendingOperations();
  let syncedCount = 0;

  for (const operation of operations.filter((item) => item.userId === userId)) {
    try {
      await syncOperation(operation);
      await updatePendingOperations((current) => current.filter((item) => item.operationId !== operation.operationId));
      syncedCount += 1;
    } catch {
      break;
    }
  }

  return syncedCount;
}

export async function clearPendingSyncForUser(userId: string) {
  await updatePendingOperations((operations) => operations.filter((item) => item.userId !== userId));
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { DailySentence, DailySentencePlans } from '@/types/learning';
import { db } from '@/firebase/firebase';
import { clearPendingSyncOperation, getPendingSyncOperations, queuePendingSyncOperation } from '@/services/pending-sync';
import { waitForRemoteWrite } from '@/services/remote-write';

const PLAN_DAYS = 14;

function localDateKey(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function cacheKey(userId: string) {
  return `@gentalk/daily-sentence-plans/${userId}`;
}

function normalizePlans(value: unknown): DailySentencePlans {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const plans: DailySentencePlans = {};
  for (const [date, ids] of Object.entries(value as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(ids)) continue;
    plans[date] = [...new Set(ids.filter((id): id is string => typeof id === 'string'))].slice(0, 3);
  }
  return plans;
}

export function getTodayPlanDate() {
  return localDateKey();
}

/** 오늘은 고정하고 이후 13일은 복습 우선순위와 최근 배정 이력을 기준으로 채웁니다. */
export function buildDailySentencePlans(
  sentences: DailySentence[],
  count: number,
  existingPlans: DailySentencePlans,
  startDate = localDateKey(),
) {
  const desiredCount = Math.max(1, Math.min(3, count, sentences.length));
  const validIds = new Set(sentences.map((sentence) => sentence.id));
  const nextPlans: DailySentencePlans = Object.fromEntries(
    Object.entries(existingPlans)
      .filter(([date]) => date >= addDays(startDate, -1))
      .map(([date, ids]) => [date, ids.filter((id) => validIds.has(id))]),
  );

  const lastScheduledDate = (sentenceId: string, beforeDate: string) => Object.entries(nextPlans)
    .filter(([date, ids]) => date < beforeDate && ids.includes(sentenceId))
    .map(([date]) => date)
    .sort()
    .at(-1) ?? '';

  for (let offset = 0; offset < PLAN_DAYS; offset += 1) {
    const date = addDays(startDate, offset);
    const previousIds = new Set(nextPlans[addDays(date, -1)] ?? []);
    const selected = [...new Set(nextPlans[date] ?? [])].slice(0, desiredCount);
    const available = sentences.filter((sentence) => !selected.includes(sentence.id));
    const preferred = available.filter((sentence) => !previousIds.has(sentence.id));
    const candidates = preferred.length >= desiredCount - selected.length ? preferred : available;
    candidates.sort((left, right) => {
      const lastDifference = lastScheduledDate(left.id, date).localeCompare(lastScheduledDate(right.id, date));
      if (lastDifference) return lastDifference;
      return left.savedAt.localeCompare(right.savedAt);
    });
    nextPlans[date] = [...selected, ...candidates.slice(0, desiredCount - selected.length).map((sentence) => sentence.id)];
  }
  return nextPlans;
}

export function getPlanSentences(sentences: DailySentence[], plans: DailySentencePlans, date = localDateKey()) {
  const byId = new Map(sentences.map((sentence) => [sentence.id, sentence]));
  return (plans[date] ?? []).map((id) => byId.get(id)).filter((sentence): sentence is DailySentence => Boolean(sentence));
}

export async function loadDailySentencePlans(userId: string): Promise<DailySentencePlans> {
  let cached: DailySentencePlans = {};
  try { cached = normalizePlans(JSON.parse(await AsyncStorage.getItem(cacheKey(userId)) ?? '{}')); } catch { /* use remote or empty plans */ }
  const pending = (await getPendingSyncOperations(userId)).find((item) => item.type === 'save-daily-sentence-plans');
  if (pending?.type === 'save-daily-sentence-plans') return pending.plans;
  try {
    const snapshot = await getDoc(doc(db, 'users', userId));
    const data = snapshot.data();
    if (data && Object.hasOwn(data, 'dailySentencePlans')) {
      const remote = normalizePlans(data.dailySentencePlans);
      await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(remote));
      return remote;
    }
  } catch { /* offline cache remains usable */ }
  return cached;
}

export async function saveDailySentencePlans(userId: string, plans: DailySentencePlans) {
  const cleanPlans = normalizePlans(plans);
  await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(cleanPlans));
  const operationId = await queuePendingSyncOperation({ userId, type: 'save-daily-sentence-plans', plans: cleanPlans });
  await waitForRemoteWrite(setDoc(doc(db, 'users', userId), {
    dailySentencePlans: cleanPlans,
    dailySentencePlansUpdatedAt: serverTimestamp(),
  }, { merge: true }));
  await clearPendingSyncOperation(operationId);
}

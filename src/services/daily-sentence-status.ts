import type { DailySentence } from '@/types/learning';

export function getLocalMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isDailySentenceCompletedInMonth(sentence: DailySentence, month: string) {
  return Boolean(sentence.completedMonths?.[month] || sentence.completedOn?.startsWith(`${month}-`));
}

export function setDailySentenceMonthCompleted(
  sentence: DailySentence,
  month: string,
  completed: boolean,
  completionDate: string,
): DailySentence {
  const completedMonths = { ...sentence.completedMonths };
  if (sentence.completedOn) {
    const previousMonth = sentence.completedOn.slice(0, 7);
    completedMonths[previousMonth] ??= sentence.completedOn;
  }
  if (completed) completedMonths[month] = completionDate;
  else delete completedMonths[month];

  const updatedSentence: DailySentence = { ...sentence, completedMonths };
  delete updatedSentence.completedOn;
  return updatedSentence;
}

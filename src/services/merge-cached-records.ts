export type PendingRecordChange<T> =
  | { type: 'save'; record: T }
  | { type: 'delete'; id: string };

/** Remote data wins by default; only an explicitly queued local change overrides it. */
export function mergeCachedRecords<T extends { id: string }>(
  remote: T[],
  cached: T[],
  pendingChanges: PendingRecordChange<T>[],
): T[] {
  const records = new Map(remote.map((record) => [record.id, record]));
  for (const record of cached) {
    if (!records.has(record.id)) records.set(record.id, record);
  }
  for (const change of pendingChanges) {
    if (change.type === 'delete') records.delete(change.id);
    else records.set(change.record.id, change.record);
  }
  return [...records.values()];
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeCachedRecords } from '../src/services/merge-cached-records.ts';

test('remote record wins when there is no unsent local change', () => {
  const result = mergeCachedRecords(
    [{ id: 'a', text: 'server' }],
    [{ id: 'a', text: 'old cache' }],
    [],
  );
  assert.deepEqual(result, [{ id: 'a', text: 'server' }]);
});

test('an unsent local save remains visible over an older server version', () => {
  const result = mergeCachedRecords(
    [{ id: 'a', text: 'server' }],
    [{ id: 'a', text: 'local' }],
    [{ type: 'save', record: { id: 'a', text: 'local' } }],
  );
  assert.deepEqual(result, [{ id: 'a', text: 'local' }]);
});

test('an unsent delete removes both server and cached copies', () => {
  const result = mergeCachedRecords(
    [{ id: 'a', text: 'server' }],
    [{ id: 'a', text: 'cached' }, { id: 'b', text: 'keep' }],
    [{ type: 'delete', id: 'a' }],
  );
  assert.deepEqual(result, [{ id: 'b', text: 'keep' }]);
});

test('existing cached-only data is retained for legacy users', () => {
  const result = mergeCachedRecords(
    [{ id: 'a', text: 'server' }],
    [{ id: 'b', text: 'cached-only' }],
    [],
  );
  assert.deepEqual(result, [{ id: 'a', text: 'server' }, { id: 'b', text: 'cached-only' }]);
});

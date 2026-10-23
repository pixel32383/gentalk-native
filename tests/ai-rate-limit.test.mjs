import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { enforceAiRateLimit } from '../src/services/server/ai-rate-limit.ts';

const originalFetch = globalThis.fetch;
const originalMode = process.env.NODE_ENV;
const originalBypass = process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS;

beforeEach(() => {
  process.env.NODE_ENV = 'production';
  delete process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalMode === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalMode;
  if (originalBypass === undefined) delete process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS;
  else process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS = originalBypass;
});

function request(enabled = false, authenticated = true) {
  return new Request('https://api.example.com/api/conversation', {
    headers: {
      'X-Gentalk-Dev-Rate-Limit': enabled ? 'on' : 'off',
      ...(authenticated ? { Authorization: 'Bearer test-token', 'X-Firebase-UID': 'test-user' } : {}),
    },
  });
}

test('test server still requires authentication with limits off', async () => {
  process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS = 'true';
  globalThis.fetch = () => { throw new Error('Must not reach storage'); };
  assert.equal((await enforceAiRateLimit(request(false, false), 'conversation')).status, 401);
});

test('test server checks profile ownership without reserving quota', async () => {
  process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS = 'true';
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.ok(url.endsWith('/users/test-user'));
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return new Response(null, { status: 200 });
  };
  assert.equal(await enforceAiRateLimit(request(), 'conversation'), null);
  assert.equal(calls, 1);
});

test('authenticated guest without a profile can use the test bypass', async () => {
  process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS = 'true';
  globalThis.fetch = async () => new Response(null, { status: 404 });
  assert.equal(await enforceAiRateLimit(request(), 'vocabulary'), null);
});

test('invalid token or a different UID cannot use the bypass', async () => {
  process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS = 'true';
  for (const status of [401, 403]) {
    globalThis.fetch = async () => new Response(null, { status });
    assert.equal((await enforceAiRateLimit(request(), 'conversation')).status, 401);
  }
});

test('test bypass fails closed when ownership cannot be checked', async () => {
  process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS = 'true';
  globalThis.fetch = async () => new Response(null, { status: 503 });
  assert.equal((await enforceAiRateLimit(request(), 'feedback')).status, 503);
});

test('normal server retains quota even if the caller sends off', async () => {
  globalThis.fetch = async (url) => {
    assert.ok(url.includes('/apiUsage/daily-'));
    return Response.json({ fields: { total: { integerValue: '240' } } });
  };
  assert.equal((await enforceAiRateLimit(request(), 'conversation')).status, 429);
});

test('turning limits on in the test build enforces quota again', async () => {
  process.env.ALLOW_PREVIEW_RATE_LIMIT_BYPASS = 'true';
  globalThis.fetch = async (url) => {
    assert.ok(url.includes('/apiUsage/daily-'));
    return Response.json({ fields: { total: { integerValue: '240' } } });
  };
  assert.equal((await enforceAiRateLimit(request(true), 'conversation')).status, 429);
});

function dailyFields(counts) {
  return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, { integerValue: String(value) }]));
}

for (const [kind, limit] of [['vocabulary', 20], ['conversation', 200], ['feedback', 20]]) {
  test(`${kind} allows request ${limit} and blocks the following request`, async () => {
    let count = limit - 1;
    globalThis.fetch = async (url, options = {}) => {
      if (url.includes('/apiUsage/daily-')) {
        if (options.method === 'PATCH') {
          const fields = JSON.parse(options.body).fields;
          count = Number(fields[kind].integerValue);
          assert.equal(count, limit);
          return new Response(null, { status: 200 });
        }
        return Response.json({ fields: dailyFields({ total: count, [kind]: count }), updateTime: 'test-update-time' });
      }
      if (options.method === 'POST') {
        assert.ok(url.includes('documentId=minute-'));
        return new Response(null, { status: 200 });
      }
      assert.ok(url.includes('/apiUsage/minute-'));
      return new Response(null, { status: 404 });
    };
    assert.equal(await enforceAiRateLimit(request(true), kind), null);
    assert.equal((await enforceAiRateLimit(request(true), kind)).status, 429);
  });
}

test('minute limit allows request 8 and blocks request 9', async () => {
  let minuteCount = 7;
  globalThis.fetch = async (url, options = {}) => {
    if (url.includes('/apiUsage/daily-')) {
      if (options.method === 'PATCH') return new Response(null, { status: 200 });
      return Response.json({ fields: dailyFields({ total: 1, conversation: 1 }), updateTime: 'daily-update-time' });
    }
    assert.ok(url.includes('/apiUsage/minute-'));
    if (options.method === 'PATCH') {
      minuteCount = Number(JSON.parse(options.body).fields.count.integerValue);
      assert.equal(minuteCount, 8);
      return new Response(null, { status: 200 });
    }
    return Response.json({ fields: dailyFields({ count: minuteCount }), updateTime: 'minute-update-time' });
  };
  assert.equal(await enforceAiRateLimit(request(true), 'conversation'), null);
  assert.equal((await enforceAiRateLimit(request(true), 'conversation')).status, 429);
});

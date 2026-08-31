type AiRequestKind = 'vocabulary' | 'conversation' | 'feedback';

type DailyUsage = {
  total: number;
  vocabulary: number;
  conversation: number;
  feedback: number;
  updateTime?: string;
};

type MinuteUsage = { count: number; updateTime?: string };

const LIMITS: Record<AiRequestKind | 'total' | 'minute', number> = {
  vocabulary: 10,
  conversation: 100,
  feedback: 10,
  total: 120,
  minute: 6,
};

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'gentalk-595d2';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-UID',
};

export function apiJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function getApiIdentity(request: Request) {
  const authorization = request.headers.get('authorization');
  const userId = request.headers.get('x-firebase-uid');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  return token && userId ? { token, userId } : null;
}

function dayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function minuteKey(now = new Date()) {
  return now.toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
}

function usageDocumentUrl(userId: string, id: string) {
  return `${BASE_URL}/users/${encodeURIComponent(userId)}/apiUsage/${encodeURIComponent(id)}`;
}

function fields(values: Record<string, string | number>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [
    key,
    typeof value === 'number' ? { integerValue: String(value) } : { stringValue: value },
  ]));
}

function readNumber(source: Record<string, { integerValue?: string }> | undefined, key: string) {
  return Number(source?.[key]?.integerValue ?? 0);
}

async function getDocument<T>(url: string, token: string, parse: (fields: Record<string, { integerValue?: string }> | undefined, updateTime?: string) => T) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('QUOTA_STORAGE_UNAVAILABLE');
  const data = await response.json() as { fields?: Record<string, { integerValue?: string }>; updateTime?: string };
  return parse(data.fields, data.updateTime);
}

async function createDocument(url: string, token: string, values: Record<string, string | number>) {
  const [parent, documentId] = url.split('/apiUsage/');
  const response = await fetch(`${parent}/apiUsage?documentId=${encodeURIComponent(documentId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: fields(values) }),
  });
  return response.status === 409 ? 'conflict' : response.ok ? 'ok' : 'error';
}

async function updateDocument(url: string, token: string, updateTime: string, values: Record<string, string | number>) {
  const response = await fetch(`${url}?currentDocument.updateTime=${encodeURIComponent(updateTime)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: fields(values) }),
  });
  return response.status === 409 ? 'conflict' : response.ok ? 'ok' : 'error';
}

async function reserveMinute(userId: string, token: string) {
  const minute = minuteKey();
  const url = usageDocumentUrl(userId, `minute-${minute}`);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await getDocument<MinuteUsage>(url, token, (saved, updateTime) => ({ count: readNumber(saved, 'count'), updateTime }));
    if (!current) {
      const created = await createDocument(url, token, { kind: 'minute', minute, userId, count: 1 });
      if (created === 'ok') return true;
      if (created === 'conflict') continue;
      throw new Error('QUOTA_STORAGE_UNAVAILABLE');
    }
    if (current.count >= LIMITS.minute) return false;
    const updated = await updateDocument(url, token, current.updateTime!, { kind: 'minute', minute, userId, count: current.count + 1 });
    if (updated === 'ok') return true;
    if (updated !== 'conflict') throw new Error('QUOTA_STORAGE_UNAVAILABLE');
  }
  return false;
}

async function reserveDaily(userId: string, token: string, kind: AiRequestKind) {
  const date = dayKey();
  const url = usageDocumentUrl(userId, `daily-${date}`);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await getDocument<DailyUsage>(url, token, (saved, updateTime) => ({
      total: readNumber(saved, 'total'),
      vocabulary: readNumber(saved, 'vocabulary'),
      conversation: readNumber(saved, 'conversation'),
      feedback: readNumber(saved, 'feedback'),
      updateTime,
    }));
    if (!current) {
      const created = await createDocument(url, token, {
        kind: 'daily', date, userId, total: 1,
        vocabulary: kind === 'vocabulary' ? 1 : 0,
        conversation: kind === 'conversation' ? 1 : 0,
        feedback: kind === 'feedback' ? 1 : 0,
      });
      if (created === 'ok') return true;
      if (created === 'conflict') continue;
      throw new Error('QUOTA_STORAGE_UNAVAILABLE');
    }

    if (current.total >= LIMITS.total || current[kind] >= LIMITS[kind]) return false;
    const updated = await updateDocument(url, token, current.updateTime!, {
      kind: 'daily', date, userId,
      total: current.total + 1,
      vocabulary: current.vocabulary + (kind === 'vocabulary' ? 1 : 0),
      conversation: current.conversation + (kind === 'conversation' ? 1 : 0),
      feedback: current.feedback + (kind === 'feedback' ? 1 : 0),
    });
    if (updated === 'ok') return true;
    if (updated !== 'conflict') throw new Error('QUOTA_STORAGE_UNAVAILABLE');
  }
  return false;
}

/** Reserves an AI request before the OpenAI call. Fails closed when quota storage is unavailable. */
export async function enforceAiRateLimit(request: Request, kind: AiRequestKind): Promise<Response | null> {
  const identity = getApiIdentity(request);
  if (!identity) return apiJson({ error: '로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.' }, 401);

  try {
    const withinDailyLimit = await reserveDaily(identity.userId, identity.token, kind);
    if (!withinDailyLimit) return apiJson({ error: '오늘의 AI 학습 요청 한도에 도달했습니다. 내일 다시 이용해주세요.' }, 429);

    const withinMinuteLimit = await reserveMinute(identity.userId, identity.token);
    if (!withinMinuteLimit) return apiJson({ error: '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' }, 429);
    return null;
  } catch {
    return apiJson({ error: 'AI 요청 확인 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.' }, 503);
  }
}

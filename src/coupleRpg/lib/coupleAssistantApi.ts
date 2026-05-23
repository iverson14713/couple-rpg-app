import { parseDateItineraryPlan, type DateItineraryPlan } from './dateItineraryAiModel';
import { parseImportantDatePlan, type ImportantDatePlan } from './importantDateAiModel';
import { aiQuotaExhaustedMessage } from './aiUsageLimits';
import { loveQuestApiUrl } from './loveQuestApiOrigin';

export type CoupleAssistantAuth = {
  userId: string;
  accessToken: string;
  coupleId?: string | null;
};

/** Local assistant API (see `npm run dev:server`). */
export const COUPLE_ASSISTANT_DEV_BASE = 'http://127.0.0.1:8788';

export type CoupleAssistantEndpoint = 'date-itinerary' | 'important-date';

export type CoupleAssistantSuccess = {
  answer: string;
  dailyLimit?: number;
  dailyUsed?: number;
  dailyRemaining?: number;
};

export type DateItineraryAssistantSuccess = CoupleAssistantSuccess & {
  plan: DateItineraryPlan;
};

export type ImportantDateAssistantSuccess = CoupleAssistantSuccess & {
  plan: ImportantDatePlan;
};

type CoupleAssistantErrorBody = {
  error?: string;
  code?: string;
  detail?: string;
};

/**
 * Dev on localhost → direct 8788. Dev on LAN/custom host → Vite proxy `/api/...`.
 * Production → same-origin `/api/assistant/...`.
 */
export function resolveLoveQuestQuotaUrl(): string {
  const absolute = loveQuestApiUrl('/api/assistant/lovequest-quota');
  if (absolute.startsWith('http')) {
    return absolute;
  }

  if (import.meta.env.PROD) {
    return absolute;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return absolute;
    }
  }
  return `${COUPLE_ASSISTANT_DEV_BASE}/api/assistant/lovequest-quota`;
}

export function resolveCoupleAssistantUrl(endpoint: CoupleAssistantEndpoint): string {
  const path = `/api/assistant/${endpoint}`;
  const absolute = loveQuestApiUrl(path);
  if (absolute.startsWith('http')) {
    return absolute;
  }

  if (import.meta.env.PROD) {
    return absolute;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return absolute;
    }
  }

  return `${COUPLE_ASSISTANT_DEV_BASE}${path}`;
}

export function todayUsageDateYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function errorMessageZh(
  body: CoupleAssistantErrorBody,
  status: number,
  requestUrl: string,
  networkDetail?: string
): string {
  const code = body.code;
  if (code === 'NO_API_KEY') {
    return '助理服務尚未設定 API 金鑰，請確認專案根目錄 .env 的 OPENAI_API_KEY。';
  }
  if (code === 'AUTH_REQUIRED' || code === 'AUTH_INVALID') {
    return body.error?.trim() || '請先登入後再使用 AI';
  }
  if (code === 'SUPABASE_NOT_CONFIGURED') {
    return body.error?.trim() || '雲端 AI 額度尚未設定';
  }
  if (code === 'QUOTA') {
    return body.error?.trim() || aiQuotaExhaustedMessage(false);
  }
  if (code === 'RATE') {
    return '請求太頻繁，請稍候約一分鐘再試。';
  }
  if (code === 'OPENAI') {
    const detail = body.detail?.trim();
    return detail
      ? `AI 服務暫時無法回應，請稍後再試。（${detail}）`
      : 'AI 服務暫時無法回應，請稍後再試。';
  }
  if (status === 0) {
    const net = networkDetail?.trim();
    return net
      ? `無法連線到助理服務（${net}）。請確認已執行 npm run dev，且可連線：${requestUrl}`
      : `無法連線到助理服務。請確認已執行 npm run dev，且可連線：${requestUrl}`;
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    const detail = body.detail?.trim();
    return detail ? `${body.error.trim()}（${detail}）` : body.error.trim();
  }
  if (networkDetail?.trim()) {
    return networkDetail.trim();
  }
  return `請求失敗（HTTP ${status}）`;
}

function nonJsonResponseDetail(res: Response): string | undefined {
  const ct = (res.headers.get('content-type') ?? '').toLowerCase();
  if (res.status === 200 && ct.includes('text/html')) {
    return '收到網頁而非 API 回應。iOS 請重新執行 npm run build:ios（原生 App 需連線遠端助理 API）。';
  }
  if (res.status === 200) {
    return '無法解析 API 回應，請稍後再試。';
  }
  return undefined;
}

function assistantPostBody(prompt: string, auth: CoupleAssistantAuth) {
  return {
    prompt,
    usageDate: todayUsageDateYmd(),
    userId: auth.userId,
    accessToken: auth.accessToken,
    coupleId: auth.coupleId ?? undefined,
  };
}

export async function postCoupleAssistant(
  endpoint: CoupleAssistantEndpoint,
  prompt: string,
  auth: CoupleAssistantAuth
): Promise<{ ok: true; data: CoupleAssistantSuccess } | { ok: false; message: string; code?: string }> {
  const url = resolveCoupleAssistantUrl(endpoint);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(assistantPostBody(prompt, auth)),
    });
  } catch (e) {
    const networkDetail = e instanceof Error ? e.message : String(e);
    return { ok: false, message: errorMessageZh({}, 0, url, networkDetail) };
  }

  let body: CoupleAssistantSuccess & CoupleAssistantErrorBody;
  try {
    body = (await res.json()) as CoupleAssistantSuccess & CoupleAssistantErrorBody;
  } catch {
    return {
      ok: false,
      message: errorMessageZh({}, res.status, url, nonJsonResponseDetail(res)),
    };
  }

  if (!res.ok) {
    return { ok: false, message: errorMessageZh(body, res.status, url), code: body.code };
  }

  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  if (!answer) {
    return { ok: false, message: 'AI 未回傳內容，請再試一次。' };
  }

  return {
    ok: true,
    data: {
      answer,
      dailyLimit: body.dailyLimit,
      dailyUsed: body.dailyUsed,
      dailyRemaining: body.dailyRemaining,
    },
  };
}

type DateItineraryApiBody = CoupleAssistantSuccess &
  CoupleAssistantErrorBody & {
    itinerary?: unknown;
  };

/** Date itinerary — returns structured plan for card UI. */
export async function postDateItineraryAssistant(
  prompt: string,
  auth: CoupleAssistantAuth
): Promise<{ ok: true; data: DateItineraryAssistantSuccess } | { ok: false; message: string; code?: string }> {
  const url = resolveCoupleAssistantUrl('date-itinerary');
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(assistantPostBody(prompt, auth)),
    });
  } catch (e) {
    const networkDetail = e instanceof Error ? e.message : String(e);
    return { ok: false, message: errorMessageZh({}, 0, url, networkDetail) };
  }

  let body: DateItineraryApiBody;
  try {
    body = (await res.json()) as DateItineraryApiBody;
  } catch {
    return {
      ok: false,
      message: errorMessageZh({}, res.status, url, nonJsonResponseDetail(res)),
    };
  }

  if (!res.ok) {
    return { ok: false, message: errorMessageZh(body, res.status, url), code: body.code };
  }

  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  const itineraryField =
    body.itinerary && typeof body.itinerary === 'object' ? body.itinerary : undefined;
  const parsed = parseDateItineraryPlan(answer, itineraryField);
  if (!parsed) {
    return { ok: false, message: 'AI 回傳格式無法解析，請再試一次。' };
  }

  return {
    ok: true,
    data: {
      answer: answer || parsed.title,
      plan: parsed,
      dailyLimit: body.dailyLimit,
      dailyUsed: body.dailyUsed,
      dailyRemaining: body.dailyRemaining,
    },
  };
}

type ImportantDateApiBody = CoupleAssistantSuccess &
  CoupleAssistantErrorBody & {
    plan?: unknown;
  };

/** Important date reminders — structured plan for card UI. */
export async function postImportantDateAssistant(
  prompt: string,
  auth: CoupleAssistantAuth
): Promise<{ ok: true; data: ImportantDateAssistantSuccess } | { ok: false; message: string; code?: string }> {
  const url = resolveCoupleAssistantUrl('important-date');
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(assistantPostBody(prompt, auth)),
    });
  } catch (e) {
    const networkDetail = e instanceof Error ? e.message : String(e);
    return { ok: false, message: errorMessageZh({}, 0, url, networkDetail) };
  }

  let body: ImportantDateApiBody;
  try {
    body = (await res.json()) as ImportantDateApiBody;
  } catch {
    return {
      ok: false,
      message: errorMessageZh({}, res.status, url, nonJsonResponseDetail(res)),
    };
  }

  if (!res.ok) {
    return { ok: false, message: errorMessageZh(body, res.status, url), code: body.code };
  }

  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  const planField = body.plan && typeof body.plan === 'object' ? body.plan : undefined;
  const parsed = parseImportantDatePlan(answer, planField);
  if (!parsed) {
    return { ok: false, message: 'AI 回傳格式無法解析，請再試一次。' };
  }

  return {
    ok: true,
    data: {
      answer: answer || parsed.title,
      plan: parsed,
      dailyLimit: body.dailyLimit,
      dailyUsed: body.dailyUsed,
      dailyRemaining: body.dailyRemaining,
    },
  };
}

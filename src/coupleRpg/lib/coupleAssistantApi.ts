import { getOrCreateClientId } from '../../aiClient';
import { parseDateItineraryPlan, type DateItineraryPlan } from './dateItineraryAiModel';

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

type CoupleAssistantErrorBody = {
  error?: string;
  code?: string;
  detail?: string;
};

/**
 * Dev on localhost → direct 8788. Dev on LAN/custom host → Vite proxy `/api/...`.
 * Production → same-origin `/api/assistant/...`.
 */
export function resolveCoupleAssistantUrl(endpoint: CoupleAssistantEndpoint): string {
  const path = `/api/assistant/${endpoint}`;
  if (import.meta.env.PROD) {
    return path;
  }

  const override = import.meta.env.VITE_ASSISTANT_SERVER_URL?.trim().replace(/\/$/, '');
  if (override) {
    return `${override}${path}`;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return path;
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
  if (code === 'QUOTA') {
    return '今日 AI 次數已用完，請明天再試或升級 Pro。';
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
  return `請求失敗（HTTP ${status}）`;
}

export async function postCoupleAssistant(
  endpoint: CoupleAssistantEndpoint,
  prompt: string,
  plan: 'free' | 'pro'
): Promise<{ ok: true; data: CoupleAssistantSuccess } | { ok: false; message: string }> {
  const url = resolveCoupleAssistantUrl(endpoint);
  console.log('calling assistant api', url);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: getOrCreateClientId(),
        usageDate: todayUsageDateYmd(),
        plan,
        prompt,
      }),
    });
  } catch (e) {
    const networkDetail = e instanceof Error ? e.message : String(e);
    return { ok: false, message: errorMessageZh({}, 0, url, networkDetail) };
  }

  let body: CoupleAssistantSuccess & CoupleAssistantErrorBody;
  try {
    body = (await res.json()) as CoupleAssistantSuccess & CoupleAssistantErrorBody;
  } catch {
    return { ok: false, message: errorMessageZh({}, res.status, url) };
  }

  if (!res.ok) {
    return { ok: false, message: errorMessageZh(body, res.status, url) };
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
  plan: 'free' | 'pro'
): Promise<{ ok: true; data: DateItineraryAssistantSuccess } | { ok: false; message: string }> {
  const url = resolveCoupleAssistantUrl('date-itinerary');
  console.log('calling assistant api', url);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: getOrCreateClientId(),
        usageDate: todayUsageDateYmd(),
        plan,
        prompt,
      }),
    });
  } catch (e) {
    const networkDetail = e instanceof Error ? e.message : String(e);
    return { ok: false, message: errorMessageZh({}, 0, url, networkDetail) };
  }

  let body: DateItineraryApiBody;
  try {
    body = (await res.json()) as DateItineraryApiBody;
  } catch {
    return { ok: false, message: errorMessageZh({}, res.status, url) };
  }

  if (!res.ok) {
    return { ok: false, message: errorMessageZh(body, res.status, url) };
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

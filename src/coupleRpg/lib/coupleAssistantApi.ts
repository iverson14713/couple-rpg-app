import { getOrCreateClientId } from '../../aiClient';

/** Local dev assistant API (see `npm run dev:server`). Production uses same-origin Vercel routes. */
export const COUPLE_ASSISTANT_DEV_BASE = 'http://127.0.0.1:8788';

function coupleAssistantBase(): string {
  if (typeof window === 'undefined') return COUPLE_ASSISTANT_DEV_BASE;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return COUPLE_ASSISTANT_DEV_BASE;
  return '';
}

export type CoupleAssistantEndpoint = 'date-itinerary' | 'important-date';

export type CoupleAssistantSuccess = {
  answer: string;
  dailyLimit?: number;
  dailyUsed?: number;
  dailyRemaining?: number;
};

type CoupleAssistantErrorBody = {
  error?: string;
  code?: string;
  detail?: string;
};

export function todayUsageDateYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function errorMessageZh(body: CoupleAssistantErrorBody, status: number): string {
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
    return 'AI 服務暫時無法回應，請稍後再試。';
  }
  if (status === 0) {
    return '無法連線到助理服務，請確認已執行 npm run dev（會啟動 127.0.0.1:8788）。';
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error.trim();
  }
  return `請求失敗（${status}）`;
}

export async function postCoupleAssistant(
  endpoint: CoupleAssistantEndpoint,
  prompt: string,
  plan: 'free' | 'pro'
): Promise<{ ok: true; data: CoupleAssistantSuccess } | { ok: false; message: string }> {
  const url = `${coupleAssistantBase()}/api/assistant/${endpoint}`;
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
  } catch {
    return { ok: false, message: errorMessageZh({}, 0) };
  }

  let body: CoupleAssistantSuccess & CoupleAssistantErrorBody;
  try {
    body = (await res.json()) as CoupleAssistantSuccess & CoupleAssistantErrorBody;
  } catch {
    return { ok: false, message: errorMessageZh({}, res.status) };
  }

  if (!res.ok) {
    return { ok: false, message: errorMessageZh(body, res.status) };
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

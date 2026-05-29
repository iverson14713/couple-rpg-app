import { COUPLE_ASSISTANT_DEV_BASE } from './coupleAssistantApi';
import { loveQuestApiUrl } from './loveQuestApiOrigin';

export type AccountDeleteAuth = {
  userId: string;
  accessToken: string;
};

type AccountDeleteErrorBody = {
  error?: string;
  code?: string;
  detail?: string;
};

export function resolveAccountDeleteUrl(): string {
  const path = '/api/account/delete';
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

function errorMessageZh(body: AccountDeleteErrorBody, status: number, networkDetail?: string): string {
  const code = body.code;
  if (code === 'CONFIRMATION_REQUIRED') {
    return body.error?.trim() || '請輸入 DELETE 以確認刪除帳號';
  }
  if (code === 'AUTH_REQUIRED' || code === 'AUTH_INVALID') {
    return body.error?.trim() || '請先登入後再刪除帳號';
  }
  if (code === 'SUPABASE_NOT_CONFIGURED') {
    return body.error?.trim() || '帳號刪除服務尚未設定，請聯絡客服';
  }
  if (code === 'AUTH_DELETE_FAILED' || code === 'DELETE_FAILED') {
    return body.error?.trim() || '刪除帳號失敗，請稍後再試或聯絡客服';
  }
  if (status === 0) {
    const net = networkDetail?.trim();
    return net
      ? `無法連線到伺服器（${net}）。請確認網路後再試。`
      : '無法連線到伺服器，請確認網路後再試。';
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error.trim();
  }
  return `刪除帳號失敗（HTTP ${status}）`;
}

export async function postDeleteAccount(
  auth: AccountDeleteAuth
): Promise<{ ok: true; message: string } | { ok: false; message: string; code?: string }> {
  const url = resolveAccountDeleteUrl();
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({
        confirmation: 'DELETE',
        userId: auth.userId,
        accessToken: auth.accessToken,
      }),
    });
  } catch (e) {
    const networkDetail = e instanceof Error ? e.message : String(e);
    return { ok: false, message: errorMessageZh({}, 0, networkDetail) };
  }

  let body: AccountDeleteErrorBody & { ok?: boolean; message?: string };
  try {
    body = (await res.json()) as AccountDeleteErrorBody & { ok?: boolean; message?: string };
  } catch {
    return { ok: false, message: errorMessageZh({}, res.status) };
  }

  if (!res.ok) {
    return { ok: false, message: errorMessageZh(body, res.status), code: body.code };
  }

  const message =
    typeof body.message === 'string' && body.message.trim()
      ? body.message.trim()
      : '帳號已永久刪除';

  return { ok: true, message };
}

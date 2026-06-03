import { resolveLoveQuestApiEndpoint } from './loveQuestApiOrigin';

export type PromoRedeemAuth = {
  userId: string;
  accessToken: string;
};

type PromoRedeemBody = {
  ok?: boolean;
  message?: string;
  grantedUntil?: string;
  error?: string;
  code?: string;
};

const PROMO_REDEEM_PATH = '/api/promo/redeem';

export function resolvePromoRedeemUrl(): string {
  return resolveLoveQuestApiEndpoint(PROMO_REDEEM_PATH);
}

function errorMessageZh(
  body: PromoRedeemBody,
  status: number,
  networkDetail?: string
): string {
  const code = body.code;

  if (code === 'AUTH_REQUIRED') {
    return '請先登入後再兌換';
  }
  if (code === 'AUTH_INVALID') {
    return body.error?.trim() || '登入已過期，請重新登入';
  }
  if (code === 'CODE_NOT_FOUND') {
    return '兌換碼不存在';
  }
  if (code === 'ALREADY_REDEEMED') {
    return '這組兌換碼已經使用過';
  }
  if (code === 'CODE_INACTIVE') {
    return body.error?.trim() || '兌換碼已停用';
  }
  if (code === 'CODE_EXPIRED') {
    return body.error?.trim() || '兌換碼已過期';
  }
  if (code === 'CODE_EXHAUSTED') {
    return body.error?.trim() || '兌換碼已達使用上限';
  }

  if (status === 0) {
    if (networkDetail?.trim()) {
      console.warn('[promo] network error:', networkDetail.trim());
    }
    return '網路連線失敗，請確認網路後再試';
  }
  if (status === 404) {
    return '兌換服務找不到（404），請稍後再試';
  }
  if (status >= 500) {
    return '伺服器暫時無法處理，請稍後再試';
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error.trim();
  }
  return `兌換失敗（HTTP ${status}）`;
}

export async function postPromoRedeem(
  auth: PromoRedeemAuth,
  code: string
): Promise<
  | { ok: true; message: string; grantedUntil: string }
  | { ok: false; message: string; code?: string }
> {
  const endpoint = resolvePromoRedeemUrl();
  console.log('[promo] redeem endpoint:', endpoint);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({
        code,
        userId: auth.userId,
        accessToken: auth.accessToken,
      }),
    });
  } catch (e) {
    const networkDetail = e instanceof Error ? e.message : String(e);
    return { ok: false, message: errorMessageZh({}, 0, networkDetail) };
  }

  let body: PromoRedeemBody;
  try {
    body = (await res.json()) as PromoRedeemBody;
  } catch {
    if (res.status === 404) {
      return { ok: false, message: errorMessageZh({}, 404) };
    }
    if (res.status >= 500) {
      return { ok: false, message: errorMessageZh({}, res.status) };
    }
    return { ok: false, message: errorMessageZh({}, res.status) };
  }

  if (!res.ok || !body.ok) {
    return { ok: false, message: errorMessageZh(body, res.status), code: body.code };
  }

  const grantedUntil =
    typeof body.grantedUntil === 'string' && body.grantedUntil.trim()
      ? body.grantedUntil.trim()
      : '';

  const message =
    typeof body.message === 'string' && body.message.trim()
      ? body.message.trim()
      : '兌換成功';

  if (!grantedUntil) {
    return { ok: false, message: '兌換回應不完整，請重新整理方案' };
  }

  return { ok: true, message, grantedUntil };
}

export function formatPromoGrantedUntilZh(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

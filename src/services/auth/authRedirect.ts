import { authLog, isAuthNativeClient } from './authDebug';

const RETURN_KEY = 'lq_auth_return';

/** Must match capacitor.config.ts `server.hostname` */
export const CAPACITOR_AUTH_ORIGIN = 'https://lovequest.app';

/** Custom URL scheme fallback when OAuth opens system browser (Info.plist URL Types) */
export const CAPACITOR_AUTH_SCHEME_CALLBACK = 'com.lovequest.app://auth/callback';

/** Email 確認信等導回（WebView / 通用連結，須列入 Supabase Redirect URLs） */
export function getAuthCallbackUrl(): string {
  if (typeof window === 'undefined') return '/auth/callback';
  if (isAuthNativeClient()) {
    return `${CAPACITOR_AUTH_ORIGIN}/auth/callback`;
  }
  return `${window.location.origin}/auth/callback`;
}

/**
 * OAuth 導回：原生用 custom scheme（外部瀏覽器完成後喚回 App）；
 * Web 用目前網域 /auth/callback。
 */
export function getOAuthRedirectUrl(): string {
  if (typeof window === 'undefined') return '/auth/callback';
  const url = isAuthNativeClient()
    ? CAPACITOR_AUTH_SCHEME_CALLBACK
    : `${window.location.origin}/auth/callback`;
  authLog('getOAuthRedirectUrl', { url, isNative: isAuthNativeClient() });
  return url;
}

/** 登入前儲存路徑，callback 成功後導回（預設首頁） */
export function saveAuthReturnPath(path?: string): void {
  if (typeof window === 'undefined') return;
  const next = path ?? `${window.location.pathname}${window.location.search}`;
  const safe = next.startsWith('/auth') ? '/' : next || '/';
  try {
    sessionStorage.setItem(RETURN_KEY, safe);
  } catch {
    /* ignore quota */
  }
}

export function consumeAuthReturnPath(): string {
  if (typeof window === 'undefined') return '/';
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    if (!raw || raw.startsWith('/auth')) return '/';
    return raw;
  } catch {
    return '/';
  }
}

export function redirectAfterAuthSuccess(delayMs = 1200): void {
  const target = consumeAuthReturnPath();
  window.setTimeout(() => {
    window.location.replace(target);
  }, delayMs);
}

/** 清除 callback URL 上的 token / code，避免留在瀏覽紀錄 */
export function scrubAuthCallbackUrl(): void {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname || '/auth/callback';
  window.history.replaceState({}, document.title, path);
}

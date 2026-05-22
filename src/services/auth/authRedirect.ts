import { Capacitor } from '@capacitor/core';

const RETURN_KEY = 'lq_auth_return';

/** Must match capacitor.config.ts `server.hostname` */
export const CAPACITOR_AUTH_ORIGIN = 'https://lovequest.app';

/** Custom URL scheme fallback when OAuth opens system browser (Info.plist URL Types) */
export const CAPACITOR_AUTH_SCHEME_CALLBACK = 'com.lovequest.app://auth/callback';

/** OAuth / Email 確認信導回此路徑（須列入 Supabase Redirect URLs） */
export function getAuthCallbackUrl(): string {
  if (typeof window === 'undefined') return '/auth/callback';
  if (Capacitor.isNativePlatform()) {
    return `${CAPACITOR_AUTH_ORIGIN}/auth/callback`;
  }
  return `${window.location.origin}/auth/callback`;
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

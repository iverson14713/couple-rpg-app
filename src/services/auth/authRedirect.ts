import type { SupabaseClient } from '@supabase/supabase-js';
import { authLog, isAuthNativeClient } from './authDebug';
import { isWithinAuthGracePeriod } from './authGrace';
import { notifyAuthSessionSync } from './authRoute';
import { recoverAuthSession, waitForPersistedSession } from './authSession';

const RETURN_KEY = 'lq_auth_return';

/** Must match capacitor.config.ts `server.hostname` */
export const CAPACITOR_AUTH_ORIGIN = 'https://lovequest.app';

/**
 * iOS custom URL scheme (Info.plist CFBundleURLSchemes).
 * Use a short scheme without dots — Safari may not open `com.bundle.id://` from OAuth.
 */
export const NATIVE_OAUTH_URL_SCHEME = 'lovequest';

/** Native OAuth redirect — must match Supabase Redirect URLs exactly. */
export const CAPACITOR_AUTH_SCHEME_CALLBACK = `${NATIVE_OAUTH_URL_SCHEME}://auth/callback`;

/** Previous scheme (detect only); remove from Supabase after migration. */
export const LEGACY_NATIVE_OAUTH_URL_SCHEME = 'com.lovequest.app';

export const LEGACY_CAPACITOR_AUTH_SCHEME_CALLBACK = `${LEGACY_NATIVE_OAUTH_URL_SCHEME}://auth/callback`;

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

/** SPA 導回（不整頁 reload，保留 SupabaseAuthProvider 內的 session 狀態） */
export function navigateAfterAuthSuccess(target: string): void {
  const path = target.startsWith('/') ? target : `/${target}`;
  window.history.replaceState({}, document.title, path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  authLog('navigateAfterAuthSuccess', { path });
}

/**
 * 等待 session 寫入後再導回遊戲（修正第一次 OAuth 回來仍顯示未登入）。
 */
export async function redirectAfterAuthSuccess(
  client: SupabaseClient,
  delayMs = 400,
  knownSession?: import('@supabase/supabase-js').Session | null
): Promise<void> {
  let session = await waitForPersistedSession(client, { knownSession: knownSession ?? null });

  if (!session?.access_token && isWithinAuthGracePeriod()) {
    session = await recoverAuthSession(client, {
      knownSession: knownSession ?? null,
      attempts: 3,
      intervalMs: 500,
      allowRefresh: false,
    });
    authLog('auth.redirect.success_without_wait_timeout', {
      hasSession: Boolean(session?.access_token),
      inGrace: true,
    });
    notifyAuthSessionSync('redirectAfterAuthSuccess.grace');
  } else if (session?.access_token) {
    notifyAuthSessionSync('redirectAfterAuthSuccess');
  } else {
    authLog('redirectAfterAuthSuccess.no_session', { inGrace: isWithinAuthGracePeriod() });
    if (isWithinAuthGracePeriod()) {
      authLog('auth.redirect.success_without_wait_timeout', { hasSession: false, inGrace: true });
      notifyAuthSessionSync('redirectAfterAuthSuccess.grace_navigate');
    }
  }

  try {
    sessionStorage.setItem('lq_skip_splash_once', '1');
  } catch {
    /* ignore */
  }
  const target = consumeAuthReturnPath();
  if (delayMs > 0) {
    await new Promise((r) => setTimeout(r, delayMs));
  }
  navigateAfterAuthSuccess(target);
}

/** 清除 callback URL 上的 token / code，避免留在瀏覽紀錄 */
export function scrubAuthCallbackUrl(): void {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname || '/auth/callback';
  window.history.replaceState({}, document.title, path);
}

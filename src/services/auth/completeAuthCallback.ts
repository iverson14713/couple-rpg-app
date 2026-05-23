import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js';
import { authLog } from './authDebug';
import { mapOAuthCallbackError } from './authErrors';
import { markPkceCodeExchanged, wasPkceCodeExchanged } from './authCallbackLock';
import { consumeOAuthProvider, peekOAuthProvider } from './oauthSessionHint';
import { waitForPersistedSession } from './authSession';

export type AuthCallbackFlow = 'email' | 'oauth' | 'unknown';

export type AuthCallbackOutcome =
  | { ok: true; flow: AuthCallbackFlow }
  | { ok: false; message: string };

function parseHash(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.hash.replace(/^#/, ''));
}

function parseSearch(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function detectLang(): 'zh' | 'en' {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function flowFromType(type: string | null): AuthCallbackFlow {
  if (!type) return 'unknown';
  const t = type.toLowerCase();
  if (t === 'signup' || t === 'email' || t === 'invite' || t === 'magiclink') return 'email';
  if (t === 'recovery') return 'email';
  return 'oauth';
}

function logCallbackUrlState(phase: string): void {
  const hash = parseHash();
  const search = parseSearch();
  authLog(`AuthCallbackPage.${phase}`, {
    href: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    hasCode: Boolean(search.get('code') || hash.get('code')),
    codeLength: (search.get('code') || hash.get('code') || '').length,
    error: search.get('error') || hash.get('error') || search.get('error_code'),
    error_description:
      search.get('error_description') || hash.get('error_description') || search.get('error_message'),
    type: search.get('type') || hash.get('type'),
  });
}

/** 處理 Supabase 回傳的 PKCE、Email OTP、implicit hash session */
export async function completeAuthCallback(
  client: SupabaseClient
): Promise<AuthCallbackOutcome> {
  const lang = detectLang();
  const pendingAppleCallback = peekOAuthProvider() === 'apple';
  if (pendingAppleCallback) {
    authLog('apple.callback', { phase: 'AuthCallbackPage.start' });
  }
  logCallbackUrlState('start');

  const hash = parseHash();
  const search = parseSearch();

  const existing = await client.auth.getSession();
  if (existing.error) {
    authLog('AuthCallbackPage.getSession.initial.error', { message: existing.error.message });
    return { ok: false, message: existing.error.message };
  }
  if (existing.data.session?.access_token) {
    authLog('AuthCallbackPage.getSession.initial.ok', {
      userId: existing.data.session.user.id,
      skipExchange: true,
    });
    return { ok: true, flow: flowFromType(search.get('type') || hash.get('type')) };
  }

  const errCode = search.get('error') || hash.get('error') || search.get('error_code');
  const errDesc =
    search.get('error_description') || hash.get('error_description') || search.get('error_message');
  if (errCode || errDesc) {
    authLog('AuthCallbackPage.oauth_error_params', { errCode, errDesc });
    if (pendingAppleCallback && consumeOAuthProvider() === 'apple') {
      authLog('apple.callback', { phase: 'oauth_error', errCode, errDesc });
    }
    return {
      ok: false,
      message: mapOAuthCallbackError(errCode, errDesc, lang),
    };
  }

  const tokenHash = search.get('token_hash');
  const otpType = (search.get('type') || hash.get('type')) as EmailOtpType | null;
  if (tokenHash && otpType) {
    authLog('AuthCallbackPage.verifyOtp', { otpType });
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (error) {
      authLog('AuthCallbackPage.verifyOtp.error', { message: error.message });
      return { ok: false, message: error.message };
    }
    return { ok: true, flow: flowFromType(otpType) };
  }

  const code = search.get('code');
  if (code) {
    if (wasPkceCodeExchanged(code)) {
      authLog('AuthCallbackPage.exchangeCodeForSession.skip', { reason: 'already_exchanged' });
      const session = await waitForPersistedSession(client);
      if (!session) {
        return {
          ok: false,
          message:
            lang === 'zh'
              ? '登入碼已使用，請再試一次 Google 登入。'
              : 'Sign-in code already used. Please try Google sign-in again.',
        };
      }
      return { ok: true, flow: 'oauth' };
    }
    authLog('AuthCallbackPage.exchangeCodeForSession', { codeLength: code.length });
    markPkceCodeExchanged(code);
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      authLog('AuthCallbackPage.exchangeCodeForSession.error', { message: error.message });
      return { ok: false, message: error.message };
    }
    if (!data.session) {
      const session = await waitForPersistedSession(client);
      if (!session) {
        return {
          ok: false,
          message:
            lang === 'zh'
              ? '登入兌換成功但 session 尚未就緒，請再試一次。'
              : 'Sign-in exchanged but session is not ready yet. Please try again.',
        };
      }
    }
    authLog('AuthCallbackPage.exchangeCodeForSession.ok', {
      userId: data.session?.user.id ?? (await client.auth.getSession()).data.session?.user.id,
    });
    if (pendingAppleCallback && consumeOAuthProvider() === 'apple') {
      authLog('apple.callback', { phase: 'exchangeCodeForSession.ok' });
    }
    return { ok: true, flow: 'oauth' };
  }

  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (accessToken && refreshToken) {
    authLog('AuthCallbackPage.setSession.hash', {});
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      authLog('AuthCallbackPage.setSession.error', { message: error.message });
      return { ok: false, message: error.message };
    }
    await waitForPersistedSession(client);
    return { ok: true, flow: flowFromType(hash.get('type')) };
  }

  const first = await client.auth.getSession();
  if (first.error) {
    authLog('AuthCallbackPage.getSession.error', { message: first.error.message });
    return { ok: false, message: first.error.message };
  }
  if (first.data.session) {
    authLog('AuthCallbackPage.getSession.ok', { immediate: true });
    return { ok: true, flow: flowFromType(search.get('type') || hash.get('type')) };
  }

  await new Promise((r) => setTimeout(r, 500));
  const second = await client.auth.getSession();
  if (second.error) {
    authLog('AuthCallbackPage.getSession.retry.error', { message: second.error.message });
    return { ok: false, message: second.error.message };
  }
  if (second.data.session) {
    authLog('AuthCallbackPage.getSession.retry.ok', {});
    return { ok: true, flow: flowFromType(search.get('type') || hash.get('type')) };
  }

  authLog('AuthCallbackPage.no_session', {});
  return {
    ok: false,
    message:
      lang === 'zh'
        ? '無法完成登入：網址上沒有 code／token，且尚未建立 session。請查看 Xcode Console 的 [LQ_AUTH] 日誌。'
        : 'Could not finish sign-in: no code/token in URL and no session. Check Xcode Console [LQ_AUTH] logs.',
  };
}

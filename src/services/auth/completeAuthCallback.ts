import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js';
import { mapOAuthCallbackError } from './authErrors';

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

/** 處理 Supabase 回傳的 PKCE、Email OTP、implicit hash session */
export async function completeAuthCallback(
  client: SupabaseClient
): Promise<AuthCallbackOutcome> {
  const lang = detectLang();
  const hash = parseHash();
  const search = parseSearch();

  const errCode = search.get('error') || hash.get('error') || search.get('error_code');
  const errDesc =
    search.get('error_description') || hash.get('error_description') || search.get('error_message');
  if (errCode || (errDesc && /error|denied|expired|invalid/i.test(errDesc))) {
    return {
      ok: false,
      message: mapOAuthCallbackError(errCode, errDesc, lang),
    };
  }

  const tokenHash = search.get('token_hash');
  const otpType = (search.get('type') || hash.get('type')) as EmailOtpType | null;
  if (tokenHash && otpType) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (error) {
      return { ok: false, message: mapOAuthCallbackError(error.message, null, lang) };
    }
    return { ok: true, flow: flowFromType(otpType) };
  }

  const code = search.get('code');
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      return { ok: false, message: mapOAuthCallbackError(error.message, null, lang) };
    }
    return { ok: true, flow: 'oauth' };
  }

  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      return { ok: false, message: mapOAuthCallbackError(error.message, null, lang) };
    }
    return { ok: true, flow: flowFromType(hash.get('type')) };
  }

  const first = await client.auth.getSession();
  if (first.error) {
    return { ok: false, message: mapOAuthCallbackError(first.error.message, null, lang) };
  }
  if (first.data.session) {
    return { ok: true, flow: flowFromType(search.get('type') || hash.get('type')) };
  }

  await new Promise((r) => setTimeout(r, 500));
  const second = await client.auth.getSession();
  if (second.error) {
    return { ok: false, message: mapOAuthCallbackError(second.error.message, null, lang) };
  }
  if (second.data.session) {
    return { ok: true, flow: flowFromType(search.get('type') || hash.get('type')) };
  }

  return {
    ok: false,
    message: lang === 'zh' ? '無法完成登入，請回到 App 再試一次。' : 'Could not finish sign-in. Go back to the app and try again.',
  };
}

import type { SupabaseClient } from '@supabase/supabase-js';
import { authLog, isAuthNativeClient } from './authDebug';
import { getOAuthRedirectUrl, saveAuthReturnPath } from './authRedirect';
import { markOAuthProvider } from './oauthSessionHint';
import { openOAuthInExternalBrowser } from './oauthNative';

export type AppleSignInResult =
  | { ok: true; signedIn: false; message: 'redirecting' | 'coming_soon' }
  | { ok: false; signedIn: false; message: string; code?: 'coming_soon' | 'web' | 'failed' };

export const APPLE_SIGN_IN_FAILED_ZH = 'Apple 登入失敗，請稍後再試或改用 Email 登入';
export const APPLE_SIGN_IN_FAILED_EN =
  'Apple sign-in failed. Please try again later or use email sign-in.';

export function getAppleSignInUserErrorMessage(lang: 'zh' | 'en' = 'zh'): string {
  return lang === 'zh' ? APPLE_SIGN_IN_FAILED_ZH : APPLE_SIGN_IN_FAILED_EN;
}

/**
 * iOS/Android 正式包：啟用 Apple OAuth（.env.capacitor 或 VITE_APPLE_OAUTH_ENABLED=true）。
 */
export function isAppleOAuthEnabled(): boolean {
  if (import.meta.env.VITE_APPLE_OAUTH_ENABLED === 'true') return true;
  return import.meta.env.MODE === 'capacitor' && isAuthNativeClient();
}

/** iOS / Android 原生殼：顯示 Apple 登入按鈕 */
export function isAppleSignInNativeUi(): boolean {
  return isAuthNativeClient();
}

/** Web：不支援原生 Apple OAuth */
export function isAppleSignInWebComingSoon(): boolean {
  return !isAuthNativeClient();
}

export function isAppleSignInAvailable(supabase?: SupabaseClient | null): boolean {
  return isAppleSignInNativeUi() && isAppleOAuthEnabled() && Boolean(supabase);
}

/** 正式版 UI 是否顯示 Apple 登入（原生 App 一律顯示） */
export function shouldShowAppleSignInButton(): boolean {
  return isAppleSignInNativeUi();
}

/**
 * Apple OAuth — 與 Google 相同：原生外部瀏覽器 + redirectTo lovequest://auth/callback
 */
export async function signInWithAppleOAuth(
  supabase: SupabaseClient,
  lang: 'zh' | 'en' = 'zh'
): Promise<{ error: Error | null }> {
  const userError = getAppleSignInUserErrorMessage(lang);
  saveAuthReturnPath();
  const isNative = isAuthNativeClient();
  const redirectTo = getOAuthRedirectUrl();

  authLog('apple.click', {
    isNative,
    redirectTo,
    skipBrowserRedirect: isNative,
    providerEnabled: isAppleOAuthEnabled(),
  });

  if (!isNative) {
    return { error: new Error('web_not_supported') };
  }

  if (!isAppleOAuthEnabled()) {
    authLog('apple.disabled', { reason: 'provider_flag' });
    return { error: new Error('apple_not_enabled') };
  }

  markOAuthProvider('apple');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: 'name email',
    },
  });

  authLog('apple.response', {
    hasError: Boolean(error),
    errorMessage: error?.message ?? null,
    hasUrl: Boolean(data?.url),
    oauthUrl: data?.url ?? null,
  });

  if (error) {
    authLog('apple.oauth_error', { message: error.message });
    return { error: new Error(userError) };
  }
  if (!data?.url) {
    authLog('apple.no_url', {});
    return { error: new Error(userError) };
  }

  try {
    await openOAuthInExternalBrowser(data.url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'oauth_cancelled') {
      authLog('apple.oauth_cancelled', {});
      return { error: new Error('oauth_cancelled') };
    }
    authLog('apple.oauth_session_error', { message: msg });
    return { error: new Error(userError) };
  }

  return { error: null };
}

export async function handleAppleSignIn(
  supabase?: SupabaseClient | null,
  lang: 'zh' | 'en' = 'zh'
): Promise<AppleSignInResult> {
  const userError = getAppleSignInUserErrorMessage(lang);

  if (!supabase) {
    return { ok: false, signedIn: false, message: userError, code: 'failed' };
  }

  if (isAppleSignInWebComingSoon()) {
    return { ok: true, signedIn: false, message: 'coming_soon', code: 'web' };
  }

  const { error } = await signInWithAppleOAuth(supabase, lang);
  if (error) {
    if (error.message === 'web_not_supported') {
      return { ok: true, signedIn: false, message: 'coming_soon', code: 'web' };
    }
    return { ok: false, signedIn: false, message: userError, code: 'failed' };
  }

  return { ok: true, signedIn: false, message: 'redirecting' };
}

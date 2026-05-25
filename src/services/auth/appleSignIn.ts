import { Capacitor } from '@capacitor/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import LoveQuestAppleSignIn from '../../native/loveQuestAppleSignIn';
import { authLog, isAuthNativeClient } from './authDebug';
import { getOAuthRedirectUrl, redirectAfterAuthSuccess, saveAuthReturnPath } from './authRedirect';
import { markOAuthProvider } from './oauthSessionHint';
import { openOAuthInExternalBrowser } from './oauthNative';

export type AppleSignInResult =
  | { ok: true; signedIn: boolean; message: 'redirecting' | 'coming_soon' | 'cancelled' }
  | { ok: false; signedIn: false; message: string; code?: 'coming_soon' | 'web' | 'failed' };

export const APPLE_SIGN_IN_FAILED_ZH = 'Apple 登入失敗，請稍後再試或改用 Email 登入';
export const APPLE_SIGN_IN_FAILED_EN =
  'Apple sign-in failed. Please try again later or use email sign-in.';

export function getAppleSignInUserErrorMessage(lang: 'zh' | 'en' = 'zh'): string {
  return lang === 'zh' ? APPLE_SIGN_IN_FAILED_ZH : APPLE_SIGN_IN_FAILED_EN;
}

/**
 * iOS/Android 正式包：啟用 Apple 登入（.env.capacitor 或 VITE_APPLE_OAUTH_ENABLED=true）。
 */
export function isAppleOAuthEnabled(): boolean {
  if (import.meta.env.VITE_APPLE_OAUTH_ENABLED === 'true') return true;
  return import.meta.env.MODE === 'capacitor' && isAuthNativeClient();
}

/** iOS / Android 原生殼：顯示 Apple 登入按鈕 */
export function isAppleSignInNativeUi(): boolean {
  return isAuthNativeClient();
}

/** Web：不支援原生 Apple 登入 */
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

function isIosNative(): boolean {
  return isAuthNativeClient() && Capacitor.getPlatform() === 'ios';
}

/**
 * iOS：ASAuthorizationAppleIDProvider → Supabase signInWithIdToken.
 */
export async function signInWithAppleNative(
  supabase: SupabaseClient,
  lang: 'zh' | 'en' = 'zh'
): Promise<{ error: Error | null; signedIn?: boolean }> {
  const userError = getAppleSignInUserErrorMessage(lang);
  saveAuthReturnPath('/');

  authLog('apple.native.click', { platform: Capacitor.getPlatform() });

  if (!isAppleOAuthEnabled()) {
    authLog('apple.disabled', { reason: 'provider_flag' });
    return { error: new Error('apple_not_enabled') };
  }

  try {
    const { identityToken } = await LoveQuestAppleSignIn.signIn();
    authLog('apple.native.token', { tokenLength: identityToken.length });

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
    });

    authLog('apple.native.signInWithIdToken', {
      hasError: Boolean(error),
      errorMessage: error?.message ?? null,
      hasSession: Boolean(data?.session),
    });

    if (error) {
      authLog('apple.native.supabase_error', { message: error.message });
      return { error: new Error(userError) };
    }
    if (!data?.session) {
      authLog('apple.native.no_session', {});
      return { error: new Error(userError) };
    }

    await redirectAfterAuthSuccess(supabase);
    authLog('apple.native.success', { userId: data.session.user.id });
    return { error: null, signedIn: true };
  } catch (e) {
    const pluginErr = e as Error & { code?: string };
    const code = pluginErr?.code ?? '';
    const msg = pluginErr?.message ?? String(e);

    authLog('apple.native.error', { message: msg, code });

    if (code === 'CANCELED') {
      return { error: new Error('oauth_cancelled') };
    }

    return { error: new Error(userError) };
  }
}

/**
 * Android：Web OAuth + 外部瀏覽器 + lovequest:// callback（與 Google 相同模式）。
 */
export async function signInWithAppleOAuth(
  supabase: SupabaseClient,
  lang: 'zh' | 'en' = 'zh'
): Promise<{ error: Error | null }> {
  const userError = getAppleSignInUserErrorMessage(lang);
  saveAuthReturnPath();
  const isNative = isAuthNativeClient();
  const redirectTo = getOAuthRedirectUrl();

  authLog('apple.oauth.click', {
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

/** 依平台選擇原生 Apple（iOS）或 Web OAuth（Android）。 */
export async function signInWithApple(
  supabase: SupabaseClient,
  lang: 'zh' | 'en' = 'zh'
): Promise<{ error: Error | null; signedIn?: boolean }> {
  if (isIosNative()) {
    return signInWithAppleNative(supabase, lang);
  }
  const { error } = await signInWithAppleOAuth(supabase, lang);
  return { error };
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
    return { ok: true, signedIn: false, message: 'coming_soon' };
  }

  const { error, signedIn } = await signInWithApple(supabase, lang);
  if (error) {
    if (error.message === 'web_not_supported') {
      return { ok: true, signedIn: false, message: 'coming_soon' };
    }
    if (error.message === 'oauth_cancelled') {
      return { ok: true, signedIn: false, message: 'cancelled' };
    }
    return { ok: false, signedIn: false, message: userError, code: 'failed' };
  }

  if (signedIn) {
    return { ok: true, signedIn: true, message: 'redirecting' };
  }

  return { ok: true, signedIn: false, message: 'redirecting' };
}

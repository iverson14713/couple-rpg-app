import type { SupabaseClient } from '@supabase/supabase-js';
import { authLog, isAuthNativeClient } from './authDebug';
import { getOAuthRedirectUrl, saveAuthReturnPath } from './authRedirect';
import { markOAuthProvider } from './oauthSessionHint';
import { openOAuthInExternalBrowser } from './oauthNative';

export type AppleSignInResult =
  | { ok: true; signedIn: false; message: 'redirecting' | 'coming_soon' }
  | { ok: false; signedIn: false; message: string; code?: 'coming_soon' | 'provider_not_ready' | 'web' };

/** Supabase Apple Provider 已設定並啟用前端開關 */
export function isAppleOAuthEnabled(): boolean {
  return import.meta.env.VITE_APPLE_OAUTH_ENABLED === 'true';
}

/** iOS / Android 原生殼：顯示 Apple 登入按鈕 */
export function isAppleSignInNativeUi(): boolean {
  return isAuthNativeClient();
}

/** Web：顯示「即將開放」 */
export function isAppleSignInWebComingSoon(): boolean {
  return !isAuthNativeClient();
}

export function isAppleSignInAvailable(supabase?: SupabaseClient | null): boolean {
  return isAppleSignInNativeUi() && isAppleOAuthEnabled() && Boolean(supabase);
}

export function getAppleProviderNotReadyMessage(lang: 'zh' | 'en' = 'zh'): string {
  if (lang === 'en') {
    return (
      'Sign in with Apple is not ready yet. Enable Apple in Supabase Dashboard → Authentication → Providers, ' +
      'then set VITE_APPLE_OAUTH_ENABLED=true and rebuild the iOS app.'
    );
  }
  return (
    'Apple 登入尚未完成後台設定。請至 Supabase → Authentication → Providers 啟用 Apple，' +
    '並在 .env 設定 VITE_APPLE_OAUTH_ENABLED=true 後重新 build:ios。'
  );
}

function mapAppleOAuthError(message: string, lang: 'zh' | 'en'): string {
  const low = message.toLowerCase();
  if (low.includes('provider') && low.includes('apple') && low.includes('not enabled')) {
    return getAppleProviderNotReadyMessage(lang);
  }
  if (low.includes('invalid_client') || low.includes('client_id')) {
    return lang === 'zh'
      ? 'Apple 登入設定不正確，請確認 Supabase Apple Provider 的 Services ID 與 Secret。'
      : 'Apple sign-in configuration is invalid. Check Supabase Apple Services ID and secret.';
  }
  return message;
}

/**
 * Apple OAuth — 僅 Capacitor 原生走外部瀏覽器；與 Google 相同 callback。
 */
export async function signInWithAppleOAuth(
  supabase: SupabaseClient,
  lang: 'zh' | 'en' = 'zh'
): Promise<{ error: Error | null }> {
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
    return { error: new Error(lang === 'zh' ? 'web_not_supported' : 'web_not_supported') };
  }

  if (!isAppleOAuthEnabled()) {
    return { error: new Error('apple_provider_not_ready') };
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
    return { error: new Error(mapAppleOAuthError(error.message, lang)) };
  }
  if (!data?.url) {
    return {
      error: new Error(
        lang === 'zh' ? '無法取得 Apple 登入網址，請確認 Supabase Apple Provider 已啟用。' : 'Could not get Apple sign-in URL.'
      ),
    };
  }

  try {
    await openOAuthInExternalBrowser(data.url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: new Error(lang === 'zh' ? `無法開啟外部瀏覽器：${msg}` : `Could not open browser: ${msg}`) };
  }

  return { error: null };
}

export async function handleAppleSignIn(
  supabase?: SupabaseClient | null,
  lang: 'zh' | 'en' = 'zh'
): Promise<AppleSignInResult> {
  if (!supabase) {
    return { ok: false, signedIn: false, message: lang === 'zh' ? '雲端登入尚未設定' : 'Cloud sign-in not configured' };
  }

  if (isAppleSignInWebComingSoon()) {
    return { ok: true, signedIn: false, message: 'coming_soon', code: 'web' };
  }

  if (!isAppleOAuthEnabled()) {
    return {
      ok: false,
      signedIn: false,
      message: getAppleProviderNotReadyMessage(lang),
      code: 'provider_not_ready',
    };
  }

  const { error } = await signInWithAppleOAuth(supabase, lang);
  if (error) {
    if (error.message === 'web_not_supported') {
      return { ok: true, signedIn: false, message: 'coming_soon', code: 'web' };
    }
    if (error.message === 'apple_provider_not_ready') {
      return {
        ok: false,
        signedIn: false,
        message: getAppleProviderNotReadyMessage(lang),
        code: 'provider_not_ready',
      };
    }
    return { ok: false, signedIn: false, message: error.message };
  }

  return { ok: true, signedIn: false, message: 'redirecting' };
}

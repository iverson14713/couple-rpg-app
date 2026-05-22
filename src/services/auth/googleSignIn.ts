import type { SupabaseClient } from '@supabase/supabase-js';
import { authLog, isAuthNativeClient, logAuthEnvironment } from './authDebug';
import { getOAuthRedirectUrl, saveAuthReturnPath } from './authRedirect';
import { openOAuthInExternalBrowser } from './oauthNative';

const GOOGLE_QUERY = {
  access_type: 'offline',
  prompt: 'consent',
} as const;

/**
 * Google OAuth — web uses same-window redirect; native opens system browser (not WebView).
 */
export async function signInWithGoogleOAuth(
  supabase: SupabaseClient
): Promise<{ error: Error | null }> {
  saveAuthReturnPath();
  const isNative = isAuthNativeClient();
  const redirectTo = getOAuthRedirectUrl();
  const skipBrowserRedirect = isNative;

  authLog('google.click', {
    isNative,
    redirectTo,
    skipBrowserRedirect,
    branch: isNative ? 'native_external_browser' : 'web_webview_redirect',
  });

  if (isNative) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { ...GOOGLE_QUERY },
      },
    });

    authLog('google.signInWithOAuth.response', {
      hasError: Boolean(error),
      errorMessage: error?.message ?? null,
      hasUrl: Boolean(data?.url),
      oauthUrl: data?.url ?? null,
    });

    if (error) return { error: new Error(error.message) };
    if (!data?.url) {
      return { error: new Error('Google 登入網址取得失敗，請稍後再試。') };
    }

    try {
      await openOAuthInExternalBrowser(data.url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: new Error(`無法開啟外部瀏覽器：${msg}`) };
    }
    return { error: null };
  }

  authLog('google.web.fallback', {
    warning: 'isNative=false，將在 WebView/瀏覽器內 redirect（Google 可能 403）',
    redirectTo,
  });

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { ...GOOGLE_QUERY },
    },
  });
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

/** Call once when auth settings mount on native. */
export function logGoogleAuthSetupChecklist(): void {
  logAuthEnvironment('google.setup.checklist');
}

export const GOOGLE_CONSENT_SCREEN_HINT =
  '若 Google 登入頁仍顯示「Pet Care｜寵物日記」，請至 Google Cloud Console → OAuth consent screen，將應用名稱改為 LoveQuest，並更新圖示與首頁網址。';

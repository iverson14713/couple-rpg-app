import type { SupabaseClient } from '@supabase/supabase-js';
import { getAuthCallbackUrl, saveAuthReturnPath } from './authRedirect';

export type AppleSignInResult = {
  ok: boolean;
  signedIn: boolean;
  message?: string;
};

/** `VITE_APPLE_OAUTH_ENABLED=true` 且 Supabase 已設定 Apple Provider 時啟用 */
export function isAppleOAuthEnabled(): boolean {
  return import.meta.env.VITE_APPLE_OAUTH_ENABLED === 'true';
}

export function isAppleSignInAvailable(supabase?: SupabaseClient | null): boolean {
  return isAppleOAuthEnabled() && Boolean(supabase);
}

export async function signInWithAppleOAuth(
  supabase: SupabaseClient
): Promise<{ error: Error | null }> {
  saveAuthReturnPath();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: getAuthCallbackUrl(),
      scopes: 'name email',
    },
  });
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

/**
 * Apple Sign In — Supabase OAuth when enabled; otherwise「即將開放」不拋錯。
 */
export async function handleAppleSignIn(
  supabase?: SupabaseClient | null
): Promise<AppleSignInResult> {
  if (!isAppleSignInAvailable(supabase) || !supabase) {
    return {
      ok: true,
      signedIn: false,
      message: 'coming_soon',
    };
  }

  const { error } = await signInWithAppleOAuth(supabase);
  if (error) {
    return { ok: false, signedIn: false, message: error.message };
  }
  return { ok: true, signedIn: false, message: 'redirecting' };
}

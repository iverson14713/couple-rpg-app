const OAUTH_PROVIDER_KEY = 'lq_auth_oauth_provider';

export type OAuthProviderHint = 'google' | 'apple';

export function markOAuthProvider(provider: OAuthProviderHint): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider);
  } catch {
    /* ignore */
  }
}

export function peekOAuthProvider(): OAuthProviderHint | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(OAUTH_PROVIDER_KEY);
    return v === 'apple' || v === 'google' ? v : null;
  } catch {
    return null;
  }
}

export function consumeOAuthProvider(): OAuthProviderHint | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(OAUTH_PROVIDER_KEY);
    sessionStorage.removeItem(OAUTH_PROVIDER_KEY);
    return v === 'apple' || v === 'google' ? v : null;
  } catch {
    return null;
  }
}

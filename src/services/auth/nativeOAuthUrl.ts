import {
  CAPACITOR_AUTH_SCHEME_CALLBACK,
  LEGACY_CAPACITOR_AUTH_SCHEME_CALLBACK,
  NATIVE_OAUTH_URL_SCHEME,
} from './authRedirect';

const CALLBACK_PATH = '/auth/callback';

const NATIVE_PROTOCOLS = new Set([
  `${NATIVE_OAUTH_URL_SCHEME}:`,
  'com.lovequest.app:',
]);

/** Whether this URL should open the in-app OAuth callback handler. */
export function isNativeOAuthCallbackUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (NATIVE_PROTOCOLS.has(u.protocol)) return true;
    if (u.pathname === CALLBACK_PATH || u.pathname.endsWith(CALLBACK_PATH)) return true;
    if (u.host === 'auth' && (u.pathname === '/callback' || u.pathname.endsWith('/callback'))) {
      return true;
    }
    return false;
  } catch {
    const lower = url.toLowerCase();
    return (
      lower.startsWith(`${NATIVE_OAUTH_URL_SCHEME}://`) ||
      lower.startsWith('com.lovequest.app://') ||
      lower.includes('auth/callback') ||
      lower.includes('auth%2Fcallback')
    );
  }
}

export function nativeOAuthSchemeChecklist(): string[] {
  return [CAPACITOR_AUTH_SCHEME_CALLBACK, LEGACY_CAPACITOR_AUTH_SCHEME_CALLBACK];
}

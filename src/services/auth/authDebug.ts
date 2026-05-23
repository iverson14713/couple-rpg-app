import { Capacitor } from '@capacitor/core';
import { CAPACITOR_AUTH_SCHEME_CALLBACK, NATIVE_OAUTH_URL_SCHEME } from './authRedirect';
import { nativeOAuthSchemeChecklist } from './nativeOAuthUrl';

const LOG_PREFIX = '[LQ_AUTH]';
const MAX_LOG_LINES = 80;

export type AuthDebugLine = {
  t: string;
  step: string;
  detail?: Record<string, unknown>;
};

const ring: AuthDebugLine[] = [];

function pushLine(step: string, detail?: Record<string, unknown>): void {
  const line: AuthDebugLine = {
    t: new Date().toISOString(),
    step,
    detail,
  };
  ring.push(line);
  if (ring.length > MAX_LOG_LINES) ring.shift();
}

/** Always logs to console (Xcode / Safari Web Inspector). */
export function authLog(step: string, detail?: Record<string, unknown>): void {
  pushLine(step, detail);
  if (detail !== undefined) {
    console.log(LOG_PREFIX, step, detail);
  } else {
    console.log(LOG_PREFIX, step);
  }
}

export function getAuthDebugLines(): AuthDebugLine[] {
  return [...ring];
}

export function clearAuthDebugLines(): void {
  ring.length = 0;
}

/** Reliable native detection for OAuth (Capacitor iOS/Android). */
export function isAuthNativeClient(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android';
  } catch {
    return false;
  }
}

export function getAuthEnvironmentSnapshot(): Record<string, unknown> {
  const isNative = isAuthNativeClient();
  let capacitorPlatform = 'unknown';
  try {
    capacitorPlatform = Capacitor.getPlatform();
  } catch {
    /* ignore */
  }

  const href = typeof window !== 'undefined' ? window.location.href : '';
  let searchKeys: string[] = [];
  let hashKeys: string[] = [];
  let code: string | null = null;
  let oauthError: string | null = null;
  let oauthErrorDescription: string | null = null;

  if (typeof window !== 'undefined') {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    searchKeys = [...search.keys()];
    hashKeys = [...hash.keys()];
    code = search.get('code') || hash.get('code');
    oauthError = search.get('error') || hash.get('error') || search.get('error_code');
    oauthErrorDescription =
      search.get('error_description') || hash.get('error_description') || search.get('error_message');
  }

  return {
    isNative,
    capacitorPlatform,
    capacitorIsNativePlatform: Capacitor.isNativePlatform(),
    windowOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    windowHref: href,
    windowPath: typeof window !== 'undefined' ? window.location.pathname : '',
    expectedSchemeCallback: CAPACITOR_AUTH_SCHEME_CALLBACK,
    nativeOAuthScheme: NATIVE_OAUTH_URL_SCHEME,
    supabaseRedirectUrlsChecklist: [
      ...nativeOAuthSchemeChecklist(),
      'https://couple-rpg-app.vercel.app/auth/callback',
      'https://lovequest.app/auth/callback',
    ],
    infoPlistSchemeNote:
      'Info.plist CFBundleURLSchemes must include lovequest (not com.lovequest.app — dots break Safari OAuth return)',
    callbackSearchKeys: searchKeys,
    callbackHashKeys: hashKeys,
    callbackHasCode: Boolean(code),
    callbackCodeLength: code?.length ?? 0,
    callbackError: oauthError,
    callbackErrorDescription: oauthErrorDescription,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

export function logAuthEnvironment(step = 'environment'): void {
  authLog(step, getAuthEnvironmentSnapshot());
}

/** Mount once at app start on native. */
export function initAuthDebug(): void {
  if (!isAuthNativeClient()) return;
  logAuthEnvironment('init.native');
  try {
    (window as unknown as { __LQ_AUTH_DEBUG__?: unknown }).__LQ_AUTH_DEBUG__ = {
      getLines: getAuthDebugLines,
      getEnv: getAuthEnvironmentSnapshot,
      log: authLog,
    };
  } catch {
    /* ignore */
  }
}

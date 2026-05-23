import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { authLog, isAuthNativeClient } from '../services/auth/authDebug';
import { notifyAuthRouteChange } from '../services/auth/authRoute';
import { peekOAuthProvider } from '../services/auth/oauthSessionHint';

const CALLBACK_PATH = '/auth/callback';

function isAuthCallbackUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.pathname === CALLBACK_PATH || u.pathname.endsWith(CALLBACK_PATH)) return true;
    if (u.host === 'auth' && u.pathname === '/callback') return true;
    if (u.protocol === 'com.lovequest.app:') return true;
    return false;
  } catch {
    return url.includes('auth/callback') || url.includes('auth%2Fcallback');
  }
}

function parseCallbackParams(rawUrl: string): Record<string, string | null> {
  try {
    const u = new URL(rawUrl);
    const search = u.searchParams;
    const hash = new URLSearchParams(u.hash.replace(/^#/, ''));
    return {
      code: search.get('code') || hash.get('code'),
      error: search.get('error') || hash.get('error') || search.get('error_code'),
      error_description:
        search.get('error_description') || hash.get('error_description') || search.get('error_message'),
    };
  } catch {
    return { code: null, error: null, error_description: null };
  }
}

/** Map custom scheme or universal link into in-app /auth/callback (PKCE ?code=, hash tokens). */
function navigateToAuthCallback(rawUrl: string): void {
  const params = parseCallbackParams(rawUrl);
  authLog('navigateToAuthCallback.start', {
    rawUrl,
    ...params,
    beforeHref: window.location.href,
  });
  if (peekOAuthProvider() === 'apple') {
    authLog('apple.callback', { phase: 'appUrlOpen', rawUrl, ...params });
  }

  void import('../services/auth/oauthNative').then(({ closeOAuthBrowserIfOpen }) =>
    closeOAuthBrowserIfOpen()
  );

  try {
    const incoming = new URL(rawUrl);
    const target = new URL(CALLBACK_PATH, window.location.origin);
    incoming.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });
    const hash = incoming.hash?.replace(/^#/, '');
    const path = `${target.pathname}${target.search}${hash ? `#${hash}` : ''}`;
    window.history.replaceState({}, document.title, path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    notifyAuthRouteChange('navigateToAuthCallback');
    authLog('navigateToAuthCallback.done', {
      targetPath: path,
      afterHref: window.location.href,
      dispatchedPopstate: true,
    });
  } catch (e) {
    authLog('navigateToAuthCallback.fallback', {
      error: e instanceof Error ? e.message : String(e),
    });
    try {
      const incoming = new URL(rawUrl);
      const suffix = `${incoming.search || ''}${incoming.hash || ''}`;
      window.location.replace(`${CALLBACK_PATH}${suffix}`);
    } catch {
      window.location.replace(CALLBACK_PATH);
    }
    notifyAuthRouteChange('navigateToAuthCallback.fallback');
  }
}

/**
 * Handles OAuth / email links that open the app via URL scheme (e.g. com.lovequest.app://auth/callback?code=).
 */
export function initCapacitorAuthBridge(): void {
  if (!isAuthNativeClient()) {
    authLog('bridge.skip', { reason: 'not_native' });
    return;
  }

  authLog('bridge.init', {
    message: '監聽 appUrlOpen / getLaunchUrl',
    infoPlistScheme: 'com.lovequest.app',
  });

  void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    authLog('appUrlOpen', {
      url: event?.url ?? null,
      matchesCallback: event?.url ? isAuthCallbackUrl(event.url) : false,
    });
    if (event?.url && isAuthCallbackUrl(event.url)) {
      navigateToAuthCallback(event.url);
    }
  });

  void App.getLaunchUrl().then((launch) => {
    authLog('getLaunchUrl', {
      url: launch?.url ?? null,
      matchesCallback: launch?.url ? isAuthCallbackUrl(launch.url) : false,
    });
    if (launch?.url && isAuthCallbackUrl(launch.url)) {
      navigateToAuthCallback(launch.url);
    }
  });
}

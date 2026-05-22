import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const CALLBACK_PATH = '/auth/callback';

function isAuthCallbackUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.pathname === CALLBACK_PATH || u.pathname.endsWith(CALLBACK_PATH)) return true;
    if (u.host === 'auth' && u.pathname === '/callback') return true;
    return false;
  } catch {
    return url.includes('auth/callback') || url.includes('auth%2Fcallback');
  }
}

/** Map custom scheme or universal link into in-app /auth/callback (PKCE ?code=, hash tokens). */
function navigateToAuthCallback(rawUrl: string): void {
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
  } catch {
    window.location.replace(CALLBACK_PATH);
  }
}

/**
 * Handles OAuth / email links that open the app via URL scheme (e.g. com.lovequest.app://auth/callback?code=).
 * In-WebView redirects to https://lovequest.app/auth/callback are handled by Root without this bridge.
 */
export function initCapacitorAuthBridge(): void {
  if (!Capacitor.isNativePlatform()) return;

  void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    if (event?.url && isAuthCallbackUrl(event.url)) {
      navigateToAuthCallback(event.url);
    }
  });

  void App.getLaunchUrl().then((launch) => {
    if (launch?.url && isAuthCallbackUrl(launch.url)) {
      navigateToAuthCallback(launch.url);
    }
  });
}

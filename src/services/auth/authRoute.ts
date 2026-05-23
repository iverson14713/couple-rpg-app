import { isAuthCallbackPath } from '../../authCallbackEntry';
import { authLog } from './authDebug';

export const AUTH_ROUTE_EVENT = 'lq:auth-route';

/** OAuth / email callback query or hash (PKCE code, tokens, errors). */
export function hasOAuthCallbackParams(location: Location = window.location): boolean {
  const search = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (search.get('code') || hash.get('code')) return true;
  if (search.get('token_hash') && search.get('type')) return true;
  if (hash.get('access_token') && hash.get('refresh_token')) return true;
  if (
    search.get('error') ||
    hash.get('error') ||
    search.get('error_code') ||
    search.get('error_description') ||
    hash.get('error_description')
  ) {
    return true;
  }
  return false;
}

export function shouldRenderAuthCallback(location: Location = window.location): boolean {
  return isAuthCallbackPath(location.pathname) || hasOAuthCallbackParams(location);
}

/** Notify Root / AuthCallbackPage that the in-app URL changed (custom scheme → /auth/callback). */
export function notifyAuthRouteChange(reason: string): void {
  authLog('authRoute.notify', { reason, href: window.location.href });
  window.dispatchEvent(new CustomEvent(AUTH_ROUTE_EVENT, { detail: { reason } }));
}

export const AUTH_SESSION_SYNC_EVENT = 'lq:auth-session-sync';

export function notifyAuthSessionSync(reason: string): void {
  authLog('authRoute.sessionSync', { reason });
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_SYNC_EVENT, { detail: { reason } }));
}

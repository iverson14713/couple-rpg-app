import { authLog } from './authDebug';

/** After OAuth / Apple sign-in, ignore spurious SIGNED_OUT for this window. */
export const AUTH_GRACE_MS = 15_000;

let lastSuccessfulSignInAt = 0;

export function markAuthGraceStart(source: string, userId?: string): void {
  lastSuccessfulSignInAt = Date.now();
  authLog('auth.grace.start', { source, userId: userId ?? null, graceMs: AUTH_GRACE_MS });
}

export function isWithinAuthGracePeriod(now = Date.now()): boolean {
  return lastSuccessfulSignInAt > 0 && now - lastSuccessfulSignInAt < AUTH_GRACE_MS;
}

export function clearAuthGrace(): void {
  lastSuccessfulSignInAt = 0;
}

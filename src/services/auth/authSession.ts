import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { authLog } from './authDebug';
import { isWithinAuthGracePeriod } from './authGrace';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type RecoverAuthSessionOptions = {
  attempts?: number;
  intervalMs?: number;
  /** In-memory session hint — never discarded when storage read is slow. */
  knownSession?: Session | null;
  /** Default false: refreshSession can emit spurious SIGNED_OUT on Capacitor. */
  allowRefresh?: boolean;
};

/** 等待 PKCE 兌換後 session 寫入 storage（避免第一次導回時 getSession 仍為 null） */
export async function waitForPersistedSession(
  client: SupabaseClient,
  options?: { timeoutMs?: number; intervalMs?: number; knownSession?: Session | null }
): Promise<Session | null> {
  if (options?.knownSession?.access_token) {
    return options.knownSession;
  }

  const timeoutMs = options?.timeoutMs ?? 6000;
  const intervalMs = options?.intervalMs ?? 80;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const {
      data: { session },
      error,
    } = await client.auth.getSession();
    if (error) {
      authLog('waitForPersistedSession.error', { message: error.message });
    }
    if (session?.access_token) {
      authLog('waitForPersistedSession.ok', { userId: session.user.id });
      return session;
    }
    if (isWithinAuthGracePeriod()) {
      await sleep(intervalMs);
      continue;
    }
    await sleep(intervalMs);
  }

  if (isWithinAuthGracePeriod()) {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session?.access_token) {
      authLog('waitForPersistedSession.ok_after_grace_poll', { userId: session.user.id });
      return session;
    }
  }

  authLog('waitForPersistedSession.timeout', { timeoutMs, inGrace: isWithinAuthGracePeriod() });
  return null;
}

/**
 * Read session from storage with retries. Never calls signOut.
 * Does not call refreshSession unless explicitly allowed (avoid "Auth session missing!").
 */
export async function recoverAuthSession(
  client: SupabaseClient,
  options?: RecoverAuthSessionOptions
): Promise<Session | null> {
  if (options?.knownSession?.access_token) {
    authLog('recoverAuthSession.known_ok', { userId: options.knownSession.user.id });
    return options.knownSession;
  }

  const attempts = options?.attempts ?? 4;
  const intervalMs = options?.intervalMs ?? 100;

  for (let i = 0; i < attempts; i++) {
    const {
      data: { session },
      error,
    } = await client.auth.getSession();
    if (error) {
      authLog('recoverAuthSession.getSession.error', { message: error.message, attempt: i });
    }
    if (session?.access_token) {
      authLog('recoverAuthSession.ok', { attempt: i, userId: session.user.id });
      return session;
    }
    if (i < attempts - 1) await sleep(intervalMs * (i + 1));
  }

  if (options?.allowRefresh && !isWithinAuthGracePeriod()) {
    const {
      data: { session },
      error,
    } = await client.auth.refreshSession();
    if (error) {
      console.warn('[LQ_AUTH] recoverAuthSession.refresh.warn', error.message);
      authLog('recoverAuthSession.refresh.warn', { message: error.message });
      return null;
    }
    if (session?.access_token) {
      authLog('recoverAuthSession.refresh.ok', { userId: session.user.id });
      return session;
    }
  }

  return null;
}

/**
 * After spurious SIGNED_OUT: retry getSession only before confirming logout.
 */
export async function confirmSignedOutAfterRetries(
  client: SupabaseClient,
  fallbackSession: Session | null,
  options?: { retries?: number; delayMs?: number }
): Promise<Session | null> {
  if (fallbackSession?.access_token) {
    authLog('confirmSignedOut.fallback_session', { userId: fallbackSession.user.id });
    return fallbackSession;
  }

  const retries = options?.retries ?? 3;
  const delayMs = options?.delayMs ?? 650;

  for (let i = 0; i < retries; i++) {
    authLog('auth.signed_out.confirm_retry', { attempt: i, delayMs });
    const {
      data: { session },
      error,
    } = await client.auth.getSession();
    if (error) {
      authLog('confirmSignedOut.getSession.error', { message: error.message, attempt: i });
    }
    if (session?.access_token) {
      authLog('confirmSignedOut.ok', { attempt: i, userId: session.user.id });
      return session;
    }
    if (i < retries - 1) await sleep(delayMs);
  }

  if (isWithinAuthGracePeriod()) {
    authLog('auth.signed_out.ignored_during_grace', {});
    return fallbackSession?.access_token ? fallbackSession : null;
  }

  authLog('auth.signed_out.confirmed_after_retries', {});
  return null;
}

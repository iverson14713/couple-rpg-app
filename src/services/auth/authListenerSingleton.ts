import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { authLog } from './authDebug';

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

let attachedClient: SupabaseClient | null = null;
let subscription: { unsubscribe: () => void } | null = null;
const listeners = new Set<AuthListener>();

/**
 * One Supabase onAuthStateChange subscription per client — avoids StrictMode /
 * remount duplicate listeners that amplify TOKEN_REFRESHED churn.
 */
export function subscribeAuthStateChange(
  client: SupabaseClient,
  listener: AuthListener
): () => void {
  listeners.add(listener);

  if (attachedClient !== client || !subscription) {
    subscription?.unsubscribe();
    attachedClient = client;
    const {
      data: { subscription: sub },
    } = client.auth.onAuthStateChange((event, session) => {
      for (const fn of listeners) {
        try {
          fn(event, session);
        } catch (e) {
          console.warn('[auth] listener error', e);
        }
      }
    });
    subscription = sub;
    authLog('auth.listener.attach', { listenerCount: listeners.size });
  } else {
    authLog('auth.listener.reuse', { listenerCount: listeners.size });
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      subscription?.unsubscribe();
      subscription = null;
      attachedClient = null;
      authLog('auth.listener.detach', {});
    }
  };
}

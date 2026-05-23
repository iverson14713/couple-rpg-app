import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { authLog } from './authDebug';
import { waitForPersistedSession } from './authSession';

type ExchangeResult = { session: Session | null; error: Error | null };

const inflightByCode = new Map<string, Promise<ExchangeResult>>();

/** 同一個 PKCE code 只兌換一次（併發 / StrictMode 重複 effect 共用同一個 Promise）。 */
export function exchangePkceCodeOnce(client: SupabaseClient, code: string): Promise<ExchangeResult> {
  const existing = inflightByCode.get(code);
  if (existing) {
    authLog('exchangePkceCodeOnce.join', { codeLength: code.length });
    return existing;
  }

  const promise = (async (): Promise<ExchangeResult> => {
    authLog('exchangePkceCodeOnce.start', { codeLength: code.length });
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      authLog('exchangePkceCodeOnce.error', { message: error.message });
      return { session: null, error: new Error(error.message) };
    }
    const session =
      data.session ?? (await waitForPersistedSession(client, { timeoutMs: 8000 }));
    if (!session) {
      return {
        session: null,
        error: new Error('Session not available after code exchange'),
      };
    }
    authLog('exchangePkceCodeOnce.ok', { userId: session.user.id });
    return { session, error: null };
  })();

  inflightByCode.set(code, promise);
  void promise.finally(() => {
    if (inflightByCode.get(code) === promise) inflightByCode.delete(code);
  });
  return promise;
}

import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { authLog } from './authDebug';

/** 等待 PKCE 兌換後 session 寫入 storage（避免第一次導回時 getSession 仍為 null） */
export async function waitForPersistedSession(
  client: SupabaseClient,
  options?: { timeoutMs?: number; intervalMs?: number }
): Promise<Session | null> {
  const timeoutMs = options?.timeoutMs ?? 6000;
  const intervalMs = options?.intervalMs ?? 80;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) {
      authLog('waitForPersistedSession.error', { message: error.message });
      throw error;
    }
    if (session?.access_token) {
      authLog('waitForPersistedSession.ok', { userId: session.user.id });
      return session;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  authLog('waitForPersistedSession.timeout', { timeoutMs });
  return null;
}

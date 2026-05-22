import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

/**
 * Browser Supabase client (anon key). Returns null when env is missing so the app still runs in local-only mode.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    cached = null;
    return null;
  }
  cached = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      /** Session 僅在 `/auth/callback` 手動兌換，避免主 App 誤解析或空白頁 */
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  });
  return cached;
}

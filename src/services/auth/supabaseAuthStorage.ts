import { safeGetItem, safeRemoveItem, safeSetItem } from '../../safeStorage';

/**
 * Supabase Auth session storage (localStorage on Capacitor WebView).
 * Explicit adapter so session keys survive app restarts when WebView storage persists.
 */
export const supabaseAuthStorage = {
  getItem(key: string): string | null {
    return safeGetItem(key, localStorage);
  },
  setItem(key: string, value: string): void {
    safeSetItem(key, value, localStorage);
  },
  removeItem(key: string): void {
    safeRemoveItem(key, localStorage);
  },
};

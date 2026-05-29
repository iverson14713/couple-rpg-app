import { safeRemoveItem } from '../../safeStorage';
import { ONBOARDING_DONE_KEY } from './onboardingStore';
import {
  DEVICE_PREF_STORAGE_KEYS,
  isLogoutPreservedStorageKey,
  LOGOUT_PRESERVED_USER_SCOPED_KEYS,
  USER_SCOPED_STORAGE_KEYS,
} from './keys';
import { scopedStorageKey } from './storageSession';

const DEVICE_PREF_SET = new Set<string>(DEVICE_PREF_STORAGE_KEYS);
const LOGOUT_PRESERVED_BASE_SET = new Set<string>(LOGOUT_PRESERVED_USER_SCOPED_KEYS);

/** Remove legacy (non–user-scoped) user-data keys still on disk. */
export function clearLoveQuestLegacyGlobalUserKeys(): void {
  for (const key of USER_SCOPED_STORAGE_KEYS) {
    if (LOGOUT_PRESERVED_BASE_SET.has(key)) continue;
    safeRemoveItem(key);
  }
}

/** Purge LoveQuest user data for logout. Keeps device prefs and AI favorites cache per user. */
export function clearLoveQuestUserData(userId: string | null): void {
  clearLoveQuestLegacyGlobalUserKeys();

  if (userId) {
    for (const key of USER_SCOPED_STORAGE_KEYS) {
      if (LOGOUT_PRESERVED_BASE_SET.has(key)) continue;
      safeRemoveItem(scopedStorageKey(key, userId));
    }
  }

  sweepLoveQuestUserDataKeys();
}

function sweepLoveQuestUserDataKeys(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('lovequest-')) continue;
      if (DEVICE_PREF_SET.has(key)) continue;
      if (key === ONBOARDING_DONE_KEY) continue;
      if (isLogoutPreservedStorageKey(key)) continue;
      toRemove.push(key);
    }
    for (const key of toRemove) {
      safeRemoveItem(key);
    }
  } catch (e) {
    console.warn('[lovequest-storage] sweep failed', e);
  }
}

/** Before hydrating a logged-in session: drop stale global keys so they are not reused. */
export function prepareLoveQuestStorageForLogin(userId: string): void {
  clearLoveQuestLegacyGlobalUserKeys();
  void userId;
}

const SESSION_KEYS_TO_CLEAR = [
  'lq_auth_return',
  'lq_skip_splash_once',
  'lq_auth_oauth_provider',
] as const;

function clearSupabaseAuthStorage(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('sb-') && key.includes('auth')) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      safeRemoveItem(key);
    }
  } catch (e) {
    console.warn('[lovequest-storage] supabase auth sweep failed', e);
  }
}

function clearSessionStorageForAccountDeletion(): void {
  try {
    for (const key of SESSION_KEYS_TO_CLEAR) {
      sessionStorage.removeItem(key);
    }
    const extra: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      if (key.startsWith('lovequest-') || key.startsWith('lq_')) {
        extra.push(key);
      }
    }
    for (const key of extra) {
      sessionStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('[lovequest-storage] sessionStorage sweep failed', e);
  }
}

async function clearBrowserCachesIfAvailable(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  } catch (e) {
    console.warn('[lovequest-storage] cache sweep failed', e);
  }
}

/**
 * Wipe all LoveQuest user data after permanent account deletion.
 * Unlike logout, nothing is preserved (including AI favorites cache).
 */
export async function clearAllLocalDataForAccountDeletion(): Promise<void> {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('lovequest-') || key === ONBOARDING_DONE_KEY) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      safeRemoveItem(key);
    }
  } catch (e) {
    console.warn('[lovequest-storage] localStorage sweep failed', e);
  }

  clearSupabaseAuthStorage();
  clearSessionStorageForAccountDeletion();
  await clearBrowserCachesIfAvailable();
}

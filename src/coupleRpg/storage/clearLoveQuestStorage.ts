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

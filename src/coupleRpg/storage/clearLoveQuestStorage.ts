import { safeRemoveItem } from '../../safeStorage';
import { ONBOARDING_DONE_KEY } from './onboardingStore';
import { DEVICE_PREF_STORAGE_KEYS, USER_SCOPED_STORAGE_KEYS } from './keys';
import { scopedStorageKey } from './storageSession';

const DEVICE_PREF_SET = new Set<string>(DEVICE_PREF_STORAGE_KEYS);

/** Remove legacy (non–user-scoped) user-data keys still on disk. */
export function clearLoveQuestLegacyGlobalUserKeys(): void {
  for (const key of USER_SCOPED_STORAGE_KEYS) {
    safeRemoveItem(key);
  }
}

/** Purge all LoveQuest user data for logout or account switch cleanup. Keeps device prefs. */
export function clearLoveQuestUserData(userId: string | null): void {
  clearLoveQuestLegacyGlobalUserKeys();

  if (userId) {
    for (const key of USER_SCOPED_STORAGE_KEYS) {
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

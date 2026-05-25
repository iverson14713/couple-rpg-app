import { safeGetItem, safeParseJson, safeRemoveItem, safeSetItem } from '../../safeStorage';
import { isUserScopedStorageKey } from './keys';
import { getActiveStorageUserId, scopedStorageKey } from './storageSession';

function resolveKey(key: string): string | null {
  if (!isUserScopedStorageKey(key)) return key;
  const userId = getActiveStorageUserId();
  if (!userId) return null;
  return scopedStorageKey(key, userId);
}

export function loadJson<T>(key: string, fallback: T): T {
  const resolved = resolveKey(key);
  if (resolved === null) return fallback;
  const raw = safeGetItem(resolved);
  if (!raw) return fallback;
  return safeParseJson(raw, fallback, resolved);
}

export function saveJson<T>(key: string, value: T): void {
  const resolved = resolveKey(key);
  if (resolved === null) return;
  safeSetItem(resolved, JSON.stringify(value));
}

export function removeJson(key: string): void {
  const resolved = resolveKey(key);
  if (resolved === null) return;
  safeRemoveItem(resolved);
}

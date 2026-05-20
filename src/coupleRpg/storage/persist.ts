import { safeGetItem, safeParseJson, safeSetItem } from '../../safeStorage';

export function loadJson<T>(key: string, fallback: T): T {
  const raw = safeGetItem(key);
  if (!raw) return fallback;
  return safeParseJson(raw, fallback, key);
}

export function saveJson<T>(key: string, value: T): void {
  safeSetItem(key, JSON.stringify(value));
}

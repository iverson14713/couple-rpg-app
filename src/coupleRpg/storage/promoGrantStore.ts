import { scopedStorageKey } from './storageSession';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export function loadPromoGrantedUntil(userId: string): string | null {
  const key = scopedStorageKey(LQ_KEYS.promoGrantedUntil, userId);
  const raw = loadJson<string | null>(key, null);
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

export function savePromoGrantedUntil(userId: string, iso: string | null): void {
  const key = scopedStorageKey(LQ_KEYS.promoGrantedUntil, userId);
  if (!iso) {
    saveJson(key, null);
    return;
  }
  saveJson(key, iso);
}

export function isPromoGrantActive(userId: string, at = Date.now()): boolean {
  const until = loadPromoGrantedUntil(userId);
  if (!until) return false;
  const t = new Date(until).getTime();
  return Number.isFinite(t) && t > at;
}

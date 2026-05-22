import { AI_RECORDS_CHANGED_EVENT, dispatchAiRecordsChanged } from '../lib/aiRecordsConfig';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export const AI_FAVORITES_CHANGED_EVENT = 'lovequest:ai-favorites-changed';

type FavoritesData = {
  version: 1;
  ids: string[];
};

function defaultFavorites(): FavoritesData {
  return { version: 1, ids: [] };
}

function dispatchFavoritesChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_FAVORITES_CHANGED_EVENT));
  }
  dispatchAiRecordsChanged();
}

export function loadAiFavoriteIds(): Set<string> {
  try {
    const raw = loadJson<FavoritesData | null>(LQ_KEYS.aiFavorites, null);
    if (!raw || raw.version !== 1 || !Array.isArray(raw.ids)) return new Set();
    return new Set(raw.ids.filter((id) => typeof id === 'string' && id.length > 0));
  } catch (e) {
    console.error('[ai-favorites] load failed:', e);
    return new Set();
  }
}

export function isAiFavorite(recordId: string): boolean {
  return loadAiFavoriteIds().has(recordId);
}

/** 切換收藏；回傳切換後是否為收藏狀態 */
export function toggleAiFavorite(recordId: string): boolean {
  const set = loadAiFavoriteIds();
  const next = new Set(set);
  if (next.has(recordId)) {
    next.delete(recordId);
  } else {
    next.add(recordId);
  }
  saveJson(LQ_KEYS.aiFavorites, { version: 1, ids: [...next] });
  dispatchFavoritesChanged();
  return next.has(recordId);
}

export function countAiFavorites(): number {
  return loadAiFavoriteIds().size;
}

/** 刪除紀錄時一併移除收藏 */
export function removeAiFavoriteById(recordId: string): void {
  const set = loadAiFavoriteIds();
  if (!set.has(recordId)) return;
  set.delete(recordId);
  saveJson(LQ_KEYS.aiFavorites, { version: 1, ids: [...set] });
  dispatchFavoritesChanged();
}

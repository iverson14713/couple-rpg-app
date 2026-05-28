import { dispatchAiRecordsChanged } from '../lib/aiRecordsConfig';
import { findAiRecordPayloadById } from './aiFavoriteRecordSnapshot';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export const AI_FAVORITES_CHANGED_EVENT = 'lovequest:ai-favorites-changed';
export const AI_FAVORITES_SYNC_STATUS_EVENT = 'lovequest:ai-favorites-sync-status';

export type AiFavoritePendingOp = {
  op: 'add' | 'remove';
  recordId: string;
  at: string;
  /** Full record JSON when op is add (for cloud restore after logout). */
  payload?: Record<string, unknown> | null;
};

type FavoritesData = {
  version: 2;
  ids: string[];
};

type PendingOpsData = {
  version: 1;
  ops: AiFavoritePendingOp[];
};

let aiFavoritesSyncScheduler: ((reason?: string) => void) | null = null;

/** LoveQuestContext registers debounced cloud sync. */
export function registerAiFavoritesSyncScheduler(fn: ((reason?: string) => void) | null): void {
  aiFavoritesSyncScheduler = fn;
}

let aiFavoritesRetrySync: (() => void) | null = null;

export function registerAiFavoritesRetrySync(fn: (() => void) | null): void {
  aiFavoritesRetrySync = fn;
}

export function retryAiFavoritesCloudSync(): void {
  aiFavoritesRetrySync?.();
}

export type AiFavoritesSyncStatus =
  | 'idle'
  | 'local'
  | 'loading'
  | 'syncing'
  | 'synced'
  | 'error';

export function emitAiFavoritesSyncStatus(status: AiFavoritesSyncStatus, error: string | null): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(AI_FAVORITES_SYNC_STATUS_EVENT, {
      detail: { status, error },
    })
  );
}

function normalizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id) => typeof id === 'string' && id.trim().length > 0))];
}

function dispatchFavoritesChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_FAVORITES_CHANGED_EVENT));
  }
  dispatchAiRecordsChanged();
}

export function loadAiFavoriteIds(): Set<string> {
  try {
    const raw = loadJson<FavoritesData | { version: 1; ids: string[] } | null>(
      LQ_KEYS.aiFavorites,
      null
    );
    if (!raw || !Array.isArray(raw.ids)) return new Set();
    return new Set(normalizeIds(raw.ids));
  } catch (e) {
    console.error('[ai-favorites] load failed:', e);
    return new Set();
  }
}

/** Replace local favorite ids (after cloud pull / merge). */
export function replaceAiFavoriteIds(ids: Iterable<string>): void {
  const next = normalizeIds([...ids]);
  saveJson(LQ_KEYS.aiFavorites, { version: 2, ids: next });
  dispatchFavoritesChanged();
}

export function isAiFavorite(recordId: string): boolean {
  return loadAiFavoriteIds().has(recordId);
}

export function loadAiFavoritesPendingOps(): AiFavoritePendingOp[] {
  const raw = loadJson<PendingOpsData | null>(LQ_KEYS.aiFavoritesPending, null);
  if (!raw || raw.version !== 1 || !Array.isArray(raw.ops)) return [];
  return raw.ops.filter(
    (op) =>
      (op.op === 'add' || op.op === 'remove') &&
      typeof op.recordId === 'string' &&
      op.recordId.trim().length > 0
  );
}

export function saveAiFavoritesPendingOps(ops: AiFavoritePendingOp[]): void {
  saveJson(LQ_KEYS.aiFavoritesPending, { version: 1, ops });
}

export function queueAiFavoritePendingOp(op: AiFavoritePendingOp): void {
  const list = loadAiFavoritesPendingOps();
  list.push(op);
  saveAiFavoritesPendingOps(list);
}

function scheduleCloudSync(reason: string): void {
  aiFavoritesSyncScheduler?.(reason);
}

/** 切換收藏；回傳切換後是否為收藏狀態 */
export function toggleAiFavorite(recordId: string): boolean {
  const trimmed = recordId.trim();
  if (!trimmed) return false;

  const set = loadAiFavoriteIds();
  const next = new Set(set);
  const wasFavorite = next.has(trimmed);

  const at = new Date().toISOString();

  if (wasFavorite) {
    next.delete(trimmed);
    queueAiFavoritePendingOp({ op: 'remove', recordId: trimmed, at });
  } else {
    next.add(trimmed);
    queueAiFavoritePendingOp({
      op: 'add',
      recordId: trimmed,
      at,
      payload: findAiRecordPayloadById(trimmed),
    });
  }

  saveJson(LQ_KEYS.aiFavorites, { version: 2, ids: [...next] });
  dispatchFavoritesChanged();
  scheduleCloudSync(wasFavorite ? 'unfavorite' : 'favorite');
  return next.has(trimmed);
}

export function countAiFavorites(): number {
  return loadAiFavoriteIds().size;
}

/** 刪除紀錄時一併移除收藏（本機 + 排程雲端刪除） */
export function removeAiFavoriteById(recordId: string): void {
  const trimmed = recordId.trim();
  if (!trimmed) return;

  const set = loadAiFavoriteIds();
  if (!set.has(trimmed)) return;
  set.delete(trimmed);
  saveJson(LQ_KEYS.aiFavorites, { version: 2, ids: [...set] });
  queueAiFavoritePendingOp({
    op: 'remove',
    recordId: trimmed,
    at: new Date().toISOString(),
  });
  dispatchFavoritesChanged();
  scheduleCloudSync('record-deleted');
}

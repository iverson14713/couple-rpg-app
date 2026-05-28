/**
 * Sync AI record favorites with public.user_ai_favorites (per user_id).
 * Stores record_id + full record JSON snapshot so favorites survive logout.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ENABLE_AI_FAVORITES_CLOUD_SYNC } from '../constants/aiFavoritesSyncFlags';
import {
  findAiRecordPayloadById,
  restoreAiRecordsFromFavoriteRows,
} from '../storage/aiFavoriteRecordSnapshot';
import {
  AI_FAVORITES_CHANGED_EVENT,
  loadAiFavoriteIds,
  loadAiFavoritesPendingOps,
  replaceAiFavoriteIds,
  saveAiFavoritesPendingOps,
  type AiFavoritePendingOp,
} from '../storage/aiFavoritesStore';
import { canUseUserStorage } from '../storage/storageGuard';
import { getAiFavoritesSyncErrorInfo, isAiFavoritesTableMissingError } from './aiFavoritesSyncErrors';

const LOG = '[ai-favorites-sync]';
const TABLE = 'user_ai_favorites';

export type { AiFavoritesSyncStatus } from '../storage/aiFavoritesStore';

export type AiFavoriteRow = {
  id: string;
  user_id: string;
  record_id: string;
  record_payload: Record<string, unknown> | null;
  created_at: string;
};

export function canSyncAiFavorites(input: {
  configured: boolean;
  userId: string | null;
  online: boolean;
}): boolean {
  if (!ENABLE_AI_FAVORITES_CLOUD_SYNC) return false;
  return Boolean(canUseUserStorage(input.userId) && input.configured && input.userId && input.online);
}

export async function fetchRemoteAiFavoriteRows(
  supabase: SupabaseClient,
  userId: string
): Promise<AiFavoriteRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, user_id, record_id, record_payload, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`${LOG} fetch failed:`, error.message);
    throw error;
  }

  return (data ?? []) as AiFavoriteRow[];
}

export async function fetchRemoteAiFavoriteIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const rows = await fetchRemoteAiFavoriteRows(supabase, userId);
  const ids = rows
    .map((row) => String(row.record_id ?? '').trim())
    .filter((id) => id.length > 0);
  return [...new Set(ids)];
}

function resolvePayloadForUpsert(
  recordId: string,
  explicit?: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (explicit && Object.keys(explicit).length > 0) return explicit;
  return findAiRecordPayloadById(recordId);
}

export async function upsertRemoteAiFavorite(
  supabase: SupabaseClient,
  userId: string,
  recordId: string,
  payload?: Record<string, unknown> | null
): Promise<void> {
  const trimmed = recordId.trim();
  if (!trimmed) return;

  const recordPayload = resolvePayloadForUpsert(trimmed, payload);
  const row: { user_id: string; record_id: string; record_payload?: Record<string, unknown> } = {
    user_id: userId,
    record_id: trimmed,
  };
  if (recordPayload) row.record_payload = recordPayload;

  const { error } = await supabase.from(TABLE).upsert(row, {
    onConflict: 'user_id,record_id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error(`${LOG} upsert failed:`, error.message);
    throw error;
  }
}

export async function deleteRemoteAiFavorite(
  supabase: SupabaseClient,
  userId: string,
  recordId: string
): Promise<void> {
  const trimmed = recordId.trim();
  if (!trimmed) return;

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('record_id', trimmed);

  if (error) {
    console.error(`${LOG} delete failed:`, error.message);
    throw error;
  }
}

/** Pull cloud favorites → restore record bodies → merge favorite ids. */
export async function pullAiFavoritesFromRemote(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const rows = await fetchRemoteAiFavoriteRows(supabase, userId);
  const restored = restoreAiRecordsFromFavoriteRows(rows);
  const remoteIds = rows.map((r) => r.record_id).filter(Boolean);
  const local = loadAiFavoriteIds();
  const merged = new Set<string>([...remoteIds, ...local]);
  replaceAiFavoriteIds(merged);
  console.log(
    `${LOG} pull ok remote=${remoteIds.length} local=${local.size} merged=${merged.size} restored=${restored}`
  );
  return merged;
}

/** Best-effort push before logout so cloud has latest favorites. */
export async function flushAiFavoritesBeforeLogout(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    await syncAiFavoritesWithRemote(supabase, userId);
  } catch (e) {
    if (isAiFavoritesTableMissingError(e)) return;
    throw e;
  }
}

async function applyPendingOp(
  supabase: SupabaseClient,
  userId: string,
  op: AiFavoritePendingOp
): Promise<void> {
  if (op.op === 'add') {
    await upsertRemoteAiFavorite(supabase, userId, op.recordId, op.payload ?? null);
  } else {
    await deleteRemoteAiFavorite(supabase, userId, op.recordId);
  }
}

/** Flush offline queue, then pull latest remote state. */
export async function syncAiFavoritesWithRemote(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const pending = loadAiFavoritesPendingOps();
  const remaining: AiFavoritePendingOp[] = [];

  for (const op of pending) {
    try {
      await applyPendingOp(supabase, userId, op);
    } catch (e) {
      console.warn(`${LOG} pending op failed:`, op, getAiFavoritesSyncErrorInfo(e).message);
      remaining.push(op);
      if (isAiFavoritesTableMissingError(e)) {
        saveAiFavoritesPendingOps(remaining);
        throw e;
      }
    }
  }
  saveAiFavoritesPendingOps(remaining);

  await pullAiFavoritesFromRemote(supabase, userId);
  console.log(`${LOG} sync ok pending=${remaining.length}`);
}

export function dispatchAiFavoritesSyncEvent(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_FAVORITES_CHANGED_EVENT));
  }
}

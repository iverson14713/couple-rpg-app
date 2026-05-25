/**
 * Sync 今日動態 with public.couple_activity_logs (append-only, local_id = client id).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ENABLE_ACTIVITY_LOG_CLOUD_SYNC } from '../constants/activityLogSyncFlags';
import { todayKey } from '../lib/dates';
import {
  loadActivityLogs,
  notifyActivityLogUpdated,
  retentionDaysForPlan,
  saveActivityLogs,
} from './activityLogService';
import type { ActivityLogItem } from '../storage/activityLogTypes';
import { canUseUserStorage } from '../storage/storageGuard';

const LOG = '[activity-log-sync]';
const TABLE = 'couple_activity_logs';

const SELECT_COLS =
  'id, couple_id, local_id, actor_user_id, actor_name, action_type, target_type, target_title, message, date_key, created_at';

export type ActivityLogSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export type ActivityLogRow = {
  id: string;
  couple_id: string;
  local_id: string;
  actor_user_id: string | null;
  actor_name: string;
  action_type: string;
  target_type: string;
  target_title: string | null;
  message: string;
  date_key: string;
  created_at: string;
};

export function canSyncActivityLogs(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  if (!ENABLE_ACTIVITY_LOG_CLOUD_SYNC) return false;
  return Boolean(
    canUseUserStorage(input.userId) &&
      input.configured &&
      input.userId &&
      input.coupleId &&
      input.online &&
      input.isFullyBound
  );
}

function rowToItem(row: ActivityLogRow): ActivityLogItem {
  return {
    id: String(row.local_id ?? '').trim(),
    coupleId: row.couple_id,
    actorUserId: row.actor_user_id,
    actorName: String(row.actor_name ?? '').trim() || '某位成員',
    actionType: row.action_type as ActivityLogItem['actionType'],
    targetType: row.target_type as ActivityLogItem['targetType'],
    targetTitle: row.target_title?.trim() || undefined,
    message: String(row.message ?? '').trim(),
    createdAt: row.created_at,
    dateKey: row.date_key,
    source: 'remote',
  };
}

function itemToRow(item: ActivityLogItem, coupleId: string): Omit<ActivityLogRow, 'id' | 'created_at'> & {
  created_at: string;
} {
  return {
    couple_id: coupleId,
    local_id: item.id,
    actor_user_id: item.actorUserId ?? null,
    actor_name: item.actorName,
    action_type: item.actionType,
    target_type: item.targetType,
    target_title: item.targetTitle ?? null,
    message: item.message,
    date_key: item.dateKey,
    created_at: item.createdAt,
  };
}

export function mergeActivityLogs(
  local: ActivityLogItem[],
  remote: ActivityLogItem[]
): ActivityLogItem[] {
  const byId = new Map<string, ActivityLogItem>();
  for (const item of [...local, ...remote]) {
    if (!item?.id || !item.message?.trim()) continue;
    const existing = byId.get(item.id);
    if (!existing || Date.parse(item.createdAt) >= Date.parse(existing.createdAt)) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

function cutoffDateKey(isPro: boolean, refDate = new Date()): string {
  const days = retentionDaysForPlan(isPro);
  const cutoff = new Date(refDate);
  cutoff.setDate(cutoff.getDate() - days);
  return todayKey(cutoff);
}

export async function pushPendingActivityLogs(
  supabase: SupabaseClient,
  coupleId: string,
  isPro: boolean
): Promise<void> {
  const cutoffKey = cutoffDateKey(isPro);
  const pending = loadActivityLogs().filter(
    (item) =>
      item.source === 'local' &&
      item.dateKey >= cutoffKey &&
      (!item.coupleId || item.coupleId === coupleId)
  );

  if (pending.length === 0) return;

  const rows = pending.map((item) => itemToRow({ ...item, coupleId }, coupleId));
  const { error } = await supabase.from(TABLE).upsert(rows, {
    onConflict: 'couple_id,local_id',
    ignoreDuplicates: true,
  });

  if (error) {
    console.warn(`${LOG} push failed:`, error.message);
    throw new Error(error.message);
  }
}

export async function pullActivityLogsFromRemote(
  supabase: SupabaseClient,
  coupleId: string,
  isPro: boolean
): Promise<ActivityLogItem[]> {
  const cutoffKey = cutoffDateKey(isPro);

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLS)
    .eq('couple_id', coupleId)
    .gte('date_key', cutoffKey)
    .order('created_at', { ascending: false })
    .limit(400);

  if (error) {
    console.warn(`${LOG} pull failed:`, error.message);
    throw new Error(error.message);
  }

  const remote = (data ?? []).map((row) => rowToItem(row as ActivityLogRow));
  const merged = mergeActivityLogs(loadActivityLogs(), remote);
  saveActivityLogs(merged);
  notifyActivityLogUpdated();
  return merged;
}

export async function syncActivityLogs(
  supabase: SupabaseClient,
  coupleId: string,
  isPro: boolean
): Promise<void> {
  await pushPendingActivityLogs(supabase, coupleId, isPro);
  await pullActivityLogsFromRemote(supabase, coupleId, isPro);
}

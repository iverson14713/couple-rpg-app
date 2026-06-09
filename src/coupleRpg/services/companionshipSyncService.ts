import type { SupabaseClient } from '@supabase/supabase-js';
import { ENABLE_COMPANIONSHIP_CLOUD_SYNC } from '../constants/companionshipSyncFlags';
import {
  loadCompanionshipEvents,
  mergeCompanionshipEvents,
  saveCompanionshipEvents,
  notifyCompanionshipUpdated,
} from '../storage/companionshipStore';
import type { CompanionshipEvent } from '../storage/companionshipTypes';
import { canUseUserStorage } from '../storage/storageGuard';

const LOG = '[companionship-sync]';
const TABLE = 'companionship_events';
const PULL_LIMIT = 120;
const RETENTION_DAYS = 45;

const SELECT_COLS =
  'id, couple_id, local_id, sender_user_id, receiver_user_id, type, message, created_at, seen_at';

export type CompanionshipRow = {
  id: string;
  couple_id: string;
  local_id: string;
  sender_user_id: string;
  receiver_user_id: string;
  type: string;
  message: string;
  created_at: string;
  seen_at: string | null;
};

export function canSyncCompanionship(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  if (!ENABLE_COMPANIONSHIP_CLOUD_SYNC) return false;
  return Boolean(
    canUseUserStorage(input.userId) &&
      input.configured &&
      input.userId &&
      input.coupleId &&
      input.online &&
      input.isFullyBound
  );
}

function rowToEvent(row: CompanionshipRow): CompanionshipEvent {
  return {
    id: row.local_id,
    coupleId: row.couple_id,
    senderUserId: row.sender_user_id,
    receiverUserId: row.receiver_user_id,
    type: row.type,
    message: row.message,
    createdAt: row.created_at,
    seenAt: row.seen_at,
    source: 'remote',
  };
}

function eventToInsertRow(event: CompanionshipEvent, coupleId: string) {
  return {
    couple_id: coupleId,
    local_id: event.id,
    sender_user_id: event.senderUserId,
    receiver_user_id: event.receiverUserId,
    type: event.type,
    message: event.message,
    created_at: event.createdAt,
    seen_at: event.seenAt,
  };
}

function cutoffIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - RETENTION_DAYS);
  return d.toISOString();
}

export async function pushPendingCompanionshipEvents(
  supabase: SupabaseClient,
  coupleId: string
): Promise<void> {
  const pending = loadCompanionshipEvents().filter(
    (e) => e.source === 'local' && e.coupleId === coupleId
  );
  if (pending.length === 0) return;

  const rows = pending.map((e) => eventToInsertRow(e, coupleId));
  const { error } = await supabase.from(TABLE).upsert(rows, {
    onConflict: 'couple_id,local_id',
    ignoreDuplicates: true,
  });
  if (error) {
    console.warn(`${LOG} push failed:`, error.message);
    throw new Error(error.message);
  }
}

export async function pushCompanionshipSeenUpdates(
  supabase: SupabaseClient,
  coupleId: string,
  receiverUserId: string
): Promise<void> {
  const pendingSeen = loadCompanionshipEvents().filter(
    (e) =>
      e.coupleId === coupleId &&
      e.receiverUserId === receiverUserId &&
      e.seenAt &&
      e.seenPending
  );
  if (pendingSeen.length === 0) return;

  for (const event of pendingSeen) {
    const { error } = await supabase
      .from(TABLE)
      .update({ seen_at: event.seenAt })
      .eq('couple_id', coupleId)
      .eq('local_id', event.id)
      .eq('receiver_user_id', receiverUserId);
    if (error) {
      console.warn(`${LOG} seen update failed:`, error.message);
      throw new Error(error.message);
    }
  }

  const cleared = loadCompanionshipEvents().map((e) =>
    pendingSeen.some((p) => p.id === e.id) ? { ...e, seenPending: false } : e
  );
  saveCompanionshipEvents(cleared);
}

export async function pullCompanionshipEventsFromRemote(
  supabase: SupabaseClient,
  coupleId: string
): Promise<CompanionshipEvent[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLS)
    .eq('couple_id', coupleId)
    .gte('created_at', cutoffIso())
    .order('created_at', { ascending: false })
    .limit(PULL_LIMIT);

  if (error) {
    console.warn(`${LOG} pull failed:`, error.message);
    throw new Error(error.message);
  }

  const remote = (data ?? []).map((row) => rowToEvent(row as CompanionshipRow));
  const merged = mergeCompanionshipEvents(loadCompanionshipEvents(), remote);
  saveCompanionshipEvents(merged);
  notifyCompanionshipUpdated();
  return merged;
}

export async function syncCompanionshipEvents(
  supabase: SupabaseClient,
  coupleId: string,
  receiverUserId: string | null
): Promise<void> {
  await pushPendingCompanionshipEvents(supabase, coupleId);
  if (receiverUserId) {
    await pushCompanionshipSeenUpdates(supabase, coupleId, receiverUserId);
  }
  await pullCompanionshipEventsFromRemote(supabase, coupleId);
}

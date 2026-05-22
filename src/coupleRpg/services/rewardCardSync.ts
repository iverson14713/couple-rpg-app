/**
 * Sync reward card records with Supabase public.reward_card_records.
 * local coupon.id ↔ DB local_id (legacy column client_id supported on read).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { COMPLETED_REWARD_CARD_RETENTION_DAYS } from '../constants/rewardCardRetention';
import { isCustomRewardCardId } from '../lib/customRewardCard';
import { pickPreferredStatus, STATUS_PROGRESS } from '../lib/rewardCardHelpers';
import type { OwnedCoupon, RewardCardStatus, RewardsData } from '../storage/rewardTypes';
import { loadRewards, saveRewards } from '../storage/rewardsStore';

export { COMPLETED_REWARD_CARD_RETENTION_DAYS };

const LOG = '[reward-card-sync]';

const SELECT_COLS =
  'id, couple_id, local_id, card_id, card_title, card_type, status, redeemed_by, used_by, target_user, redeemed_at, used_at, completed_at, note, cost, emoji, created_at, updated_at';

export type RewardCardSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export type RewardCardRecordRow = {
  id: string;
  couple_id: string;
  local_id: string;
  card_id: string;
  card_title: string;
  card_type: string | null;
  status: RewardCardStatus;
  redeemed_by: string | null;
  used_by: string | null;
  target_user: string | null;
  redeemed_at: string;
  used_at: string | null;
  completed_at: string | null;
  note: string | null;
  cost: number;
  emoji: string | null;
  created_at: string;
  updated_at: string;
};

export function canSyncRewardCards(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  return Boolean(
    input.configured && input.userId && input.coupleId && input.online && input.isFullyBound
  );
}

function rowLocalId(row: { local_id?: string | null }): string {
  return String(row.local_id ?? '').trim();
}

function parseTs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

const RETENTION_MS = COMPLETED_REWARD_CARD_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** 僅 completed 且 completed_at 超過保留期的卡券可清理 */
export function isEligibleForCompletedCleanup(coupon: OwnedCoupon, nowMs = Date.now()): boolean {
  if (coupon.status !== 'completed') return false;
  const completedAt = coupon.completedAt?.trim();
  if (!completedAt) return false;
  const t = parseTs(completedAt);
  if (t <= 0) return false;
  return nowMs - t > RETENTION_MS;
}

export function sortCompletedCoupons(coupons: OwnedCoupon[]): OwnedCoupon[] {
  return [...coupons].sort((a, b) => parseTs(b.completedAt) - parseTs(a.completedAt));
}

export type CleanupOldCompletedResult = {
  removedCount: number;
  rewards: RewardsData;
};

function pruneExpiredCompletedFromRewards(rewards: RewardsData): {
  rewards: RewardsData;
  removed: OwnedCoupon[];
} {
  const removed: OwnedCoupon[] = [];
  const coupons = rewards.coupons.filter((c) => {
    if (isEligibleForCompletedCleanup(c)) {
      removed.push(c);
      return false;
    }
    return true;
  });
  return { rewards: { ...rewards, coupons }, removed };
}

async function deleteRemoteExpiredCompleted(
  supabase: SupabaseClient,
  coupleId: string,
  removed: OwnedCoupon[]
): Promise<void> {
  for (const c of removed) {
    if (!isEligibleForCompletedCleanup(c)) continue;

    let query = supabase
      .from('reward_card_records')
      .delete()
      .eq('couple_id', coupleId)
      .eq('status', 'completed');

    if (c.remoteId) {
      query = query.eq('id', c.remoteId);
    } else if (c.id) {
      query = query.eq('local_id', c.id);
    } else {
      continue;
    }

    const { error } = await query;
    if (error) {
      console.warn(`${LOG} delete expired completed failed:`, error.message, c.id);
    }
  }
}

/** 清理超過保留期的已完成卡券（本機必做；雲端可選） */
export async function cleanupOldCompletedRewardCards(
  supabase: SupabaseClient | null,
  coupleId: string | null,
  options?: { syncRemote?: boolean }
): Promise<CleanupOldCompletedResult> {
  const cur = loadRewards();
  const { rewards: pruned, removed } = pruneExpiredCompletedFromRewards(cur);
  const removedCount = removed.length;

  if (removedCount > 0) {
    saveRewards(pruned);
    console.log(`${LOG} cleaned ${removedCount} expired completed coupon(s) locally`);
  }

  if (options?.syncRemote && supabase && coupleId && removed.length > 0) {
    await deleteRemoteExpiredCompleted(supabase, coupleId, removed);
  }

  return { removedCount, rewards: pruned };
}

function couponLocalUpdatedAt(c: OwnedCoupon): number {
  return Math.max(parseTs(c.completedAt), parseTs(c.usedAt), parseTs(c.redeemedAt));
}

export function rowToCoupon(row: RewardCardRecordRow): OwnedCoupon {
  const localId = rowLocalId(row);
  const itemId = row.card_id;
  const category = (row.card_type ?? 'date') as OwnedCoupon['category'];
  return {
    id: localId,
    remoteId: row.id,
    itemId,
    cardId: itemId,
    cardTitle: row.card_title,
    cardType: row.card_type ?? category,
    title: row.card_title,
    emoji: row.emoji ?? '🎫',
    category,
    cost: row.cost ?? 0,
    redeemedBy: row.redeemed_by,
    usedBy: row.used_by,
    targetUser: row.target_user,
    redeemedAt: row.redeemed_at,
    usedAt: row.used_at,
    completedAt: row.completed_at,
    note: row.note,
    status: row.status,
    syncPending: false,
    remoteUpdatedAt: row.updated_at,
    isCustom: isCustomRewardCardId(itemId),
  };
}

export function couponToRowPayload(coupon: OwnedCoupon, coupleId: string) {
  return {
    couple_id: coupleId,
    local_id: coupon.id,
    card_id: coupon.cardId,
    card_title: coupon.cardTitle,
    card_type: coupon.cardType,
    status: coupon.status,
    redeemed_by: coupon.redeemedBy,
    used_by: coupon.usedBy,
    target_user: coupon.targetUser,
    redeemed_at: coupon.redeemedAt,
    used_at: coupon.usedAt,
    completed_at: coupon.completedAt,
    note: coupon.note,
    cost: coupon.cost,
    emoji: coupon.emoji,
  };
}

function mergeTwoCoupons(local: OwnedCoupon, remote: OwnedCoupon): OwnedCoupon {
  if (local.syncPending) {
    const localScore = STATUS_PROGRESS[local.status];
    const remoteScore = STATUS_PROGRESS[remote.status];
    if (remoteScore <= localScore) {
      return {
        ...local,
        remoteId: remote.remoteId ?? local.remoteId ?? null,
        remoteUpdatedAt: remote.remoteUpdatedAt ?? local.remoteUpdatedAt,
        syncPending: !remote.remoteId,
        syncError: remote.remoteId ? null : local.syncError,
      };
    }
  }

  const status = pickPreferredStatus(local.status, remote.status);
  const localScore = STATUS_PROGRESS[local.status];
  const remoteScore = STATUS_PROGRESS[remote.status];
  const preferRemote =
    remoteScore > localScore ||
    (remoteScore === localScore && parseTs(remote.remoteUpdatedAt) >= couponLocalUpdatedAt(local));
  const primary = preferRemote ? remote : local;
  const secondary = preferRemote ? local : remote;

  return {
    ...primary,
    status,
    remoteId: remote.remoteId ?? local.remoteId ?? null,
    redeemedBy: primary.redeemedBy ?? secondary.redeemedBy,
    usedBy: status !== 'redeemed' ? primary.usedBy ?? secondary.usedBy : null,
    targetUser: primary.targetUser ?? secondary.targetUser,
    redeemedAt: primary.redeemedAt || secondary.redeemedAt,
    usedAt: primary.usedAt ?? secondary.usedAt,
    completedAt: primary.completedAt ?? secondary.completedAt,
    note: primary.note ?? secondary.note,
    description: primary.description ?? secondary.description,
    needsPartnerComplete: primary.needsPartnerComplete ?? secondary.needsPartnerComplete,
    isCustom: primary.isCustom ?? secondary.isCustom,
    syncPending: false,
    syncError: null,
    remoteUpdatedAt: preferRemote ? remote.remoteUpdatedAt : local.remoteUpdatedAt,
  };
}

/** 將遠端列合併進現有 RewardsData（保留本機 optimistic 卡券） */
export function applyRemoteRewardRowsToRewards(
  current: RewardsData,
  remoteRows: RewardCardRecordRow[]
): RewardsData {
  return { ...current, coupons: mergeRemoteRewardCards(current.coupons, remoteRows) };
}

/** @alias mergeRemoteRewardCards */
export function mergeRewardCards(local: OwnedCoupon[], remoteRows: RewardCardRecordRow[]): OwnedCoupon[] {
  return mergeRemoteRewardCards(local, remoteRows);
}

export function mergeRemoteRewardCards(local: OwnedCoupon[], remoteRows: RewardCardRecordRow[]): OwnedCoupon[] {
  const remoteCoupons = remoteRows.map(rowToCoupon).filter((c) => c.id);
  const byId = new Map<string, OwnedCoupon>();

  for (const r of remoteCoupons) {
    byId.set(r.id, r);
  }

  for (const lo of local) {
    const existing = byId.get(lo.id);
    if (existing) {
      byId.set(lo.id, mergeTwoCoupons(lo, existing));
    } else {
      byId.set(lo.id, { ...lo, syncPending: !lo.remoteId });
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  );
}

export async function getRemoteRewardCards(
  supabase: SupabaseClient,
  coupleId: string
): Promise<RewardCardRecordRow[]> {
  const { data, error } = await supabase
    .from('reward_card_records')
    .select(SELECT_COLS)
    .eq('couple_id', coupleId)
    .order('redeemed_at', { ascending: false });

  if (error) {
    console.error(`${LOG} getRemote failed:`, error.message);
    throw error;
  }

  return (data ?? []) as RewardCardRecordRow[];
}

export async function pullRewardCardsFromRemote(
  supabase: SupabaseClient,
  coupleId: string,
  current: RewardsData
): Promise<RewardsData> {
  console.log(`${LOG} pulling`);
  const rows = await getRemoteRewardCards(supabase, coupleId);
  console.log(`${LOG} pull count = ${rows.length}`);
  return applyRemoteRewardRowsToRewards(current, rows);
}

async function upsertRewardCard(
  supabase: SupabaseClient,
  coupleId: string,
  coupon: OwnedCoupon
): Promise<string | null> {
  const payload = couponToRowPayload(coupon, coupleId);

  const { data: existing, error: selErr } = await supabase
    .from('reward_card_records')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('local_id', coupon.id)
    .maybeSingle();

  if (selErr) {
    console.error(`${LOG} upsert select failed:`, selErr.message);
    throw selErr;
  }

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from('reward_card_records')
      .update(payload)
      .eq('id', existing.id);
    if (upErr) {
      console.error(`${LOG} upsert update failed:`, upErr.message);
      throw upErr;
    }
    return existing.id as string;
  }

  const { data: ins, error: insErr } = await supabase
    .from('reward_card_records')
    .insert(payload)
    .select('id')
    .single();

  if (insErr) {
    console.error(`${LOG} upsert insert failed:`, insErr.message);
    throw insErr;
  }

  return (ins as { id: string } | null)?.id ?? null;
}

export async function pushRewardCardToRemote(
  supabase: SupabaseClient,
  coupleId: string,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  const remoteId = await upsertRewardCard(supabase, coupleId, coupon);
  return {
    ...coupon,
    remoteId: remoteId ?? coupon.remoteId ?? null,
    syncPending: false,
    syncError: null,
    remoteUpdatedAt: new Date().toISOString(),
  };
}

export async function pushRewardCardsToRemote(
  supabase: SupabaseClient,
  coupleId: string,
  rewards: RewardsData,
  options?: { pushAll?: boolean }
): Promise<RewardsData> {
  const pushAll = options?.pushAll ?? false;
  console.log(`${LOG} pushing coupons=${rewards.coupons.length} pushAll=${pushAll}`);
  let coupons = rewards.coupons;
  for (const c of rewards.coupons) {
    if (!pushAll && !c.syncPending && c.remoteId) continue;
    const updated = await pushRewardCardToRemote(supabase, coupleId, c);
    coupons = coupons.map((x) => (x.id === c.id ? updated : x));
  }
  return { ...rewards, coupons };
}

/** 雙向同步：清理舊完成卡券 → push → pull 合併 */
export async function syncRewardCards(
  supabase: SupabaseClient,
  coupleId: string,
  current?: RewardsData
): Promise<RewardsData> {
  const base = current ?? loadRewards();
  const { rewards: cleaned } = await cleanupOldCompletedRewardCards(supabase, coupleId, {
    syncRemote: true,
  });
  const pushed = await pushRewardCardsToRemote(supabase, coupleId, cleaned, { pushAll: true });
  const merged = await pullRewardCardsFromRemote(supabase, coupleId, pushed);
  saveRewards(merged);
  return merged;
}

export async function redeemRewardCard(
  supabase: SupabaseClient,
  coupleId: string,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  return pushRewardCardToRemote(supabase, coupleId, coupon);
}

export async function useRewardCard(
  supabase: SupabaseClient,
  coupleId: string,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  return pushRewardCardToRemote(supabase, coupleId, coupon);
}

export async function completeRewardCard(
  supabase: SupabaseClient,
  coupleId: string,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  return pushRewardCardToRemote(supabase, coupleId, coupon);
}

/** @deprecated use redeemRewardCard */
export const redeemRewardCardRemote = redeemRewardCard;
/** @deprecated use useRewardCard */
export const useRewardCardRemote = useRewardCard;
/** @deprecated use completeRewardCard */
export const completeRewardCardRemote = completeRewardCard;

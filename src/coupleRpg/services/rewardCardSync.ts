/**
 * Sync personal reward cards with Supabase public.user_reward_cards.
 * Cards are per-user (owner only); couple_activity_logs carries partner-visible events.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { COMPLETED_REWARD_CARD_RETENTION_DAYS } from '../constants/rewardCardRetention';
import { isCustomRewardCardId } from '../lib/customRewardCard';
import { normalizeOwnedCoupon } from '../lib/rewardCardModel';
import type { OwnedCoupon, RewardCardStatus, RewardsData } from '../storage/rewardTypes';
import { loadRewards, saveRewards } from '../storage/rewardsStore';
import { isCouponOwnedBy, stripForeignCoupons } from '../storage/rewardsStore';
import { canUseUserStorage } from '../storage/storageGuard';

export { COMPLETED_REWARD_CARD_RETENTION_DAYS };

const LOG = '[user-reward-card-sync]';
const TABLE = 'user_reward_cards';

const SELECT_COLS =
  'id, user_id, couple_id, local_id, reward_id, title, cost, status, card_type, emoji, note, description, is_custom, needs_partner_complete, redeemed_at, used_at, completed_at, cancelled_at, created_at, updated_at';

export type RewardCardSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export type UserRewardCardRow = {
  id: string;
  user_id: string;
  couple_id: string | null;
  local_id: string;
  reward_id: string;
  title: string;
  cost: number;
  status: RewardCardStatus;
  card_type: string | null;
  emoji: string | null;
  note: string | null;
  description: string | null;
  is_custom: boolean;
  needs_partner_complete: boolean;
  redeemed_at: string;
  used_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

/** @deprecated alias */
export type RewardCardRecordRow = UserRewardCardRow;

export function canSyncRewardCards(input: {
  configured: boolean;
  userId: string | null;
  coupleId?: string | null;
  online: boolean;
  isFullyBound?: boolean;
}): boolean {
  void input.coupleId;
  void input.isFullyBound;
  return Boolean(
    canUseUserStorage(input.userId) && input.configured && input.userId && input.online
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

function pruneExpiredCompletedFromRewards(rewards: RewardsData, userId: string | null): {
  rewards: RewardsData;
  removed: OwnedCoupon[];
} {
  const base = stripForeignCoupons(rewards, userId);
  const removed: OwnedCoupon[] = [];
  const coupons = base.coupons.filter((c) => {
    if (isEligibleForCompletedCleanup(c)) {
      removed.push(c);
      return false;
    }
    return true;
  });
  return { rewards: { ...base, coupons }, removed };
}

async function deleteRemoteExpiredCompleted(
  supabase: SupabaseClient,
  userId: string,
  removed: OwnedCoupon[]
): Promise<void> {
  for (const c of removed) {
    if (!isEligibleForCompletedCleanup(c)) continue;

    let query = supabase
      .from(TABLE)
      .delete()
      .eq('user_id', userId)
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

export async function cleanupOldCompletedRewardCards(
  supabase: SupabaseClient | null,
  userId: string | null,
  _coupleId?: string | null,
  options?: { syncRemote?: boolean }
): Promise<CleanupOldCompletedResult> {
  const cur = loadRewards();
  const { rewards: pruned, removed } = pruneExpiredCompletedFromRewards(cur, userId);
  const removedCount = removed.length;

  if (removedCount > 0) {
    saveRewards(pruned);
    console.log(`${LOG} cleaned ${removedCount} expired completed coupon(s) locally`);
  }

  if (options?.syncRemote && supabase && userId && removed.length > 0) {
    await deleteRemoteExpiredCompleted(supabase, userId, removed);
  }

  return { removedCount, rewards: pruned };
}

export function rowToCoupon(row: UserRewardCardRow): OwnedCoupon {
  const localId = rowLocalId(row);
  const itemId = row.reward_id;
  const category = (row.card_type ?? 'date') as OwnedCoupon['category'];
  const owner = row.user_id;
  return normalizeOwnedCoupon({
    id: localId,
    remoteId: row.id,
    itemId,
    cardId: itemId,
    cardTitle: row.title,
    cardType: row.card_type ?? category,
    title: row.title,
    emoji: row.emoji ?? '🎫',
    category,
    cost: row.cost ?? 0,
    redeemedBy: owner,
    ownerUserId: owner,
    usedBy: row.used_at ? owner : null,
    completedByUserId: row.completed_at ? owner : null,
    targetUser: null,
    redeemedAt: row.redeemed_at,
    usedAt: row.used_at,
    completedAt: row.completed_at,
    note: row.note,
    status: row.status,
    syncPending: false,
    remoteUpdatedAt: row.updated_at,
    isCustom: row.is_custom || isCustomRewardCardId(itemId),
    description: row.description ?? undefined,
    needsPartnerComplete: row.needs_partner_complete,
  });
}

export function couponToRowPayload(
  coupon: OwnedCoupon,
  userId: string,
  coupleId: string | null
) {
  const c = normalizeOwnedCoupon(coupon);
  const owner = c.ownerUserId ?? c.redeemedBy ?? userId;
  return {
    user_id: owner,
    couple_id: coupleId,
    local_id: c.id,
    reward_id: c.cardId,
    title: c.cardTitle,
    cost: c.cost,
    status: c.status,
    card_type: c.cardType,
    emoji: c.emoji,
    note: c.note,
    description: c.description ?? null,
    is_custom: Boolean(c.isCustom),
    needs_partner_complete: Boolean(c.needsPartnerComplete),
    redeemed_at: c.redeemedAt,
    used_at: c.usedAt,
    completed_at: c.completedAt,
    cancelled_at: c.status === 'cancelled' ? c.completedAt ?? new Date().toISOString() : null,
  };
}

export function mergeRemoteRewardCards(
  local: OwnedCoupon[],
  remoteRows: UserRewardCardRow[]
): OwnedCoupon[] {
  const byId = new Map<string, OwnedCoupon>();

  for (const row of remoteRows) {
    const r = rowToCoupon(row);
    if (r.id) byId.set(r.id, r);
  }

  for (const lo of local) {
    const L = normalizeOwnedCoupon(lo);
    if (!L.id) continue;

    const remote = byId.get(L.id);
    if (remote?.remoteId) {
      if (L.syncPending && !L.remoteId) {
        byId.set(L.id, { ...remote, syncPending: false, syncError: null });
      }
      continue;
    }

    if (L.syncPending) {
      byId.set(L.id, L);
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  );
}

export function applyRemoteRewardRowsToRewards(
  current: RewardsData,
  userId: string,
  remoteRows: UserRewardCardRow[]
): RewardsData {
  const mine = current.coupons.filter((c) => isCouponOwnedBy(c, userId));
  const merged = mergeRemoteRewardCards(mine, remoteRows);
  return { ...current, coupons: merged };
}

export async function getRemoteRewardCards(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRewardCardRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLS)
    .eq('user_id', userId)
    .order('redeemed_at', { ascending: false });

  if (error) {
    console.error(`${LOG} getRemote failed:`, error.message);
    throw error;
  }

  return (data ?? []) as UserRewardCardRow[];
}

export async function pullRewardCardsFromRemote(
  supabase: SupabaseClient,
  userId: string,
  current: RewardsData
): Promise<RewardsData> {
  console.log(`${LOG} pulling user=${userId}`);
  const rows = await getRemoteRewardCards(supabase, userId);
  console.log(`${LOG} pull count = ${rows.length}`);
  const merged = applyRemoteRewardRowsToRewards(current, userId, rows);
  const stripped = stripForeignCoupons(merged, userId);
  saveRewards(stripped);
  return stripped;
}

async function upsertUserRewardCard(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string | null,
  coupon: OwnedCoupon
): Promise<string | null> {
  const payload = couponToRowPayload(coupon, userId, coupleId);

  const { data: existing, error: selErr } = await supabase
    .from(TABLE)
    .select('id')
    .eq('user_id', userId)
    .eq('local_id', coupon.id)
    .maybeSingle();

  if (selErr) {
    console.error(`${LOG} upsert select failed:`, selErr.message);
    throw selErr;
  }

  if (existing?.id) {
    const { error: upErr } = await supabase.from(TABLE).update(payload).eq('id', existing.id);
    if (upErr) {
      console.error(`${LOG} upsert update failed:`, upErr.message);
      throw upErr;
    }
    return existing.id as string;
  }

  const { data: ins, error: insErr } = await supabase
    .from(TABLE)
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
  userId: string,
  coupleId: string | null,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  const remoteId = await upsertUserRewardCard(supabase, userId, coupleId, coupon);
  const c = normalizeOwnedCoupon(coupon);
  return {
    ...c,
    remoteId: remoteId ?? c.remoteId ?? null,
    syncPending: false,
    syncError: null,
    remoteUpdatedAt: new Date().toISOString(),
  };
}

export async function pushRewardCardsToRemote(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string | null,
  rewards: RewardsData
): Promise<RewardsData> {
  const mine = stripForeignCoupons(rewards, userId);
  let coupons = mine.coupons;
  for (const c of mine.coupons) {
    if (!c.syncPending && c.remoteId) continue;
    const updated = await pushRewardCardToRemote(supabase, userId, coupleId, c);
    coupons = coupons.map((x) => (x.id === c.id ? updated : x));
  }
  return { ...mine, coupons };
}

export async function syncRewardCards(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string | null,
  current?: RewardsData
): Promise<RewardsData> {
  const base = stripForeignCoupons(current ?? loadRewards(), userId);
  const { rewards: cleaned } = await cleanupOldCompletedRewardCards(supabase, userId, coupleId, {
    syncRemote: true,
  });
  await pushRewardCardsToRemote(supabase, userId, coupleId, cleaned);
  return pullRewardCardsFromRemote(supabase, userId, cleaned);
}

export async function redeemRewardCard(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string | null,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  return pushRewardCardToRemote(supabase, userId, coupleId, coupon);
}

export async function useRewardCard(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string | null,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  return pushRewardCardToRemote(supabase, userId, coupleId, coupon);
}

export async function completeRewardCard(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string | null,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  return pushRewardCardToRemote(supabase, userId, coupleId, coupon);
}

/** @deprecated use redeemRewardCard */
export const redeemRewardCardRemote = redeemRewardCard;
/** @deprecated use useRewardCard */
export const useRewardCardRemote = useRewardCard;
/** @deprecated use completeRewardCard */
export const completeRewardCardRemote = completeRewardCard;

/**
 * Sync reward card records with Supabase public.reward_card_records.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { isCustomRewardCardId } from '../lib/customRewardCard';
import { pickPreferredStatus, STATUS_PROGRESS } from '../lib/rewardCardHelpers';
import type { OwnedCoupon, RewardCardStatus, RewardsData } from '../storage/rewardTypes';

const LOG = '[reward-card-sync]';

export type RewardCardRecordRow = {
  id: string;
  couple_id: string;
  client_id: string;
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

export function rowToCoupon(row: RewardCardRecordRow): OwnedCoupon {
  const itemId = row.card_id as OwnedCoupon['itemId'];
  const category = (row.card_type ?? 'date') as OwnedCoupon['category'];
  return {
    id: row.client_id,
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
    isCustom: isCustomRewardCardId(itemId),
  };
}

export function couponToRowPayload(coupon: OwnedCoupon, coupleId: string) {
  return {
    couple_id: coupleId,
    client_id: coupon.id,
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
  const status = pickPreferredStatus(local.status, remote.status);
  const preferRemote = STATUS_PROGRESS[remote.status] >= STATUS_PROGRESS[local.status];
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
    syncPending: local.syncPending && !remote.remoteId,
  };
}

export function mergeRemoteRewardCards(local: OwnedCoupon[], remoteRows: RewardCardRecordRow[]): OwnedCoupon[] {
  const remoteCoupons = remoteRows.map(rowToCoupon);
  const byId = new Map<string, OwnedCoupon>();

  for (const r of remoteCoupons) {
    byId.set(r.id, r);
  }

  for (const lo of local) {
    const existing = byId.get(lo.id);
    if (existing) {
      byId.set(lo.id, mergeTwoCoupons(lo, existing));
    } else {
      byId.set(lo.id, lo);
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  );
}

export function getRewardCards(rewards: RewardsData): OwnedCoupon[] {
  return rewards.coupons;
}

export async function pullRewardCardsFromRemote(
  supabase: SupabaseClient,
  coupleId: string,
  current: RewardsData
): Promise<RewardsData> {
  console.log(`${LOG} pulling`);
  const { data, error } = await supabase
    .from('reward_card_records')
    .select(
      'id, couple_id, client_id, card_id, card_title, card_type, status, redeemed_by, used_by, target_user, redeemed_at, used_at, completed_at, note, cost, emoji, created_at, updated_at'
    )
    .eq('couple_id', coupleId)
    .order('redeemed_at', { ascending: false });

  if (error) {
    console.error(`${LOG} pull failed:`, error.message);
    throw error;
  }

  const rows = (data ?? []) as RewardCardRecordRow[];
  console.log(`${LOG} pull count = ${rows.length}`);
  const merged = mergeRemoteRewardCards(current.coupons, rows);
  return { ...current, coupons: merged };
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
    .eq('client_id', coupon.id)
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
  return { ...coupon, remoteId: remoteId ?? coupon.remoteId ?? null, syncPending: false };
}

export async function pushRewardCardsToRemote(
  supabase: SupabaseClient,
  coupleId: string,
  rewards: RewardsData
): Promise<RewardsData> {
  console.log(`${LOG} pushing pending/all count = ${rewards.coupons.length}`);
  let coupons = rewards.coupons;
  for (const c of rewards.coupons) {
    if (!c.syncPending && c.remoteId) continue;
    const updated = await pushRewardCardToRemote(supabase, coupleId, c);
    coupons = coupons.map((x) => (x.id === c.id ? updated : x));
  }
  return { ...rewards, coupons };
}

export async function redeemRewardCardRemote(
  supabase: SupabaseClient,
  coupleId: string,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  return pushRewardCardToRemote(supabase, coupleId, coupon);
}

export async function useRewardCardRemote(
  supabase: SupabaseClient,
  coupleId: string,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  return pushRewardCardToRemote(supabase, coupleId, coupon);
}

export async function completeRewardCardRemote(
  supabase: SupabaseClient,
  coupleId: string,
  coupon: OwnedCoupon
): Promise<OwnedCoupon> {
  return pushRewardCardToRemote(supabase, coupleId, coupon);
}

/**
 * Couple-space shared plan (Supabase couple_subscriptions + local fallback).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserPlan, isProUser, setUserPlan, type UserPlan } from '../storage/planStore';

const LOG = '[couple-plan]';

export type CoupleSubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'expired';

export type CoupleSubscriptionRow = {
  id: string;
  couple_id: string;
  plan: UserPlan;
  status: CoupleSubscriptionStatus;
  billing_owner: string | null;
  provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type CouplePlanSource = 'local' | 'couple' | 'default';

export type CouplePlanSnapshot = {
  plan: UserPlan;
  isPro: boolean;
  source: CouplePlanSource;
  coupleId: string | null;
  isShared: boolean;
  subscription: CoupleSubscriptionRow | null;
};

export type CouplePlanSyncInput = {
  configured: boolean;
  supabase: SupabaseClient | null;
  userId: string | null;
  coupleId: string | null;
  isFullyBound: boolean;
  online: boolean;
};

function normPlan(raw: string | null | undefined): UserPlan {
  return raw === 'pro' ? 'pro' : 'free';
}

function normStatus(raw: string | null | undefined): CoupleSubscriptionStatus {
  if (raw === 'trialing' || raw === 'cancelled' || raw === 'expired') return raw;
  return 'active';
}

export function isCoupleProSubscription(row: CoupleSubscriptionRow | null): boolean {
  if (!row) return false;
  return row.plan === 'pro' && (row.status === 'active' || row.status === 'trialing');
}

export function isCouplePro(snapshot: CouplePlanSnapshot): boolean {
  return snapshot.isPro;
}

/** 是否應以情侶空間訂閱為準（已登入、已綁定、可連線） */
export function shouldUseCoupleSubscription(input: CouplePlanSyncInput): boolean {
  return Boolean(
    input.configured &&
      input.supabase &&
      input.userId &&
      input.coupleId &&
      input.isFullyBound &&
      input.online
  );
}

function localSnapshot(): CouplePlanSnapshot {
  const plan = getUserPlan();
  return {
    plan,
    isPro: isProUser(plan),
    source: 'local',
    coupleId: null,
    isShared: false,
    subscription: null,
  };
}

function snapshotFromRow(row: CoupleSubscriptionRow | null, coupleId: string): CouplePlanSnapshot {
  const plan = row ? normPlan(row.plan) : 'free';
  const isPro = isCoupleProSubscription(row);
  return {
    plan,
    isPro,
    source: 'couple',
    coupleId,
    isShared: true,
    subscription: row,
  };
}

export async function fetchCoupleSubscription(
  supabase: SupabaseClient,
  coupleId: string
): Promise<CoupleSubscriptionRow | null> {
  const { data, error } = await supabase
    .from('couple_subscriptions')
    .select(
      'id, couple_id, plan, status, billing_owner, provider, provider_customer_id, provider_subscription_id, current_period_start, current_period_end, created_at, updated_at'
    )
    .eq('couple_id', coupleId)
    .maybeSingle();

  if (error) {
    console.error(`${LOG} fetch failed:`, error.message);
    throw error;
  }

  if (!data) return null;

  const r = data as Record<string, unknown>;
  return {
    id: String(r.id),
    couple_id: String(r.couple_id),
    plan: normPlan(String(r.plan)),
    status: normStatus(String(r.status)),
    billing_owner: r.billing_owner != null ? String(r.billing_owner) : null,
    provider: r.provider != null ? String(r.provider) : null,
    provider_customer_id:
      r.provider_customer_id != null ? String(r.provider_customer_id) : null,
    provider_subscription_id:
      r.provider_subscription_id != null ? String(r.provider_subscription_id) : null,
    current_period_start:
      r.current_period_start != null ? String(r.current_period_start) : null,
    current_period_end: r.current_period_end != null ? String(r.current_period_end) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

/**
 * 取得目前方案：已綁定情侶且可連線時讀 Supabase，否則 localStorage。
 */
export async function getCouplePlan(input: CouplePlanSyncInput): Promise<CouplePlanSnapshot> {
  if (!shouldUseCoupleSubscription(input)) {
    return localSnapshot();
  }

  const coupleId = input.coupleId!;
  const supabase = input.supabase!;

  try {
    const row = await fetchCoupleSubscription(supabase, coupleId);
    const snap = snapshotFromRow(row, coupleId);
    setUserPlan(snap.plan);
    return snap;
  } catch (e) {
    console.warn(`${LOG} getCouplePlan fallback local:`, e);
    return localSnapshot();
  }
}

function trialPeriodEndIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString();
}

async function upsertCoupleSubscription(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string,
  plan: UserPlan,
  status: CoupleSubscriptionStatus
): Promise<CoupleSubscriptionRow> {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    couple_id: coupleId,
    plan,
    status,
    billing_owner: userId,
    provider: 'manual',
    updated_at: now,
  };

  if (plan === 'pro' && (status === 'trialing' || status === 'active')) {
    payload.current_period_start = now;
    payload.current_period_end = trialPeriodEndIso();
  }

  const { data: existing, error: selErr } = await supabase
    .from('couple_subscriptions')
    .select('id')
    .eq('couple_id', coupleId)
    .maybeSingle();

  if (selErr) throw selErr;

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from('couple_subscriptions')
      .update(payload)
      .eq('id', existing.id as string);
    if (upErr) throw upErr;
  } else {
    const { error: insErr } = await supabase.from('couple_subscriptions').insert(payload);
    if (insErr) throw insErr;
  }

  const row = await fetchCoupleSubscription(supabase, coupleId);
  if (!row) throw new Error('subscription upsert succeeded but row missing');
  return row;
}

/** 先體驗 Pro：寫入情侶空間訂閱（trialing） */
export async function activateCoupleProTrial(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string
): Promise<CoupleSubscriptionRow> {
  console.log(`${LOG} activate trial couple_id=${coupleId}`);
  const row = await upsertCoupleSubscription(supabase, coupleId, userId, 'pro', 'trialing');
  setUserPlan('pro');
  return row;
}

/** 開發測試：切換情侶空間方案 */
export async function setCouplePlanForTesting(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string,
  plan: UserPlan
): Promise<CoupleSubscriptionRow> {
  const status: CoupleSubscriptionStatus = plan === 'pro' ? 'active' : 'active';
  const row = await upsertCoupleSubscription(supabase, coupleId, userId, plan, status);
  setUserPlan(plan);
  return row;
}

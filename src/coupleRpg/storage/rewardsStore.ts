import { makeId } from '../lib/id';
import { todayKey, timeLabel, weekKey } from '../lib/dates';
import { needsPartnerCompletion } from '../lib/rewardCardHelpers';
import { getShopItem } from '../data/rewardShopCatalog';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import type {
  CoinEarnMeta,
  LoveCoinEarnRecord,
  OwnedCoupon,
  RewardCardStatus,
  RewardsData,
  ShopItemId,
} from './rewardTypes';
import { DEFAULT_REWARDS_DATA } from './rewardTypes';
import type { CompletionRecord, CoupleProfile, PartnerId, RpgState } from './types';
import type { WeeklyHouseworkStats } from './houseworkStore';

function migrateCoupon(raw: Partial<OwnedCoupon> & Record<string, unknown>): OwnedCoupon | null {
  const id = String(raw.id ?? '');
  if (!id) return null;

  const itemId = (raw.itemId ?? raw.cardId) as ShopItemId;
  const title = String(raw.title ?? raw.cardTitle ?? '');
  const emoji = String(raw.emoji ?? '🎫');
  const category = (raw.category ?? 'date') as OwnedCoupon['category'];
  const cost = Number(raw.cost ?? 0);

  let status: RewardCardStatus;
  const legacy = raw.status as string | undefined;
  if (legacy === 'active') status = 'redeemed';
  else if (legacy === 'used' && !raw.completedAt) status = 'used';
  else if (legacy === 'redeemed' || legacy === 'used' || legacy === 'completed' || legacy === 'cancelled') {
    status = legacy as RewardCardStatus;
  } else {
    status = 'redeemed';
  }

  const redeemedAt = String(raw.redeemedAt ?? raw.acquiredAt ?? new Date().toISOString());

  return {
    id,
    remoteId: raw.remoteId != null ? String(raw.remoteId) : null,
    itemId,
    cardId: itemId,
    cardTitle: String(raw.cardTitle ?? title),
    cardType: String(raw.cardType ?? category),
    title,
    emoji,
    category,
    cost,
    redeemedBy: raw.redeemedBy != null ? String(raw.redeemedBy) : null,
    usedBy: raw.usedBy != null ? String(raw.usedBy) : null,
    targetUser: raw.targetUser != null ? String(raw.targetUser) : null,
    redeemedAt,
    usedAt: raw.usedAt != null ? String(raw.usedAt) : null,
    completedAt: raw.completedAt != null ? String(raw.completedAt) : null,
    note: raw.note != null ? String(raw.note) : null,
    status,
    syncPending: Boolean(raw.syncPending),
  };
}

export function loadRewards(): RewardsData {
  const raw = loadJson<RewardsData>(LQ_KEYS.rewards, DEFAULT_REWARDS_DATA());
  const coupons = (raw.coupons ?? [])
    .map((c) => migrateCoupon(c as Partial<OwnedCoupon> & Record<string, unknown>))
    .filter((c): c is OwnedCoupon => c != null);

  return {
    ...DEFAULT_REWARDS_DATA(),
    ...raw,
    earnHistory: raw.earnHistory ?? [],
    coupons,
    todayEarnedDate: raw.todayEarnedDate ?? '',
    todayEarnedCoins: raw.todayEarnedCoins ?? 0,
  };
}

export function saveRewards(data: RewardsData): void {
  saveJson(LQ_KEYS.rewards, data);
}

export function addCoinEarn(
  rewards: RewardsData,
  coins: number,
  meta: CoinEarnMeta
): RewardsData {
  if (coins <= 0) return rewards;
  const today = todayKey();
  const entry: LoveCoinEarnRecord = {
    id: makeId(),
    date: today,
    time: timeLabel(),
    source: meta.source,
    title: meta.title,
    emoji: meta.emoji,
    coins,
  };
  const todayEarnedCoins =
    rewards.todayEarnedDate === today ? rewards.todayEarnedCoins + coins : coins;

  return {
    ...rewards,
    earnHistory: [entry, ...rewards.earnHistory].slice(0, 80),
    todayEarnedDate: today,
    todayEarnedCoins,
  };
}

export function getRecentEarns(rewards: RewardsData, limit = 8): LoveCoinEarnRecord[] {
  return rewards.earnHistory.slice(0, limit);
}

export function getCouponsByStatus(rewards: RewardsData, status: RewardCardStatus): OwnedCoupon[] {
  return rewards.coupons.filter((c) => c.status === status);
}

/** @deprecated 使用 getCouponsByStatus('redeemed') */
export function getActiveCoupons(rewards: RewardsData): OwnedCoupon[] {
  return getCouponsByStatus(rewards, 'redeemed');
}

/** @deprecated 使用 getCouponsByStatus('used') 或 completed */
export function getUsedCoupons(rewards: RewardsData): OwnedCoupon[] {
  return rewards.coupons.filter((c) => c.status === 'used' || c.status === 'completed');
}

export function findCoupon(rewards: RewardsData, couponId: string): OwnedCoupon | undefined {
  return rewards.coupons.find((c) => c.id === couponId);
}

export function redeemCoupon(
  rewards: RewardsData,
  itemId: ShopItemId,
  balance: number,
  redeemedBy: string | null
): { rewards: RewardsData; coupon: OwnedCoupon | null; error?: string } {
  const item = getShopItem(itemId);
  if (!item) return { rewards, coupon: null, error: 'invalid_item' };
  if (balance < item.cost) return { rewards, coupon: null, error: 'insufficient_coins' };

  const now = new Date().toISOString();
  const coupon: OwnedCoupon = {
    id: makeId(),
    remoteId: null,
    itemId: item.id,
    cardId: item.id,
    cardTitle: item.title,
    cardType: item.category,
    title: item.title,
    emoji: item.emoji,
    category: item.category,
    cost: item.cost,
    redeemedBy,
    usedBy: null,
    targetUser: null,
    redeemedAt: now,
    usedAt: null,
    completedAt: null,
    note: null,
    status: 'redeemed',
    syncPending: true,
  };

  return {
    rewards: {
      ...rewards,
      coupons: [coupon, ...rewards.coupons].slice(0, 100),
    },
    coupon,
  };
}

export function useRewardCardLocal(
  rewards: RewardsData,
  couponId: string,
  usedBy: string | null,
  targetUser: string | null
): { rewards: RewardsData; coupon: OwnedCoupon | null; error?: string } {
  const cur = findCoupon(rewards, couponId);
  if (!cur) return { rewards, coupon: null, error: 'not_found' };
  if (cur.status !== 'redeemed') return { rewards, coupon: null, error: 'invalid_status' };

  const now = new Date().toISOString();
  const autoComplete = !needsPartnerCompletion(cur.category, cur.itemId);
  const updated: OwnedCoupon = {
    ...cur,
    status: autoComplete ? 'completed' : 'used',
    usedBy,
    targetUser,
    usedAt: now,
    completedAt: autoComplete ? now : null,
    syncPending: true,
  };

  return {
    rewards: {
      ...rewards,
      coupons: rewards.coupons.map((c) => (c.id === couponId ? updated : c)),
    },
    coupon: updated,
  };
}

export function completeRewardCardLocal(
  rewards: RewardsData,
  couponId: string
): { rewards: RewardsData; coupon: OwnedCoupon | null; error?: string } {
  const cur = findCoupon(rewards, couponId);
  if (!cur) return { rewards, coupon: null, error: 'not_found' };
  if (cur.status !== 'used') return { rewards, coupon: null, error: 'invalid_status' };

  const now = new Date().toISOString();
  const updated: OwnedCoupon = {
    ...cur,
    status: 'completed',
    completedAt: now,
    syncPending: true,
  };

  return {
    rewards: {
      ...rewards,
      coupons: rewards.coupons.map((c) => (c.id === couponId ? updated : c)),
    },
    coupon: updated,
  };
}

export function upsertCouponInRewards(rewards: RewardsData, coupon: OwnedCoupon): RewardsData {
  const idx = rewards.coupons.findIndex((c) => c.id === coupon.id);
  if (idx >= 0) {
    const next = [...rewards.coupons];
    next[idx] = coupon;
    return { ...rewards, coupons: next };
  }
  return { ...rewards, coupons: [coupon, ...rewards.coupons].slice(0, 100) };
}

export function replaceCouponsFromMerge(rewards: RewardsData, coupons: OwnedCoupon[]): RewardsData {
  return { ...rewards, coupons: coupons.slice(0, 100) };
}

/** @deprecated */
export function markCouponUsed(rewards: RewardsData, couponId: string): RewardsData {
  const r = useRewardCardLocal(rewards, couponId, null, null);
  return r.rewards;
}

export function processDailyLogin(state: RpgState): {
  state: RpgState;
  coinsEarned: number;
  isNewDay: boolean;
} {
  const today = todayKey();
  if (state.lastLoginDate === today) {
    return { state, coinsEarned: 0, isNewDay: false };
  }

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return todayKey(d);
  })();

  const loginStreak = state.lastLoginDate === yesterday ? state.loginStreak + 1 : 1;

  return {
    state: {
      ...state,
      lastLoginDate: today,
      loginStreak,
    },
    coinsEarned: 0,
    isNewDay: true,
  };
}

export type WeeklyTitles = {
  houseworkKing: { name: string; emoji: string; count: number } | null;
  sweetheart: string;
  weekLabel: string;
};

export function getWeeklyTitles(
  weeklyStats: WeeklyHouseworkStats,
  completionHistory: CompletionRecord[],
  couple: CoupleProfile
): WeeklyTitles {
  const wk = weekKey();
  const weekCompletions = completionHistory.filter((r) => {
    const d = new Date(r.date);
    return weekKey(d) === wk;
  });

  const careCount = weekCompletions.filter((r) => r.kind === 'task' || r.kind === 'game').length;

  let houseworkKing: WeeklyTitles['houseworkKing'] = null;
  const a = weeklyStats.byPartner.A;
  const b = weeklyStats.byPartner.B;
  if (weeklyStats.total > 0) {
    if (a >= b && a > 0) {
      houseworkKing = { name: couple.nameA, emoji: couple.emojiA, count: a };
    } else if (b > 0) {
      houseworkKing = { name: couple.nameB, emoji: couple.emojiB, count: b };
    }
  }

  let sweetheart: string;
  if (careCount >= 5) sweetheart = '超級貼心搭檔 💗';
  else if (careCount >= 2) sweetheart = '本週最暖情侶 ✨';
  else if (careCount >= 1) sweetheart = '甜蜜起步中 🌱';
  else sweetheart = '本週一起加油 💪';

  return { houseworkKing, sweetheart, weekLabel: wk };
}

export function partnerLabel(couple: CoupleProfile, id: PartnerId): string {
  return id === 'A' ? couple.nameA : couple.nameB;
}

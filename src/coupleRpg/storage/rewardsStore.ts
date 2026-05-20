import { makeId } from '../lib/id';
import { todayKey, timeLabel, weekKey } from '../lib/dates';
import { getShopItem } from '../data/rewardShopCatalog';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import type {
  CoinEarnMeta,
  LoveCoinEarnRecord,
  OwnedCoupon,
  RewardsData,
  ShopItemId,
} from './rewardTypes';
import { DEFAULT_REWARDS_DATA } from './rewardTypes';
import type { CompletionRecord, CoupleProfile, PartnerId, RpgState } from './types';
import type { WeeklyHouseworkStats } from './houseworkStore';

export function loadRewards(): RewardsData {
  const raw = loadJson(LQ_KEYS.rewards, DEFAULT_REWARDS_DATA());
  return {
    ...DEFAULT_REWARDS_DATA(),
    ...raw,
    earnHistory: raw.earnHistory ?? [],
    coupons: raw.coupons ?? [],
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

export function getActiveCoupons(rewards: RewardsData): OwnedCoupon[] {
  return rewards.coupons.filter((c) => c.status === 'active');
}

export function getUsedCoupons(rewards: RewardsData): OwnedCoupon[] {
  return rewards.coupons.filter((c) => c.status === 'used');
}

export function redeemCoupon(
  rewards: RewardsData,
  itemId: ShopItemId,
  balance: number
): { rewards: RewardsData; coupon: OwnedCoupon | null; error?: string } {
  const item = getShopItem(itemId);
  if (!item) return { rewards, coupon: null, error: 'invalid_item' };
  if (balance < item.cost) return { rewards, coupon: null, error: 'insufficient_coins' };

  const coupon: OwnedCoupon = {
    id: makeId(),
    itemId: item.id,
    title: item.title,
    emoji: item.emoji,
    category: item.category,
    cost: item.cost,
    acquiredAt: new Date().toISOString(),
    usedAt: null,
    status: 'active',
  };

  return {
    rewards: {
      ...rewards,
      coupons: [coupon, ...rewards.coupons].slice(0, 100),
    },
    coupon,
  };
}

export function markCouponUsed(rewards: RewardsData, couponId: string): RewardsData {
  return {
    ...rewards,
    coupons: rewards.coupons.map((c) =>
      c.id === couponId
        ? { ...c, status: 'used' as const, usedAt: new Date().toISOString() }
        : c
    ),
  };
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

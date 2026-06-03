/**
 * 登入後還原防刷帳本與情侶 EXP（登出保留 user-scoped ledger / exp 時使用）。
 */
import { levelFromTotalExp } from './coupleLevel';
import {
  buildRewardScopeKey,
  loadDailyRewardLedger,
  migrateLegacyRewardsIntoLedger,
  saveDailyRewardLedger,
  type DailyDayRewardRecord,
  type DailyRewardScopeRecord,
  type LedgerContext,
} from '../storage/dailyRewardLedgerStore';
import {
  getCoupleExpView,
  loadCoupleExpStore,
  migrateLegacyRpgXpIntoExp,
  saveCoupleExpStore,
  type CoupleExpScopeRecord,
} from '../storage/coupleExpStore';
import { getActiveStorageUserId } from '../storage/storageSession';
import { todayKey } from './dates';

function mergeDayRecords(a: DailyDayRewardRecord, b: DailyDayRewardRecord): DailyDayRewardRecord {
  const slots = a.loveTaskSlotsClaimed.map((v, i) => v || Boolean(b.loveTaskSlotsClaimed[i]));
  return {
    loveTaskSlotsClaimed: slots,
    loveTaskAllComplete: a.loveTaskAllComplete || b.loveTaskAllComplete,
    miniGameRewardCount: Math.max(a.miniGameRewardCount, b.miniGameRewardCount),
    loveFlameRecorded: a.loveFlameRecorded || b.loveFlameRecorded,
    level3ComboClaimed: a.level3ComboClaimed || b.level3ComboClaimed,
  };
}

function mergeScopeRecords(
  from: DailyRewardScopeRecord,
  into: DailyRewardScopeRecord
): DailyRewardScopeRecord {
  const days: Record<string, DailyDayRewardRecord> = { ...into.days };
  for (const [dk, rec] of Object.entries(from.days)) {
    days[dk] = days[dk] ? mergeDayRecords(rec, days[dk]!) : rec;
  }
  const milestones = new Set([...into.claimedFlameMilestones, ...from.claimedFlameMilestones]);
  const currentStreak = Math.max(from.currentStreak, into.currentStreak);
  const longestStreak = Math.max(from.longestStreak, into.longestStreak);
  const lastInteractionDate =
    [from.lastInteractionDate, into.lastInteractionDate].filter(Boolean).sort().pop() ?? null;

  return {
    lastInteractionDate,
    currentStreak,
    longestStreak,
    claimedFlameMilestones: [...milestones].sort((a, b) => a - b),
    days,
  };
}

function mergeExpScopes(from: CoupleExpScopeRecord, into: CoupleExpScopeRecord): CoupleExpScopeRecord {
  const days = { ...into.days };
  for (const [dk, rec] of Object.entries(from.days)) {
    const existing = days[dk];
    if (!existing) {
      days[dk] = rec;
      continue;
    }
    const claims = { ...existing.claims, ...rec.claims };
    days[dk] = {
      expEarned: Math.max(existing.expEarned, rec.expEarned),
      claims,
    };
  }
  const weeklyExpClaims = { ...into.weeklyExpClaims, ...from.weeklyExpClaims };
  const totalExp = Math.max(from.totalExp, into.totalExp);
  const shown = new Set([...into.levelUpShownLevels, ...from.levelUpShownLevels]);
  return {
    totalExp,
    lastLevelUpAt: from.lastLevelUpAt ?? into.lastLevelUpAt,
    levelUpShownLevels: [...shown].sort((a, b) => a - b),
    days,
    weeklyExpClaims,
  };
}

/** 情侶空間載入後，將 solo scope 合併進已綁定的 couple scope（避免短暫顯示 0/2）。 */
export function mergeSoloRewardScopesIntoCouple(ctx: LedgerContext): void {
  if (!ctx.userId || !ctx.coupleId) return;
  const soloKey = buildRewardScopeKey(ctx.userId, null);
  const boundKey = buildRewardScopeKey(ctx.userId, ctx.coupleId);
  if (soloKey === boundKey) return;

  const ledger = loadDailyRewardLedger();
  const soloScope = ledger.scopes[soloKey];
  if (soloScope) {
    const boundScope = ledger.scopes[boundKey];
    ledger.scopes[boundKey] = boundScope
      ? mergeScopeRecords(soloScope, boundScope)
      : soloScope;
    saveDailyRewardLedger(ledger);
  }

  const expStore = loadCoupleExpStore();
  const soloExp = expStore.scopes[soloKey];
  if (soloExp) {
    const boundExp = expStore.scopes[boundKey];
    expStore.scopes[boundKey] = boundExp ? mergeExpScopes(soloExp, boundExp) : soloExp;
    saveCoupleExpStore(expStore);
  }
}

export type RestoreLoveQuestRewardStateResult = {
  totalExp: number;
  level: number;
};

/**
 * 登入且 userId 可用後呼叫：遷移 legacy、合併 solo→couple scope、還原今日帳本與 EXP。
 */
export function restoreLoveQuestRewardState(
  ctx: LedgerContext,
  options?: { legacyRpgXp?: number }
): RestoreLoveQuestRewardStateResult {
  const active = getActiveStorageUserId();
  if (!active || !ctx.userId || active !== ctx.userId) {
    return { totalExp: 0, level: 1 };
  }

  mergeSoloRewardScopesIntoCouple(ctx);
  migrateLegacyRewardsIntoLedger(ctx);

  const legacyXp = Math.max(0, Math.floor(options?.legacyRpgXp ?? 0));
  if (legacyXp > 0) {
    migrateLegacyRpgXpIntoExp(ctx, legacyXp);
  }

  const view = getCoupleExpView(ctx, todayKey());
  return { totalExp: view.totalExp, level: levelFromTotalExp(view.totalExp) };
}

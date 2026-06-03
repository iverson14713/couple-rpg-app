/**
 * Phase 3D：本週情侶回顧卡（規則型統計，週一為週起點）
 */
import { getMiniGameDailyRewardCap } from './miniGameRewards';
import { enumerateWeekDateKeys, getWeekStartDateMonday } from './weekKeys';
import { loadChoreRewardClaims } from '../storage/choreRewardClaimsStore';
import {
  buildRewardScopeKey,
  getScopeRecord,
  type LedgerContext,
} from '../storage/dailyRewardLedgerStore';
import { LQ_KEYS } from '../storage/keys';
import { loadJson } from '../storage/persist';

export const MIN_COUPLE_LEVEL_WEEKLY_RECAP = 5;

export const WEEKLY_RECAP_UNLOCK_HINT =
  '升到 Lv.5 傳說情侶後，即可查看你們的每週情侶回顧。';

export const WEEKLY_RECAP_EMPTY_MESSAGE =
  '這週還沒有太多互動紀錄，完成戀愛任務、小遊戲或家事後，下週回顧會更豐富。';

export const WEEKLY_RECAP_FOOTER =
  '每一點小互動，都是你們感情升級的證明。';

export type CoupleWeeklyRecapStats = {
  interactionDays: number;
  loveTaskCount: number;
  miniGameCount: number;
  choreCount: number;
  weekExp: number;
};

export type CoupleWeeklyRecapView = {
  unlocked: boolean;
  weekStartDate: string;
  weekTitle: string;
  stats: CoupleWeeklyRecapStats;
  isEmpty: boolean;
  homeHintLine: string;
  levelCardLine: string | null;
  emptyMessage: string;
};

const EMPTY_STATS: CoupleWeeklyRecapStats = {
  interactionDays: 0,
  loveTaskCount: 0,
  miniGameCount: 0,
  choreCount: 0,
  weekExp: 0,
};

function countInteractionDaysInWeek(ctx: LedgerContext, weekStartDate: string): number {
  const ledgerScope = getScopeRecord(ctx);
  let total = 0;
  for (const dk of enumerateWeekDateKeys(weekStartDate)) {
    if (ledgerScope.days[dk]?.loveFlameRecorded) total += 1;
  }
  return total;
}

function countLoveTasksInWeek(ctx: LedgerContext, weekStartDate: string): number {
  const ledgerScope = getScopeRecord(ctx);
  let total = 0;
  for (const dk of enumerateWeekDateKeys(weekStartDate)) {
    const day = ledgerScope.days[dk];
    if (!day) continue;
    total += day.loveTaskSlotsClaimed.filter(Boolean).length;
  }
  return total;
}

function countMiniGamesInWeek(
  ctx: LedgerContext,
  weekStartDate: string,
  isPro: boolean
): number {
  const cap = getMiniGameDailyRewardCap(isPro);
  const ledgerScope = getScopeRecord(ctx);
  let total = 0;
  for (const dk of enumerateWeekDateKeys(weekStartDate)) {
    const day = ledgerScope.days[dk];
    if (!day) continue;
    total += Math.min(day.miniGameRewardCount, cap);
  }
  return total;
}

function countChoresInWeek(weekStartDate: string): number {
  const claims = loadChoreRewardClaims();
  let total = 0;
  for (const dk of enumerateWeekDateKeys(weekStartDate)) {
    total += claims.days[dk]?.claimedKeys.length ?? 0;
  }
  return total;
}

function countWeekExpInWeek(ctx: LedgerContext, weekStartDate: string): number {
  const expStore = loadJson<{
    scopes: Record<string, { days: Record<string, { expEarned?: number }> }>;
  }>(LQ_KEYS.coupleExp, { scopes: {} });
  const key = buildRewardScopeKey(ctx.userId, ctx.coupleId);
  const scope = expStore.scopes[key];
  if (!scope) return 0;
  let total = 0;
  for (const dk of enumerateWeekDateKeys(weekStartDate)) {
    const earned = scope.days[dk]?.expEarned;
    if (typeof earned === 'number' && earned > 0) total += Math.floor(earned);
  }
  return total;
}

function computeStats(
  ctx: LedgerContext,
  weekStartDate: string,
  isPro: boolean
): CoupleWeeklyRecapStats {
  return {
    interactionDays: countInteractionDaysInWeek(ctx, weekStartDate),
    loveTaskCount: countLoveTasksInWeek(ctx, weekStartDate),
    miniGameCount: countMiniGamesInWeek(ctx, weekStartDate, isPro),
    choreCount: countChoresInWeek(weekStartDate),
    weekExp: countWeekExpInWeek(ctx, weekStartDate),
  };
}

/** 規則型本週稱號（優先：互動 > 任務 > 小遊戲 > 家事 > 預設） */
export function pickWeeklyRecapTitle(stats: CoupleWeeklyRecapStats): string {
  if (stats.interactionDays >= 5) return '火苗守護者';
  if (stats.loveTaskCount >= 8) return '默契升溫中';
  if (stats.miniGameCount >= 10) return '玩心滿滿搭檔';
  if (stats.choreCount >= 5) return '生活神隊友';
  return '慢慢升溫中';
}

function isRecapEmpty(stats: CoupleWeeklyRecapStats): boolean {
  return (
    stats.interactionDays +
      stats.loveTaskCount +
      stats.miniGameCount +
      stats.choreCount +
      stats.weekExp ===
    0
  );
}

export function getCoupleWeeklyRecapView(
  ctx: LedgerContext,
  coupleLevel: number,
  isPro: boolean,
  refDate = new Date()
): CoupleWeeklyRecapView {
  const unlocked = coupleLevel >= MIN_COUPLE_LEVEL_WEEKLY_RECAP;
  const weekStartDate = getWeekStartDateMonday(refDate);

  try {
    const stats = computeStats(ctx, weekStartDate, isPro);
    const weekTitle = pickWeeklyRecapTitle(stats);
    const isEmpty = isRecapEmpty(stats);

    const homeHintLine = unlocked
      ? '本週情侶回顧已更新 →'
      : 'Lv.5 解鎖情侶回顧卡';

    const levelCardLine =
      unlocked && coupleLevel >= MIN_COUPLE_LEVEL_WEEKLY_RECAP
        ? `本週稱號：${weekTitle}`
        : null;

    return {
      unlocked,
      weekStartDate,
      weekTitle,
      stats,
      isEmpty,
      homeHintLine,
      levelCardLine,
      emptyMessage: WEEKLY_RECAP_EMPTY_MESSAGE,
    };
  } catch {
    return {
      unlocked,
      weekStartDate,
      weekTitle: '慢慢升溫中',
      stats: { ...EMPTY_STATS },
      isEmpty: true,
      homeHintLine: unlocked ? '本週情侶回顧已更新 →' : 'Lv.5 解鎖情侶回顧卡',
      levelCardLine: null,
      emptyMessage: WEEKLY_RECAP_EMPTY_MESSAGE,
    };
  }
}

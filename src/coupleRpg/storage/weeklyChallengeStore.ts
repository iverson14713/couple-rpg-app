/**
 * Phase 3C：每週情侶挑戰（user + couple scope，週一為週起點）
 */
import { getMiniGameDailyRewardCap } from '../lib/miniGameRewards';
import {
  challengeIdForWeek,
  getWeeklyChallengeDef,
  MIN_COUPLE_LEVEL_WEEKLY_CHALLENGE,
  WEEKLY_CHALLENGE_UNLOCK_HINT,
  type WeeklyChallengeDef,
} from '../data/weeklyChallenges';
import { enumerateWeekDateKeys, getWeekStartDateMonday } from '../lib/weekKeys';
import { loadChoreRewardClaims } from './choreRewardClaimsStore';
import {
  buildRewardScopeKey,
  getScopeRecord,
  isLedgerWritable,
  type LedgerContext,
} from './dailyRewardLedgerStore';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

const STORE_VERSION = 1;

export type WeeklyChallengeWeekRecord = {
  weekStartDate: string;
  challengeId: string;
  claimed: boolean;
  claimedAt: string | null;
};

export type WeeklyChallengeScopeRecord = {
  weeks: Record<string, WeeklyChallengeWeekRecord>;
};

export type WeeklyChallengeStoreData = {
  version: number;
  scopes: Record<string, WeeklyChallengeScopeRecord>;
};

export type WeeklyChallengeStatus = 'locked' | 'in_progress' | 'claimable' | 'claimed';

export type WeeklyChallengeView = {
  unlocked: boolean;
  weekStartDate: string;
  challenge: WeeklyChallengeDef;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  status: WeeklyChallengeStatus;
  homeHintLine: string;
  unlockLine: string;
};

export type ClaimWeeklyChallengeResult = {
  ok: boolean;
  alreadyClaimed: boolean;
  notUnlocked: boolean;
  notComplete: boolean;
  notWritable: boolean;
  loveCoins: number;
  expAmount: number;
  weekStartDate: string;
  challengeId: string;
};

function defaultScope(): WeeklyChallengeScopeRecord {
  return { weeks: {} };
}

function normalizeWeekRecord(raw: unknown): WeeklyChallengeWeekRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<WeeklyChallengeWeekRecord>;
  if (typeof o.weekStartDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.weekStartDate)) {
    return null;
  }
  const challengeId =
    typeof o.challengeId === 'string' && o.challengeId ? o.challengeId : challengeIdForWeek(o.weekStartDate);
  return {
    weekStartDate: o.weekStartDate,
    challengeId,
    claimed: Boolean(o.claimed),
    claimedAt: typeof o.claimedAt === 'string' && o.claimedAt ? o.claimedAt : null,
  };
}

function normalizeScope(raw: unknown): WeeklyChallengeScopeRecord {
  const weeks: Record<string, WeeklyChallengeWeekRecord> = {};
  if (raw && typeof raw === 'object') {
    const o = raw as Partial<WeeklyChallengeScopeRecord>;
    if (o.weeks && typeof o.weeks === 'object') {
      for (const [k, rec] of Object.entries(o.weeks)) {
        const norm = normalizeWeekRecord(rec);
        if (norm && norm.weekStartDate === k) weeks[k] = norm;
      }
    }
  }
  return { weeks };
}

export function loadWeeklyChallengeStore(): WeeklyChallengeStoreData {
  const raw = loadJson<unknown>(LQ_KEYS.weeklyChallenge, null);
  if (raw && typeof raw === 'object') {
    const o = raw as Partial<WeeklyChallengeStoreData>;
    if (o.scopes && typeof o.scopes === 'object') {
      const scopes: Record<string, WeeklyChallengeScopeRecord> = {};
      for (const [k, v] of Object.entries(o.scopes)) {
        scopes[k] = normalizeScope(v);
      }
      return { version: STORE_VERSION, scopes };
    }
  }
  return { version: STORE_VERSION, scopes: {} };
}

function saveWeeklyChallengeStore(data: WeeklyChallengeStoreData): void {
  saveJson(LQ_KEYS.weeklyChallenge, { version: STORE_VERSION, scopes: data.scopes });
}

function getScope(
  ctx: LedgerContext,
  store?: WeeklyChallengeStoreData
): WeeklyChallengeScopeRecord {
  const data = store ?? loadWeeklyChallengeStore();
  const key = buildRewardScopeKey(ctx.userId, ctx.coupleId);
  return data.scopes[key] ?? defaultScope();
}

function writeScope(
  ctx: LedgerContext,
  updater: (scope: WeeklyChallengeScopeRecord) => WeeklyChallengeScopeRecord
): WeeklyChallengeScopeRecord {
  const store = loadWeeklyChallengeStore();
  const key = buildRewardScopeKey(ctx.userId, ctx.coupleId);
  const prev = store.scopes[key] ?? defaultScope();
  const next = updater(prev);
  saveWeeklyChallengeStore({ ...store, scopes: { ...store.scopes, [key]: next } });
  return next;
}

function ensureWeekRecord(
  scope: WeeklyChallengeScopeRecord,
  weekStartDate: string
): WeeklyChallengeWeekRecord {
  const existing = scope.weeks[weekStartDate];
  if (existing) return existing;
  const challengeId = challengeIdForWeek(weekStartDate);
  return {
    weekStartDate,
    challengeId,
    claimed: false,
    claimedAt: null,
  };
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

function countMiniGamesInWeek(ctx: LedgerContext, weekStartDate: string, isPro: boolean): number {
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
    total += (claims.days[dk]?.claimedKeys.length ?? 0);
  }
  return total;
}

type CoupleExpScopeForDateCount = {
  days: Record<string, { claims: Record<string, true> } | undefined>;
};

function countDateIdeasInWeek(ctx: LedgerContext, weekStartDate: string): number {
  const expStore = loadJson<{ scopes: Record<string, CoupleExpScopeForDateCount> }>(
    LQ_KEYS.coupleExp,
    { scopes: {} }
  );
  const key = buildRewardScopeKey(ctx.userId, ctx.coupleId);
  const scope = expStore.scopes[key];
  if (!scope) return 0;
  let total = 0;
  for (const dk of enumerateWeekDateKeys(weekStartDate)) {
    const day = scope.days[dk];
    if (day?.claims.date) total += 1;
  }
  return total;
}

function countFlameDaysInWeek(ctx: LedgerContext, weekStartDate: string): number {
  const ledgerScope = getScopeRecord(ctx);
  let total = 0;
  for (const dk of enumerateWeekDateKeys(weekStartDate)) {
    const day = ledgerScope.days[dk];
    if (day?.loveFlameRecorded) total += 1;
  }
  return total;
}

export function computeWeeklyChallengeProgress(
  ctx: LedgerContext,
  challenge: WeeklyChallengeDef,
  weekStartDate: string,
  isPro: boolean
): number {
  switch (challenge.progressType) {
    case 'love_tasks':
      return countLoveTasksInWeek(ctx, weekStartDate);
    case 'mini_games':
      return countMiniGamesInWeek(ctx, weekStartDate, isPro);
    case 'chores':
      return countChoresInWeek(weekStartDate);
    case 'date_ideas':
      return countDateIdeasInWeek(ctx, weekStartDate);
    case 'flame_days':
      return countFlameDaysInWeek(ctx, weekStartDate);
    default:
      return 0;
  }
}

function buildHomeHintLine(
  unlocked: boolean,
  challenge: WeeklyChallengeDef,
  progress: number,
  target: number,
  claimed: boolean
): string {
  if (!unlocked) return 'Lv.4 解鎖每週情侶挑戰';
  if (claimed) return `本週挑戰：${challenge.title} 已完成`;
  return `本週挑戰：${challenge.title} ${Math.min(progress, target)}/${target}`;
}

export function getWeeklyChallengeView(
  ctx: LedgerContext,
  coupleLevel: number,
  isPro: boolean,
  refDate = new Date()
): WeeklyChallengeView {
  const weekStartDate = getWeekStartDateMonday(refDate);
  const unlocked = coupleLevel >= MIN_COUPLE_LEVEL_WEEKLY_CHALLENGE;
  let scope = getScope(ctx);
  if (!scope.weeks[weekStartDate]) {
    writeScope(ctx, (s) => {
      const rec = ensureWeekRecord(s, weekStartDate);
      return { ...s, weeks: { ...s.weeks, [weekStartDate]: rec } };
    });
    scope = getScope(ctx);
  }
  const weekRec = ensureWeekRecord(scope, weekStartDate);
  const challenge = getWeeklyChallengeDef(weekRec.challengeId) ?? getWeeklyChallengeDef('chemistry_week')!;
  const progress = computeWeeklyChallengeProgress(ctx, challenge, weekStartDate, isPro);
  const target = challenge.target;
  const completed = progress >= target;
  const claimed = weekRec.claimed;

  let status: WeeklyChallengeStatus = 'locked';
  if (unlocked) {
    if (claimed) status = 'claimed';
    else if (completed) status = 'claimable';
    else status = 'in_progress';
  }

  return {
    unlocked,
    weekStartDate,
    challenge,
    progress: Math.min(progress, target),
    target,
    completed,
    claimed,
    status,
    homeHintLine: buildHomeHintLine(unlocked, challenge, progress, target, claimed),
    unlockLine: unlocked
      ? `已解鎖：每週情侶挑戰`
      : `Lv.4 解鎖：每週情侶挑戰`,
  };
}

/** 寫入本週 claimed（發獎前呼叫）；成功才可發 LoveCoin / EXP */
export function tryMarkWeeklyChallengeClaimed(
  ctx: LedgerContext,
  coupleLevel: number,
  isPro: boolean,
  refDate = new Date()
): ClaimWeeklyChallengeResult {
  const weekStartDate = getWeekStartDateMonday(refDate);
  const fail = (partial: Partial<ClaimWeeklyChallengeResult>): ClaimWeeklyChallengeResult => ({
    ok: false,
    alreadyClaimed: false,
    notUnlocked: false,
    notComplete: false,
    notWritable: false,
    loveCoins: 0,
    expAmount: 0,
    weekStartDate,
    challengeId: challengeIdForWeek(weekStartDate),
    ...partial,
  });

  if (!isLedgerWritable(ctx)) {
    return fail({ notWritable: true });
  }
  if (coupleLevel < MIN_COUPLE_LEVEL_WEEKLY_CHALLENGE) {
    return fail({ notUnlocked: true });
  }

  const view = getWeeklyChallengeView(ctx, coupleLevel, isPro, refDate);
  if (view.claimed) {
    return fail({ alreadyClaimed: true, challengeId: view.challenge.id });
  }
  if (!view.completed) {
    return fail({ notComplete: true, challengeId: view.challenge.id });
  }

  let marked = false;
  writeScope(ctx, (scope) => {
    const weekRec = ensureWeekRecord(scope, weekStartDate);
    if (weekRec.claimed) return scope;
    marked = true;
    return {
      ...scope,
      weeks: {
        ...scope.weeks,
        [weekStartDate]: {
          ...weekRec,
          claimed: true,
          claimedAt: new Date().toISOString(),
        },
      },
    };
  });

  if (!marked) {
    return fail({ alreadyClaimed: true, challengeId: view.challenge.id });
  }

  return {
    ok: true,
    alreadyClaimed: false,
    notUnlocked: false,
    notComplete: false,
    notWritable: false,
    loveCoins: view.challenge.loveCoins,
    expAmount: view.challenge.exp,
    weekStartDate,
    challengeId: view.challenge.id,
  };
}

export { WEEKLY_CHALLENGE_UNLOCK_HINT };

/**
 * Phase 3A：情侶 EXP（與 LoveCoin 分離，user + couple scope）
 * 發放前寫入 claim，並受每日 80 EXP 上限約束。
 */
import {
  DAILY_EXP_CAP,
  expProgressInLevel,
  levelFromTotalExp,
} from '../lib/coupleLevel';
import { todayKey } from '../lib/dates';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import { buildRewardScopeKey, isLedgerWritable, type LedgerContext } from './dailyRewardLedgerStore';
import { getActiveStorageUserId } from './storageSession';

const EXP_STORE_VERSION = 1;
const DAY_RETENTION_DAYS = 45;

export const EXP_AMOUNT = {
  loveTaskSlot: 10,
  loveTaskAllComplete: 10,
  miniGame: 3,
  chore: 5,
  dinner: 5,
  dateIdea: 10,
  loveFlame: 5,
  level3Combo: 5,
} as const;

export const CHORE_EXP_DAILY_MAX = 3;

export type ExpGrantSource =
  | { type: 'love_task_slot'; slotIndex: number }
  | { type: 'love_task_all_complete' }
  | { type: 'mini_game'; claimIndex: number }
  | { type: 'chore'; taskId: string }
  | { type: 'dinner' }
  | { type: 'date_idea' }
  | { type: 'love_flame' }
  | { type: 'level3_combo' };

export type DailyExpDayRecord = {
  expEarned: number;
  claims: Record<string, true>;
};

export type CoupleExpScopeRecord = {
  totalExp: number;
  lastLevelUpAt: string | null;
  levelUpShownLevels: number[];
  days: Record<string, DailyExpDayRecord>;
  /** Phase 3C：每週挑戰 EXP（不計入每日 80 上限） */
  weeklyExpClaims?: Record<string, true>;
};

export type CoupleExpStoreData = {
  version: number;
  scopes: Record<string, CoupleExpScopeRecord>;
};

export type GrantExpResult = {
  granted: number;
  totalExp: number;
  level: number;
  previousLevel: number;
  newLevel: number;
  dailyExpEarned: number;
  alreadyClaimed: boolean;
  capReached: boolean;
};

export type CoupleExpView = ReturnType<typeof expProgressInLevel> & {
  totalExp: number;
  dailyExpEarned: number;
  dailyExpCap: number;
  lastLevelUpAt: string | null;
};

function defaultDayRecord(): DailyExpDayRecord {
  return { expEarned: 0, claims: {} };
}

function defaultScope(): CoupleExpScopeRecord {
  return {
    totalExp: 0,
    lastLevelUpAt: null,
    levelUpShownLevels: [],
    days: {},
  };
}

function normalizeDay(raw: unknown): DailyExpDayRecord {
  if (!raw || typeof raw !== 'object') return defaultDayRecord();
  const o = raw as Partial<DailyExpDayRecord>;
  const claims: Record<string, true> = {};
  if (o.claims && typeof o.claims === 'object') {
    for (const [k, v] of Object.entries(o.claims)) {
      if (v) claims[k] = true;
    }
  }
  return {
    expEarned: typeof o.expEarned === 'number' && o.expEarned >= 0 ? Math.floor(o.expEarned) : 0,
    claims,
  };
}

function normalizeScope(raw: unknown): CoupleExpScopeRecord {
  const base = defaultScope();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<CoupleExpScopeRecord>;
  const days: Record<string, DailyExpDayRecord> = {};
  if (o.days && typeof o.days === 'object') {
    for (const [dk, rec] of Object.entries(o.days)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dk)) days[dk] = normalizeDay(rec);
    }
  }
  const shown = Array.isArray(o.levelUpShownLevels)
    ? o.levelUpShownLevels.filter((n) => typeof n === 'number' && n >= 1 && n <= 5)
    : [];
  const weeklyExpClaims: Record<string, true> = {};
  if (o.weeklyExpClaims && typeof o.weeklyExpClaims === 'object') {
    for (const [k, v] of Object.entries(o.weeklyExpClaims)) {
      if (v) weeklyExpClaims[k] = true;
    }
  }
  return {
    totalExp: typeof o.totalExp === 'number' && o.totalExp >= 0 ? Math.floor(o.totalExp) : 0,
    lastLevelUpAt:
      typeof o.lastLevelUpAt === 'string' && o.lastLevelUpAt ? o.lastLevelUpAt : null,
    levelUpShownLevels: [...new Set(shown)].sort((a, b) => a - b),
    days,
    weeklyExpClaims,
  };
}

function pruneScope(scope: CoupleExpScopeRecord, refDate = new Date()): CoupleExpScopeRecord {
  const today = todayKey(refDate);
  const cutoff = new Date(refDate);
  cutoff.setDate(cutoff.getDate() - DAY_RETENTION_DAYS);
  const cutoffKey = todayKey(cutoff);
  const days: Record<string, DailyExpDayRecord> = {};
  for (const [dk, rec] of Object.entries(scope.days)) {
    if (dk >= cutoffKey || dk === today) days[dk] = rec;
  }
  return { ...scope, days };
}

export function loadCoupleExpStore(): CoupleExpStoreData {
  const raw = loadJson<unknown>(LQ_KEYS.coupleExp, null);
  let store = normalizeStore(raw);
  const pruned: Record<string, CoupleExpScopeRecord> = {};
  let changed = !raw;
  for (const [k, scope] of Object.entries(store.scopes)) {
    const p = pruneScope(scope);
    if (Object.keys(p.days).length !== Object.keys(scope.days).length) changed = true;
    pruned[k] = p;
  }
  store = { version: EXP_STORE_VERSION, scopes: pruned };
  if (changed) saveCoupleExpStore(store);
  return store;
}

function normalizeStore(raw: unknown): CoupleExpStoreData {
  if (raw && typeof raw === 'object') {
    const o = raw as Partial<CoupleExpStoreData>;
    if (o.scopes && typeof o.scopes === 'object') {
      const scopes: Record<string, CoupleExpScopeRecord> = {};
      for (const [k, v] of Object.entries(o.scopes)) {
        scopes[k] = normalizeScope(v);
      }
      return { version: EXP_STORE_VERSION, scopes };
    }
  }
  return { version: EXP_STORE_VERSION, scopes: {} };
}

export function saveCoupleExpStore(data: CoupleExpStoreData): void {
  const scopes: Record<string, CoupleExpScopeRecord> = {};
  for (const [k, scope] of Object.entries(data.scopes)) {
    scopes[k] = pruneScope(scope);
  }
  saveJson(LQ_KEYS.coupleExp, { version: EXP_STORE_VERSION, scopes });
}

export function getExpScopeRecord(
  ctx: LedgerContext,
  store?: CoupleExpStoreData
): CoupleExpScopeRecord {
  const data = store ?? loadCoupleExpStore();
  const key = buildRewardScopeKey(ctx.userId, ctx.coupleId);
  return data.scopes[key] ?? defaultScope();
}

function writeExpScope(
  ctx: LedgerContext,
  updater: (scope: CoupleExpScopeRecord) => CoupleExpScopeRecord
): CoupleExpScopeRecord {
  const store = loadCoupleExpStore();
  const key = buildRewardScopeKey(ctx.userId, ctx.coupleId);
  const prev = store.scopes[key] ?? defaultScope();
  const next = updater(prev);
  saveCoupleExpStore({ ...store, scopes: { ...store.scopes, [key]: next } });
  return next;
}

function getDay(scope: CoupleExpScopeRecord, dateKey: string): DailyExpDayRecord {
  return scope.days[dateKey] ?? defaultDayRecord();
}

function setDay(
  scope: CoupleExpScopeRecord,
  dateKey: string,
  day: DailyExpDayRecord
): CoupleExpScopeRecord {
  return { ...scope, days: { ...scope.days, [dateKey]: day } };
}

export function expClaimKey(source: ExpGrantSource): string {
  switch (source.type) {
    case 'love_task_slot':
      return `lt:${source.slotIndex}`;
    case 'love_task_all_complete':
      return 'lt:all';
    case 'mini_game':
      return `mg:${source.claimIndex}`;
    case 'chore':
      return `chore:${source.taskId.trim()}`;
    case 'dinner':
      return 'dinner';
    case 'date_idea':
      return 'date';
    case 'love_flame':
      return 'flame';
    case 'level3_combo':
      return 'l3combo';
    default:
      return 'unknown';
  }
}

function baseAmountForSource(source: ExpGrantSource): number {
  switch (source.type) {
    case 'love_task_slot':
      return EXP_AMOUNT.loveTaskSlot;
    case 'love_task_all_complete':
      return EXP_AMOUNT.loveTaskAllComplete;
    case 'mini_game':
      return EXP_AMOUNT.miniGame;
    case 'chore':
      return EXP_AMOUNT.chore;
    case 'dinner':
      return EXP_AMOUNT.dinner;
    case 'date_idea':
      return EXP_AMOUNT.dateIdea;
    case 'love_flame':
      return EXP_AMOUNT.loveFlame;
    case 'level3_combo':
      return EXP_AMOUNT.level3Combo;
    default:
      return 0;
  }
}

function choreExpCountToday(day: DailyExpDayRecord): number {
  return Object.keys(day.claims).filter((k) => k.startsWith('chore:')).length;
}

function canClaimSource(day: DailyExpDayRecord, source: ExpGrantSource): boolean {
  const key = expClaimKey(source);
  if (day.claims[key]) return false;
  if (source.type === 'chore' && choreExpCountToday(day) >= CHORE_EXP_DAILY_MAX) return false;
  return true;
}

/** 從舊版 rpg.xp 遷移 totalExp（僅當新帳本為 0） */
export function migrateLegacyRpgXpIntoExp(ctx: LedgerContext, legacyXp: number): void {
  if (!isLedgerWritable(ctx) || legacyXp <= 0) return;
  writeExpScope(ctx, (scope) => {
    if (scope.totalExp > 0) return scope;
    const totalExp = Math.max(0, Math.floor(legacyXp));
    const level = levelFromTotalExp(totalExp);
    const shown = new Set(scope.levelUpShownLevels);
    for (let lv = 2; lv <= level; lv++) shown.add(lv);
    return {
      ...scope,
      totalExp,
      levelUpShownLevels: [...shown].sort((a, b) => a - b),
    };
  });
}

/**
 * 嘗試發放 EXP（先寫入 claim + 每日上限，再累加 totalExp）
 */
export function tryGrantCoupleExp(
  ctx: LedgerContext,
  source: ExpGrantSource,
  dateKey: string = todayKey()
): GrantExpResult {
  const empty: GrantExpResult = {
    granted: 0,
    totalExp: getExpScopeRecord(ctx).totalExp,
    level: levelFromTotalExp(getExpScopeRecord(ctx).totalExp),
    previousLevel: levelFromTotalExp(getExpScopeRecord(ctx).totalExp),
    newLevel: levelFromTotalExp(getExpScopeRecord(ctx).totalExp),
    dailyExpEarned: getDay(getExpScopeRecord(ctx), dateKey).expEarned,
    alreadyClaimed: false,
    capReached: false,
  };

  if (!isLedgerWritable(ctx)) return empty;

  const requested = baseAmountForSource(source);
  if (requested <= 0) return empty;

  let result = empty;

  writeExpScope(ctx, (scope) => {
    const day = getDay(scope, dateKey);
    const previousLevel = levelFromTotalExp(scope.totalExp);

    if (!canClaimSource(day, source)) {
      result = {
        granted: 0,
        totalExp: scope.totalExp,
        level: previousLevel,
        previousLevel,
        newLevel: previousLevel,
        dailyExpEarned: day.expEarned,
        alreadyClaimed: true,
        capReached: day.expEarned >= DAILY_EXP_CAP,
      };
      return scope;
    }

    const room = DAILY_EXP_CAP - day.expEarned;
    if (room <= 0) {
      result = {
        granted: 0,
        totalExp: scope.totalExp,
        level: previousLevel,
        previousLevel,
        newLevel: previousLevel,
        dailyExpEarned: day.expEarned,
        alreadyClaimed: false,
        capReached: true,
      };
      return scope;
    }

    const granted = Math.min(requested, room);
    const key = expClaimKey(source);
    const nextDay: DailyExpDayRecord = {
      expEarned: day.expEarned + granted,
      claims: { ...day.claims, [key]: true },
    };
    const totalExp = scope.totalExp + granted;
    const newLevel = levelFromTotalExp(totalExp);
    const lastLevelUpAt =
      newLevel > previousLevel ? new Date().toISOString() : scope.lastLevelUpAt;

    result = {
      granted,
      totalExp,
      level: newLevel,
      previousLevel,
      newLevel,
      dailyExpEarned: nextDay.expEarned,
      alreadyClaimed: false,
      capReached: nextDay.expEarned >= DAILY_EXP_CAP,
    };

    return setDay({ ...scope, totalExp, lastLevelUpAt }, dateKey, nextDay);
  });

  return result;
}

export function getCoupleExpView(ctx: LedgerContext, dateKey: string = todayKey()): CoupleExpView {
  const scope = getExpScopeRecord(ctx);
  const day = getDay(scope, dateKey);
  const progress = expProgressInLevel(scope.totalExp);
  return {
    ...progress,
    totalExp: scope.totalExp,
    dailyExpEarned: day.expEarned,
    dailyExpCap: DAILY_EXP_CAP,
    lastLevelUpAt: scope.lastLevelUpAt,
  };
}

export function markLevelUpPopupShown(ctx: LedgerContext, level: number): void {
  if (level < 2 || level > 5) return;
  writeExpScope(ctx, (scope) => {
    const set = new Set(scope.levelUpShownLevels);
    set.add(level);
    return { ...scope, levelUpShownLevels: [...set].sort((a, b) => a - b) };
  });
}

export function isLevelUpPopupShown(ctx: LedgerContext, level: number): boolean {
  return getExpScopeRecord(ctx).levelUpShownLevels.includes(level);
}

/** 本次升級是否應顯示彈窗（尚未顯示過該等級） */
export function shouldShowLevelUpPopup(ctx: LedgerContext, level: number): boolean {
  return level >= 2 && level <= 5 && !isLevelUpPopupShown(ctx, level);
}

/** Phase 3C：每週挑戰 EXP（不計入每日 80 上限） */
export function grantWeeklyChallengeExp(
  ctx: LedgerContext,
  amount: number,
  weekStartDate: string,
  challengeId: string
): { granted: number; totalExp: number; alreadyClaimed: boolean } {
  const empty = {
    granted: 0,
    totalExp: getExpScopeRecord(ctx).totalExp,
    alreadyClaimed: false,
  };
  if (!isLedgerWritable(ctx) || amount <= 0) return empty;

  const claimKey = `${weekStartDate}:${challengeId}`;
  let result = empty;

  writeExpScope(ctx, (scope) => {
    const claims = { ...(scope.weeklyExpClaims ?? {}) };
    if (claims[claimKey]) {
      result = { granted: 0, totalExp: scope.totalExp, alreadyClaimed: true };
      return scope;
    }
    const granted = Math.floor(amount);
    claims[claimKey] = true;
    const totalExp = scope.totalExp + granted;
    const previousLevel = levelFromTotalExp(scope.totalExp);
    const newLevel = levelFromTotalExp(totalExp);
    const lastLevelUpAt =
      newLevel > previousLevel ? new Date().toISOString() : scope.lastLevelUpAt;
    result = { granted, totalExp, alreadyClaimed: false };
    return { ...scope, totalExp, lastLevelUpAt, weeklyExpClaims: claims };
  });

  return result;
}

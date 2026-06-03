/**
 * Phase 2 每日獎勵帳本（localStorage，user + couple 作用域）。
 * 發獎前必先寫入紀錄，避免重整／重開 App／重登入重複領獎。
 */
import { getMiniGameDailyRewardCap } from '../lib/miniGameRewards';
import { offsetDateKey, todayKey } from '../lib/dates';
import { LOVE_TASKS_PER_DAY } from '../lib/loveTaskRewards';
import type { LoveFlameData, TasksData } from './types';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import { getActiveStorageUserId } from './storageSession';

export const LOVE_FLAME_MILESTONES = [3, 7, 14, 30] as const;

export const LOVE_FLAME_MILESTONE_COINS: Record<(typeof LOVE_FLAME_MILESTONES)[number], number> = {
  3: 20,
  7: 50,
  14: 100,
  30: 300,
};

const LEDGER_VERSION = 1;
const DAY_RETENTION_DAYS = 45;

export type LedgerContext = {
  userId: string | null;
  coupleId: string | null;
};

export type DailyDayRewardRecord = {
  /** 今日戀愛任務：每個槽位是否已領獎（固定 2 槽，與 instance id 無關） */
  loveTaskSlotsClaimed: boolean[];
  /** 今日 2/2 加碼是否已領 */
  loveTaskAllComplete: boolean;
  /** 情侶小遊戲今日已領獎次數 */
  miniGameRewardCount: number;
  /** 愛情火苗：今日是否已記錄有效互動／延續 */
  loveFlameRecorded: boolean;
  /** Lv.3+ 今日 2/2 連擊加成是否已領 */
  level3ComboClaimed: boolean;
};

export type DailyRewardScopeRecord = {
  lastInteractionDate: string | null;
  currentStreak: number;
  longestStreak: number;
  claimedFlameMilestones: number[];
  days: Record<string, DailyDayRewardRecord>;
};

export type DailyRewardLedgerData = {
  version: number;
  scopes: Record<string, DailyRewardScopeRecord>;
};

export function buildRewardScopeKey(userId: string | null, coupleId: string | null): string {
  const u = userId?.trim() || 'guest';
  const c = coupleId?.trim() || 'solo';
  return `${u}::${c}`;
}

/** 未登入時 localStorage 不寫入，禁止發獎避免刷新重複領取 */
export function isLedgerWritable(ctx: LedgerContext): boolean {
  const active = getActiveStorageUserId();
  return Boolean(active && ctx.userId && active === ctx.userId);
}

function defaultDayRecord(): DailyDayRewardRecord {
  return {
    loveTaskSlotsClaimed: Array.from({ length: LOVE_TASKS_PER_DAY }, () => false),
    loveTaskAllComplete: false,
    miniGameRewardCount: 0,
    loveFlameRecorded: false,
    level3ComboClaimed: false,
  };
}

function defaultScope(): DailyRewardScopeRecord {
  return {
    lastInteractionDate: null,
    currentStreak: 0,
    longestStreak: 0,
    claimedFlameMilestones: [],
    days: {},
  };
}

function normalizeDayRecord(raw: unknown): DailyDayRewardRecord {
  const base = defaultDayRecord();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<DailyDayRewardRecord>;
  const slots = Array.isArray(o.loveTaskSlotsClaimed)
    ? o.loveTaskSlotsClaimed.slice(0, LOVE_TASKS_PER_DAY).map(Boolean)
    : [];
  while (slots.length < LOVE_TASKS_PER_DAY) slots.push(false);
  return {
    loveTaskSlotsClaimed: slots,
    loveTaskAllComplete: Boolean(o.loveTaskAllComplete),
    miniGameRewardCount:
      typeof o.miniGameRewardCount === 'number' && o.miniGameRewardCount >= 0
        ? Math.floor(o.miniGameRewardCount)
        : 0,
    loveFlameRecorded: Boolean(o.loveFlameRecorded),
    level3ComboClaimed: Boolean(o.level3ComboClaimed),
  };
}

function normalizeScope(raw: unknown): DailyRewardScopeRecord {
  const base = defaultScope();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<DailyRewardScopeRecord>;
  const days: Record<string, DailyDayRewardRecord> = {};
  if (o.days && typeof o.days === 'object') {
    for (const [dk, rec] of Object.entries(o.days)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dk)) {
        days[dk] = normalizeDayRecord(rec);
      }
    }
  }
  const milestones = Array.isArray(o.claimedFlameMilestones)
    ? o.claimedFlameMilestones.filter(
        (n): n is (typeof LOVE_FLAME_MILESTONES)[number] =>
          typeof n === 'number' && (LOVE_FLAME_MILESTONES as readonly number[]).includes(n)
      )
    : [];
  return {
    lastInteractionDate:
      typeof o.lastInteractionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.lastInteractionDate)
        ? o.lastInteractionDate
        : null,
    currentStreak:
      typeof o.currentStreak === 'number' && o.currentStreak >= 0 ? o.currentStreak : 0,
    longestStreak:
      typeof o.longestStreak === 'number' && o.longestStreak >= 0 ? o.longestStreak : 0,
    claimedFlameMilestones: milestones,
    days,
  };
}

function normalizeLedger(raw: unknown): DailyRewardLedgerData {
  if (raw && typeof raw === 'object') {
    const o = raw as Partial<DailyRewardLedgerData>;
    if (o.scopes && typeof o.scopes === 'object') {
      const scopes: Record<string, DailyRewardScopeRecord> = {};
      for (const [k, v] of Object.entries(o.scopes)) {
        scopes[k] = normalizeScope(v);
      }
      return { version: LEDGER_VERSION, scopes };
    }
  }
  return { version: LEDGER_VERSION, scopes: {} };
}

function pruneScopeDays(scope: DailyRewardScopeRecord, refDate = new Date()): DailyRewardScopeRecord {
  const today = todayKey(refDate);
  const cutoff = new Date(refDate);
  cutoff.setDate(cutoff.getDate() - DAY_RETENTION_DAYS);
  const cutoffKey = todayKey(cutoff);
  const days: Record<string, DailyDayRewardRecord> = {};
  for (const [dk, rec] of Object.entries(scope.days)) {
    if (dk >= cutoffKey || dk === today) {
      days[dk] = rec;
    }
  }
  return { ...scope, days };
}

function getDay(scope: DailyRewardScopeRecord, dateKey: string): DailyDayRewardRecord {
  return scope.days[dateKey] ?? defaultDayRecord();
}

function setDay(
  scope: DailyRewardScopeRecord,
  dateKey: string,
  day: DailyDayRewardRecord
): DailyRewardScopeRecord {
  return {
    ...scope,
    days: { ...scope.days, [dateKey]: day },
  };
}

export function loadDailyRewardLedger(): DailyRewardLedgerData {
  const raw = loadJson<unknown>(LQ_KEYS.dailyRewardLedger, null);
  let ledger = normalizeLedger(raw);
  let changed = !raw;
  const prunedScopes: Record<string, DailyRewardScopeRecord> = {};
  for (const [k, scope] of Object.entries(ledger.scopes)) {
    const pruned = pruneScopeDays(scope);
    if (Object.keys(pruned.days).length !== Object.keys(scope.days).length) changed = true;
    prunedScopes[k] = pruned;
  }
  ledger = { version: LEDGER_VERSION, scopes: prunedScopes };
  if (changed) saveDailyRewardLedger(ledger);
  return ledger;
}

export function saveDailyRewardLedger(data: DailyRewardLedgerData): void {
  const scopes: Record<string, DailyRewardScopeRecord> = {};
  for (const [k, scope] of Object.entries(data.scopes)) {
    scopes[k] = pruneScopeDays(scope);
  }
  saveJson(LQ_KEYS.dailyRewardLedger, { version: LEDGER_VERSION, scopes });
}

export function getScopeRecord(
  ctx: LedgerContext,
  ledger?: DailyRewardLedgerData
): DailyRewardScopeRecord {
  const store = ledger ?? loadDailyRewardLedger();
  const key = buildRewardScopeKey(ctx.userId, ctx.coupleId);
  return store.scopes[key] ?? defaultScope();
}

function writeScope(
  ctx: LedgerContext,
  updater: (scope: DailyRewardScopeRecord) => DailyRewardScopeRecord
): DailyRewardScopeRecord {
  const ledger = loadDailyRewardLedger();
  const key = buildRewardScopeKey(ctx.userId, ctx.coupleId);
  const prev = ledger.scopes[key] ?? defaultScope();
  const next = updater(prev);
  saveDailyRewardLedger({
    ...ledger,
    scopes: { ...ledger.scopes, [key]: next },
  });
  return next;
}

/** 從舊版 loveFlame / tasks / rpg 帳本合併（僅補缺，不覆蓋已存在紀錄） */
export function migrateLegacyRewardsIntoLedger(ctx: LedgerContext): void {
  if (!getActiveStorageUserId()) return;

  const today = todayKey();

  writeScope(ctx, (scope) => {
    let next = scope;

    const legacyFlame = loadJson<Partial<LoveFlameData> | null>(LQ_KEYS.loveFlame, null);
    if (legacyFlame && typeof legacyFlame === 'object') {
      if (!next.lastInteractionDate && legacyFlame.lastInteractionDate) {
        next = { ...next, lastInteractionDate: legacyFlame.lastInteractionDate };
      }
      if (next.currentStreak === 0 && typeof legacyFlame.currentStreak === 'number') {
        next = { ...next, currentStreak: legacyFlame.currentStreak };
      }
      if (next.longestStreak === 0 && typeof legacyFlame.longestStreak === 'number') {
        next = { ...next, longestStreak: legacyFlame.longestStreak };
      }
      const lm = Array.isArray(legacyFlame.claimedMilestones) ? legacyFlame.claimedMilestones : [];
      const mergedMs = new Set([...next.claimedFlameMilestones, ...lm]);
      next = { ...next, claimedFlameMilestones: [...mergedMs].sort((a, b) => a - b) };

      if (
        legacyFlame.todayRecordedDate === today &&
        !getDay(next, today).loveFlameRecorded
      ) {
        next = setDay(next, today, { ...getDay(next, today), loveFlameRecorded: true });
      }
    }

    const legacyTasks = loadJson<Partial<TasksData> | null>(LQ_KEYS.tasks, null);
    if (legacyTasks && legacyTasks.date === today && Array.isArray(legacyTasks.dailyTasks)) {
      let dayRec = getDay(next, today);
      const slots = [...dayRec.loveTaskSlotsClaimed];
      const rewarded = Array.isArray(legacyTasks.rewardedTaskIds) ? legacyTasks.rewardedTaskIds : [];
      legacyTasks.dailyTasks.forEach((t, idx) => {
        if (idx < LOVE_TASKS_PER_DAY && t.done) {
          slots[idx] = true;
        }
      });
      dayRec = { ...dayRec, loveTaskSlotsClaimed: slots };
      const allDone =
        legacyTasks.dailyAllCompleteRewardDate === today ||
        slots.every(Boolean);
      if (allDone) {
        dayRec = { ...dayRec, loveTaskAllComplete: true };
      }
      next = setDay(next, today, dayRec);
    }

    const legacyRpg = loadJson<{ dailyGuard?: { anchorDate?: string; miniGamesRewardCount?: number } }>(
      LQ_KEYS.rpg,
      {}
    );
    const g = legacyRpg?.dailyGuard;
    if (g?.anchorDate === today && typeof g.miniGamesRewardCount === 'number' && g.miniGamesRewardCount > 0) {
      const dayRec = getDay(next, today);
      if (dayRec.miniGameRewardCount < g.miniGamesRewardCount) {
        next = setDay(next, today, {
          ...dayRec,
          miniGameRewardCount: g.miniGamesRewardCount,
        });
      }
    }

    return next;
  });
}

// —— 讀取（UI / 判斷） ——

export function isLoveTaskSlotClaimed(
  ctx: LedgerContext,
  dateKey: string,
  slotIndex: number,
  ledger?: DailyRewardLedgerData
): boolean {
  if (slotIndex < 0 || slotIndex >= LOVE_TASKS_PER_DAY) return false;
  const scope = getScopeRecord(ctx, ledger);
  return Boolean(getDay(scope, dateKey).loveTaskSlotsClaimed[slotIndex]);
}

export function isLoveTaskAllCompleteClaimed(
  ctx: LedgerContext,
  dateKey: string,
  ledger?: DailyRewardLedgerData
): boolean {
  return getDay(getScopeRecord(ctx, ledger), dateKey).loveTaskAllComplete;
}

export function isLevel3ComboClaimed(
  ctx: LedgerContext,
  dateKey: string,
  ledger?: DailyRewardLedgerData
): boolean {
  return getDay(getScopeRecord(ctx, ledger), dateKey).level3ComboClaimed;
}

export function getMiniGameRewardCount(
  ctx: LedgerContext,
  dateKey: string,
  ledger?: DailyRewardLedgerData
): number {
  return getDay(getScopeRecord(ctx, ledger), dateKey).miniGameRewardCount;
}

export function isLoveFlameRecordedToday(
  ctx: LedgerContext,
  dateKey: string = todayKey(),
  ledger?: DailyRewardLedgerData
): boolean {
  return getDay(getScopeRecord(ctx, ledger), dateKey).loveFlameRecorded;
}

export function scopeToLoveFlameData(
  scope: DailyRewardScopeRecord,
  dateKey: string = todayKey()
): LoveFlameData {
  return {
    lastInteractionDate: scope.lastInteractionDate,
    currentStreak: scope.currentStreak,
    longestStreak: scope.longestStreak,
    todayRecordedDate: isLoveFlameRecordedOnScope(scope, dateKey) ? dateKey : null,
    claimedMilestones: [...scope.claimedFlameMilestones],
  };
}

function isLoveFlameRecordedOnScope(scope: DailyRewardScopeRecord, dateKey: string): boolean {
  return getDay(scope, dateKey).loveFlameRecorded;
}

export function loveFlameDisplayFromScope(
  scope: DailyRewardScopeRecord,
  today: string = todayKey()
): {
  title: string;
  headline: string;
  subline: string;
  todayRecorded: boolean;
} {
  const todayRecorded = isLoveFlameRecordedOnScope(scope, today);
  const streak = scope.currentStreak;

  if (todayRecorded) {
    return {
      title: '愛情火苗',
      headline: '🔥 今日火苗已延續',
      subline: `你們已經連續互動 ${streak} 天，明天也一起保持吧！`,
      todayRecorded: true,
    };
  }

  return {
    title: '愛情火苗',
    headline: `🔥 連續互動 ${streak} 天`,
    subline: '今天完成戀愛任務，就能延續你們的默契！',
    todayRecorded: false,
  };
}

// —— 寫入（發獎前呼叫；成功才應發獎） ——

/** 領取單一戀愛任務槽位獎勵；先寫入帳本再回傳 true */
export function tryClaimLoveTaskSlot(
  ctx: LedgerContext,
  dateKey: string,
  slotIndex: number
): boolean {
  if (!isLedgerWritable(ctx)) return false;
  if (slotIndex < 0 || slotIndex >= LOVE_TASKS_PER_DAY) return false;
  let claimed = false;
  writeScope(ctx, (scope) => {
    const day = getDay(scope, dateKey);
    if (day.loveTaskSlotsClaimed[slotIndex]) return scope;
    const slots = [...day.loveTaskSlotsClaimed];
    slots[slotIndex] = true;
    claimed = true;
    return setDay(scope, dateKey, { ...day, loveTaskSlotsClaimed: slots });
  });
  return claimed;
}

export function tryClaimLoveTaskAllComplete(ctx: LedgerContext, dateKey: string): boolean {
  if (!isLedgerWritable(ctx)) return false;
  let claimed = false;
  writeScope(ctx, (scope) => {
    const day = getDay(scope, dateKey);
    if (day.loveTaskAllComplete) return scope;
    claimed = true;
    return setDay(scope, dateKey, { ...day, loveTaskAllComplete: true });
  });
  return claimed;
}

/** Lv.3+ 今日 2/2 連擊加成（每日一次）；先寫入帳本再發獎 */
export function tryClaimLevel3Combo(ctx: LedgerContext, dateKey: string): boolean {
  if (!isLedgerWritable(ctx)) return false;
  let claimed = false;
  writeScope(ctx, (scope) => {
    const day = getDay(scope, dateKey);
    if (day.level3ComboClaimed) return scope;
    claimed = true;
    return setDay(scope, dateKey, { ...day, level3ComboClaimed: true });
  });
  return claimed;
}

export type MiniGameClaimResult = { ok: true; slotNum: number } | { ok: false; slotNum: number };

/** 領取一次小遊戲獎勵；先寫入帳本 */
export function tryClaimMiniGameReward(
  ctx: LedgerContext,
  dateKey: string,
  isPro: boolean
): MiniGameClaimResult {
  if (!isLedgerWritable(ctx)) {
    const count = getMiniGameRewardCount(ctx, dateKey);
    return { ok: false, slotNum: count };
  }
  const cap = getMiniGameDailyRewardCap(isPro);
  let result: MiniGameClaimResult = { ok: false, slotNum: 0 };
  writeScope(ctx, (scope) => {
    const day = getDay(scope, dateKey);
    const count = day.miniGameRewardCount;
    if (count >= cap) {
      result = { ok: false, slotNum: count };
      return scope;
    }
    const slotNum = count + 1;
    result = { ok: true, slotNum };
    return setDay(scope, dateKey, { ...day, miniGameRewardCount: slotNum });
  });
  return result;
}

export type RecordFlameResult = {
  recordedToday: boolean;
  newMilestones: number[];
  scope: DailyRewardScopeRecord;
};

/** 記錄今日首次有效互動／延續火苗；先寫入帳本 */
export function tryRecordLoveFlameToday(
  ctx: LedgerContext,
  dateKey: string = todayKey()
): RecordFlameResult {
  if (!isLedgerWritable(ctx)) {
    return {
      recordedToday: false,
      newMilestones: [],
      scope: getScopeRecord(ctx),
    };
  }
  let out: RecordFlameResult = {
    recordedToday: false,
    newMilestones: [],
    scope: getScopeRecord(ctx),
  };

  writeScope(ctx, (scope) => {
    const day = getDay(scope, dateKey);
    if (day.loveFlameRecorded) {
      out = { recordedToday: false, newMilestones: [], scope };
      return scope;
    }

    const yesterday = offsetDateKey(-1, dateKey);
    const continued = scope.lastInteractionDate === yesterday;
    const nextStreak = continued ? Math.max(1, scope.currentStreak + 1) : 1;
    const longestStreak = Math.max(scope.longestStreak, nextStreak);

    const nextScope: DailyRewardScopeRecord = {
      ...scope,
      lastInteractionDate: dateKey,
      currentStreak: nextStreak,
      longestStreak,
    };
    const nextDay = { ...day, loveFlameRecorded: true };
    const withDay = setDay(nextScope, dateKey, nextDay);

    const newMilestones = LOVE_FLAME_MILESTONES.filter(
      (m) => nextStreak >= m && !withDay.claimedFlameMilestones.includes(m)
    );

    out = { recordedToday: true, newMilestones: [...newMilestones], scope: withDay };
    return withDay;
  });

  return out;
}

/** 標記 streak 里程碑已領（發獎前呼叫） */
export function tryClaimFlameMilestone(ctx: LedgerContext, milestone: number): boolean {
  if (!isLedgerWritable(ctx)) return false;
  if (!(LOVE_FLAME_MILESTONES as readonly number[]).includes(milestone)) return false;
  let claimed = false;
  writeScope(ctx, (scope) => {
    if (scope.claimedFlameMilestones.includes(milestone)) return scope;
    claimed = true;
    return {
      ...scope,
      claimedFlameMilestones: [...scope.claimedFlameMilestones, milestone].sort((a, b) => a - b),
    };
  });
  return claimed;
}

/** 今日戀愛任務進度（以 ledger 為準，供首頁／任務頁顯示） */
export function getLoveTaskProgressFromLedger(
  ctx: LedgerContext,
  dateKey: string = todayKey(),
  ledger?: DailyRewardLedgerData
): { done: number; total: number; pct: number } {
  const day = getDay(getScopeRecord(ctx, ledger), dateKey);
  const done = day.loveTaskSlotsClaimed.filter(Boolean).length;
  const total = LOVE_TASKS_PER_DAY;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

/** 同步 tasks UI（done / rewardedTaskIds）；帳本為準，只補狀態不發獎 */
export function syncTasksRewardFlagsFromLedger(
  ctx: LedgerContext,
  tasks: TasksData,
  dateKey: string = todayKey()
): TasksData {
  if (tasks.date !== dateKey) return tasks;
  const scope = getScopeRecord(ctx);
  const day = getDay(scope, dateKey);
  const dailyTasks = tasks.dailyTasks.map((t, idx) => {
    const slotClaimed = Boolean(day.loveTaskSlotsClaimed[idx]);
    return slotClaimed ? { ...t, done: true } : t;
  });
  const rewardedTaskIds = dailyTasks
    .map((t, idx) => (day.loveTaskSlotsClaimed[idx] ? t.id : null))
    .filter((id): id is string => Boolean(id));
  return {
    ...tasks,
    dailyTasks,
    rewardedTaskIds,
    dailyAllCompleteRewardDate: day.loveTaskAllComplete ? dateKey : null,
  };
}

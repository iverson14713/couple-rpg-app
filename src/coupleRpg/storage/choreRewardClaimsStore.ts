/**
 * 每日家事獎勵領取紀錄（與 assignment / chore_record 分離，防重新分配與刷自訂項目）
 */
import { dailyChoreRewardLimit } from '../constants/choreRewardLimits';
import { todayKey } from '../lib/dates';
import type { HouseworkData } from './types';
import { getTodayAssignment } from './houseworkStore';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export type ChoreRewardDayRecord = {
  claimedKeys: string[];
};

export type ChoreRewardClaimsData = {
  days: Record<string, ChoreRewardDayRecord>;
};

export type ChoreRewardGrantReason = 'grant' | 'already_claimed' | 'daily_limit';

const CLAIM_RETENTION_DAYS = 14;

function defaultClaims(): ChoreRewardClaimsData {
  return { days: {} };
}

/** 穩定 key：dateKey + taskId（預設與自訂家事 id 不隨重新分配改變） */
export function choreRewardKey(dateKey: string, taskId: string): string {
  return `${dateKey}::${taskId.trim()}`;
}

function parseRewardKey(key: string): { dateKey: string; taskId: string } | null {
  const idx = key.indexOf('::');
  if (idx <= 0) return null;
  return { dateKey: key.slice(0, idx), taskId: key.slice(idx + 2) };
}

function normalizeClaims(raw: unknown): ChoreRewardClaimsData {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (o.days && typeof o.days === 'object' && !Array.isArray(o.days)) {
      const days: Record<string, ChoreRewardDayRecord> = {};
      for (const [dk, rec] of Object.entries(o.days as Record<string, unknown>)) {
        if (rec && typeof rec === 'object' && Array.isArray((rec as ChoreRewardDayRecord).claimedKeys)) {
          days[dk] = {
            claimedKeys: [...(rec as ChoreRewardDayRecord).claimedKeys],
          };
        } else if (Array.isArray(rec)) {
          days[dk] = { claimedKeys: [...rec] };
        }
      }
      return { days };
    }
    if (o.rewardedChoreKeysByDate && typeof o.rewardedChoreKeysByDate === 'object') {
      const days: Record<string, ChoreRewardDayRecord> = {};
      for (const [dk, keys] of Object.entries(
        o.rewardedChoreKeysByDate as Record<string, string[]>
      )) {
        days[dk] = { claimedKeys: Array.isArray(keys) ? [...keys] : [] };
      }
      return { days };
    }
  }
  return defaultClaims();
}

function pruneOldDates(data: ChoreRewardClaimsData, refDate = new Date()): ChoreRewardClaimsData {
  const today = todayKey(refDate);
  const cutoff = new Date(refDate);
  cutoff.setDate(cutoff.getDate() - CLAIM_RETENTION_DAYS);
  const cutoffKey = todayKey(cutoff);

  const next: Record<string, ChoreRewardDayRecord> = {};
  for (const [dk, rec] of Object.entries(data.days)) {
    if (dk >= cutoffKey || dk === today) {
      next[dk] = rec;
    }
  }
  return { days: next };
}

export function loadChoreRewardClaims(): ChoreRewardClaimsData {
  const raw = loadJson<unknown>(LQ_KEYS.choreRewardClaims, null);
  const merged = normalizeClaims(raw);
  const pruned = pruneOldDates(merged);
  const legacyFormat =
    raw &&
    typeof raw === 'object' &&
    'rewardedChoreKeysByDate' in (raw as Record<string, unknown>);
  if (
    legacyFormat ||
    Object.keys(pruned.days).length !== Object.keys(merged.days).length
  ) {
    saveChoreRewardClaims(pruned);
  }
  return pruned;
}

export function saveChoreRewardClaims(data: ChoreRewardClaimsData): void {
  saveJson(LQ_KEYS.choreRewardClaims, pruneOldDates(data));
}

function getDayRecord(
  dateKey: string,
  data?: ChoreRewardClaimsData
): ChoreRewardDayRecord {
  const store = data ?? loadChoreRewardClaims();
  return store.days[dateKey] ?? { claimedKeys: [] };
}

export function getDailyChoreRewardCount(dateKey: string, data?: ChoreRewardClaimsData): number {
  return getDayRecord(dateKey, data).claimedKeys.length;
}

export function getDailyChoreRewardLimit(isPro: boolean): number {
  return dailyChoreRewardLimit(isPro);
}

export function isDailyChoreRewardLimitReached(
  dateKey: string,
  isPro: boolean,
  data?: ChoreRewardClaimsData
): boolean {
  return getDailyChoreRewardCount(dateKey, data) >= getDailyChoreRewardLimit(isPro);
}

export function getClaimedTaskIdsForDate(
  dateKey: string,
  data?: ChoreRewardClaimsData
): Set<string> {
  const keys = getDayRecord(dateKey, data).claimedKeys;
  const ids = new Set<string>();
  for (const k of keys) {
    const parsed = parseRewardKey(k);
    if (parsed?.dateKey === dateKey) ids.add(parsed.taskId);
  }
  return ids;
}

export function hasChoreRewardClaim(
  dateKey: string,
  taskId: string,
  data?: ChoreRewardClaimsData
): boolean {
  return getClaimedTaskIdsForDate(dateKey, data).has(taskId.trim());
}

export function evaluateChoreRewardGrant(
  dateKey: string,
  taskId: string,
  isPro: boolean,
  data?: ChoreRewardClaimsData
): ChoreRewardGrantReason {
  const store = data ?? loadChoreRewardClaims();
  if (hasChoreRewardClaim(dateKey, taskId, store)) return 'already_claimed';
  if (isDailyChoreRewardLimitReached(dateKey, isPro, store)) return 'daily_limit';
  return 'grant';
}

function addChoreRewardClaimRecord(
  dateKey: string,
  taskId: string,
  store: ChoreRewardClaimsData
): ChoreRewardClaimsData {
  const tid = taskId.trim();
  if (!tid || hasChoreRewardClaim(dateKey, tid, store)) return store;

  const key = choreRewardKey(dateKey, tid);
  const day = store.days[dateKey] ?? { claimedKeys: [] };
  return {
    days: {
      ...store.days,
      [dateKey]: { claimedKeys: [...day.claimedKeys, key] },
    },
  };
}

/** 寫入領獎紀錄（略過每日上限，僅供舊資料 backfill） */
export function recordChoreRewardClaim(dateKey: string, taskId: string): void {
  let store = loadChoreRewardClaims();
  store = addChoreRewardClaimRecord(dateKey, taskId, store);
  saveChoreRewardClaims(store);
}

/** 通過檢查後寫入領獎紀錄；成功回傳 true */
export function tryClaimChoreReward(
  dateKey: string,
  taskId: string,
  isPro: boolean
): boolean {
  const store = loadChoreRewardClaims();
  if (evaluateChoreRewardGrant(dateKey, taskId, isPro, store) !== 'grant') {
    return false;
  }
  saveChoreRewardClaims(addChoreRewardClaimRecord(dateKey, taskId, store));
  return true;
}

/** 從 assignment.rewarded 與今日 completions 補寫 claim（舊資料相容，不套用上限） */
export function backfillChoreRewardClaimsFromHousework(
  data: HouseworkData,
  dateKey: string = todayKey()
): void {
  const assignment = getTodayAssignment(data, dateKey);
  if (assignment) {
    for (const c of assignment.chores) {
      if (c.rewarded) recordChoreRewardClaim(dateKey, c.taskId);
    }
  }

  for (const comp of data.completions) {
    if (comp.rpgRewardGranted && todayKey(new Date(comp.completedAt)) === dateKey) {
      recordChoreRewardClaim(dateKey, comp.taskId);
    }
  }
}

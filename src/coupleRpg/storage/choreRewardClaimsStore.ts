/**
 * 每日家事獎勵領取紀錄（與 assignment / chore_record 分離，防重新分配刷獎）
 */
import { todayKey } from '../lib/dates';
import type { HouseworkData } from './types';
import { getTodayAssignment } from './houseworkStore';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export type ChoreRewardClaimsData = {
  rewardedChoreKeysByDate: Record<string, string[]>;
};

const CLAIM_RETENTION_DAYS = 14;

function defaultClaims(): ChoreRewardClaimsData {
  return { rewardedChoreKeysByDate: {} };
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

function pruneOldDates(data: ChoreRewardClaimsData, refDate = new Date()): ChoreRewardClaimsData {
  const today = todayKey(refDate);
  const cutoff = new Date(refDate);
  cutoff.setDate(cutoff.getDate() - CLAIM_RETENTION_DAYS);
  const cutoffKey = todayKey(cutoff);

  const next: Record<string, string[]> = {};
  for (const [dk, keys] of Object.entries(data.rewardedChoreKeysByDate)) {
    if (dk >= cutoffKey || dk === today) {
      next[dk] = keys;
    }
  }
  return { rewardedChoreKeysByDate: next };
}

export function loadChoreRewardClaims(): ChoreRewardClaimsData {
  const raw = loadJson<ChoreRewardClaimsData>(LQ_KEYS.choreRewardClaims, defaultClaims());
  const merged = {
    rewardedChoreKeysByDate:
      raw?.rewardedChoreKeysByDate && typeof raw.rewardedChoreKeysByDate === 'object'
        ? raw.rewardedChoreKeysByDate
        : {},
  };
  const pruned = pruneOldDates(merged);
  if (
    Object.keys(pruned.rewardedChoreKeysByDate).length !==
    Object.keys(merged.rewardedChoreKeysByDate).length
  ) {
    saveChoreRewardClaims(pruned);
  }
  return pruned;
}

export function saveChoreRewardClaims(data: ChoreRewardClaimsData): void {
  saveJson(LQ_KEYS.choreRewardClaims, pruneOldDates(data));
}

export function getClaimedTaskIdsForDate(
  dateKey: string,
  data?: ChoreRewardClaimsData
): Set<string> {
  const store = data ?? loadChoreRewardClaims();
  const keys = store.rewardedChoreKeysByDate[dateKey] ?? [];
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

/** 寫入領獎紀錄；已存在則回傳 false */
export function tryClaimChoreReward(dateKey: string, taskId: string): boolean {
  const tid = taskId.trim();
  if (!tid) return false;
  const store = loadChoreRewardClaims();
  if (hasChoreRewardClaim(dateKey, tid, store)) return false;

  const key = choreRewardKey(dateKey, tid);
  const list = store.rewardedChoreKeysByDate[dateKey] ?? [];
  saveChoreRewardClaims({
    rewardedChoreKeysByDate: {
      ...store.rewardedChoreKeysByDate,
      [dateKey]: [...list, key],
    },
  });
  return true;
}

/** 從 assignment.rewarded 與今日 completions 補寫 claim（舊資料相容） */
export function backfillChoreRewardClaimsFromHousework(
  data: HouseworkData,
  dateKey: string = todayKey()
): void {
  const assignment = getTodayAssignment(data, dateKey);
  if (assignment) {
    for (const c of assignment.chores) {
      if (c.rewarded) tryClaimChoreReward(dateKey, c.taskId);
    }
  }

  for (const comp of data.completions) {
    if (comp.rpgRewardGranted && todayKey(new Date(comp.completedAt)) === dateKey) {
      tryClaimChoreReward(dateKey, comp.taskId);
    }
  }
}

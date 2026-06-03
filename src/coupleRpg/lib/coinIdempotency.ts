import { makeId } from './id';
import { todayKey } from './dates';

export function choreCoinKey(dateKey: string, taskId: string): string {
  return `earn:housework:${dateKey}:${taskId}`;
}

/** 今日戀愛任務槽位（0-based）；與任務 instance id 無關，防換任務刷獎 */
export function taskCoinKey(dateKey: string, slotIndex: number): string {
  return `earn:task:${dateKey}:slot-${slotIndex}`;
}

export function loveTaskAllCompleteKey(dateKey: string): string {
  return `earn:love-task-all:${dateKey}`;
}

export function level3ComboCoinKey(dateKey: string): string {
  return `earn:level3-combo:${dateKey}`;
}

export function loveFlameMilestoneKey(streak: number): string {
  return `earn:love-flame-milestone:${streak}`;
}

export function miniGameCoinKey(dateKey: string, slot: number): string {
  return `earn:minigame:${dateKey}:${slot}`;
}

export function dateCompleteCoinKey(dateKey: string, ideaId: string): string {
  return `earn:date:${dateKey}:${ideaId}`;
}

export function flirtGameCoinKey(dateKey: string, gameId: string): string {
  return `earn:flirt:${dateKey}:${gameId}`;
}

export function redeemCoinKey(couponId: string): string {
  return `spend:redeem:${couponId}`;
}

export function localMigrationCoinKey(userId: string, coupleId: string): string {
  return `migration:local:${userId}:${coupleId}`;
}

/** 無法推斷時仍給唯一 key（僅離線 fallback） */
export function fallbackEarnCoinKey(source: string): string {
  return `earn:${source}:${todayKey()}:${makeId()}`;
}

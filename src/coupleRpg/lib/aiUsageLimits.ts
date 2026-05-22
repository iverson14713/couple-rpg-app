/** LoveQuest daily AI pool — shared with server guard.mjs defaults. */
export const AI_USAGE_LIMIT_FREE = 3;
export const AI_USAGE_LIMIT_PRO = 30;

export type AiPlanTier = 'free' | 'pro';

export function getDailyAiLimit(plan: AiPlanTier): number {
  return plan === 'pro' ? AI_USAGE_LIMIT_PRO : AI_USAGE_LIMIT_FREE;
}

export function capAiUsageUsed(used: number, limit: number): number {
  const n = Math.max(0, Math.floor(used));
  return Math.min(n, limit);
}

export function formatAiUsageLine(used: number, limit: number): string {
  const { displayUsed, displayLimit } = formatAiQuotaDisplay(used, limit);
  return `${displayUsed} / ${displayLimit}`;
}

/** 功能頁顯示：今日剩餘 AI：2 / 3 */
export function formatAiRemainingLine(remaining: number, limit: number): string {
  const displayLimit = Math.max(0, Math.floor(limit));
  const displayRemaining = Math.max(0, Math.min(Math.floor(remaining), displayLimit));
  return `今日剩餘 AI：${displayRemaining} / ${displayLimit}`;
}

export function formatAiQuotaDisplay(
  used: number,
  limit: number
): { displayUsed: number; displayLimit: number; displayRemaining: number } {
  const displayLimit = Math.max(0, Math.floor(limit));
  const displayUsed = capAiUsageUsed(used, displayLimit);
  return {
    displayUsed,
    displayLimit,
    displayRemaining: Math.max(0, displayLimit - displayUsed),
  };
}

export function aiQuotaExhaustedMessage(isPro: boolean): string {
  if (isPro) {
    return `今日 AI 次數已達上限（${AI_USAGE_LIMIT_PRO} 次），請明天再試`;
  }
  return '今日免費 AI 次數已用完，升級 Pro 可每日使用 30 次';
}

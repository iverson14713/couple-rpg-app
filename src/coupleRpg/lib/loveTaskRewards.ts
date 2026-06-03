/** 每日固定戀愛任務數量 */
export const LOVE_TASKS_PER_DAY = 2;

/** Free：每個任務槽位每日可「換一個」次數 */
export const LOVE_TASK_REROLL_LIMIT_FREE = 1;

/** Pro：每個任務槽位每日可「換一個」次數 */
export const LOVE_TASK_REROLL_LIMIT_PRO = 3;

export function loveTaskRerollLimit(isPro: boolean): number {
  return isPro ? LOVE_TASK_REROLL_LIMIT_PRO : LOVE_TASK_REROLL_LIMIT_FREE;
}

export function loveTaskRerollsUsed(data: { rerollsByTaskId: Record<string, number> }, taskId: string): number {
  return data.rerollsByTaskId[taskId] ?? 0;
}

export function canRerollLoveTask(
  data: { rerollsByTaskId: Record<string, number> },
  taskId: string,
  isPro: boolean
): boolean {
  return loveTaskRerollsUsed(data, taskId) < loveTaskRerollLimit(isPro);
}

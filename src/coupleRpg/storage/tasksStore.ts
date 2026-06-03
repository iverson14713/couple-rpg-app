import { LOVE_TASK_POOL } from '../data/loveTaskPool';
import { LOVE_TASK_POOL_PRO } from '../data/loveTaskPoolPro';
import { LOVE_TASKS_PER_DAY } from '../lib/loveTaskRewards';
import {
  syncTasksRewardFlagsFromLedger,
  type LedgerContext,
} from './dailyRewardLedgerStore';
import { makeId } from '../lib/id';
import { shuffleWithSeed } from '../lib/seededRandom';
import { todayKey } from '../lib/dates';
import type { LoveTask, TasksData } from './types';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export function generateDailyTasks(dateKey: string, isPro = false): LoveTask[] {
  const pool = isPro ? [...LOVE_TASK_POOL, ...LOVE_TASK_POOL_PRO] : LOVE_TASK_POOL;
  const shuffled = shuffleWithSeed(pool, `${dateKey}-tasks`);
  return shuffled.slice(0, LOVE_TASKS_PER_DAY).map((t) => ({
    id: makeId(),
    templateId: t.id,
    label: t.label,
    emoji: t.emoji,
    done: false,
  }));
}

/** Normalize persisted / partial task blobs (legacy + new fields). */
export function normalizeTasksShape(raw: Partial<TasksData> & { dailyTasks?: LoveTask[] }): TasksData {
  const today = todayKey();
  const date = typeof raw.date === 'string' && raw.date ? raw.date : today;
  const dailyTasks = Array.isArray(raw.dailyTasks) ? raw.dailyTasks : [];
  let rewardedTaskIds = Array.isArray(raw.rewardedTaskIds) ? [...raw.rewardedTaskIds] : [];

  let dailyAllCompleteRewardDate: string | null = null;
  if (
    typeof raw.dailyAllCompleteRewardDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw.dailyAllCompleteRewardDate)
  ) {
    dailyAllCompleteRewardDate = raw.dailyAllCompleteRewardDate;
  }

  const rerollsByTaskId =
    raw.rerollsByTaskId && typeof raw.rerollsByTaskId === 'object' && !Array.isArray(raw.rerollsByTaskId)
      ? { ...raw.rerollsByTaskId }
      : {};

  // Legacy: 舊版每日一次 LoveCoin → 將今日已完成任務標記為已領獎，避免升級後重複發放
  const legacyClaimed =
    typeof raw.dailyRewardClaimedDate === 'string' && raw.dailyRewardClaimedDate === date;
  if (legacyClaimed && date === today) {
    for (const t of dailyTasks) {
      if (t.done && !rewardedTaskIds.includes(t.id)) {
        rewardedTaskIds.push(t.id);
      }
    }
    if (dailyTasks.filter((t) => t.done).length >= LOVE_TASKS_PER_DAY && !dailyAllCompleteRewardDate) {
      dailyAllCompleteRewardDate = today;
    }
  }

  return {
    date,
    dailyTasks,
    rewardedTaskIds,
    dailyAllCompleteRewardDate,
    rerollsByTaskId,
  };
}

export function defaultTasksData(isPro = false): TasksData {
  const today = todayKey();
  return normalizeTasksShape({
    date: today,
    dailyTasks: generateDailyTasks(today, isPro),
    rewardedTaskIds: [],
    dailyAllCompleteRewardDate: null,
    rerollsByTaskId: {},
  });
}

export function ensureTodayTasks(data: TasksData, isPro = false): TasksData {
  const today = todayKey();
  const cur = normalizeTasksShape(data);

  if (cur.date === today && cur.dailyTasks.length === LOVE_TASKS_PER_DAY) {
    return cur;
  }

  if (cur.date === today && cur.dailyTasks.length > 0 && cur.dailyTasks.length !== LOVE_TASKS_PER_DAY) {
    return {
      ...cur,
      dailyTasks: generateDailyTasks(today, isPro),
      rewardedTaskIds: [],
      dailyAllCompleteRewardDate: null,
      rerollsByTaskId: {},
    };
  }

  if (cur.date === today && cur.dailyTasks.length === 0) {
    return {
      ...cur,
      dailyTasks: generateDailyTasks(today, isPro),
    };
  }

  return {
    date: today,
    dailyTasks: generateDailyTasks(today, isPro),
    rewardedTaskIds: [],
    dailyAllCompleteRewardDate: null,
    rerollsByTaskId: {},
  };
}

function migrateLegacyTasks(raw: unknown): TasksData | null {
  if (!raw || typeof raw !== 'object') return null;
  if ('dailyTasks' in raw && Array.isArray((raw as TasksData).dailyTasks)) {
    return normalizeTasksShape(raw as TasksData);
  }
  return null;
}

function rawNeedsMigration(raw: unknown, next: TasksData, parsed: TasksData): boolean {
  if (!raw || typeof raw !== 'object') return true;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.rewardedTaskIds)) return true;
  if (!('dailyAllCompleteRewardDate' in o)) return true;
  if (!('rerollsByTaskId' in o)) return true;
  if (parsed.date !== next.date) return true;
  if (next.dailyTasks.length !== parsed.dailyTasks?.length) return true;
  return false;
}

export function loadTasks(isPro = false, ledgerCtx?: LedgerContext): TasksData {
  const raw = loadJson<unknown>(LQ_KEYS.tasks, null);
  const parsed = migrateLegacyTasks(raw) ?? defaultTasksData(isPro);
  let next = ensureTodayTasks(parsed, isPro);
  if (ledgerCtx) {
    next = syncTasksRewardFlagsFromLedger(ledgerCtx, next);
  }
  if (rawNeedsMigration(raw, next, parsed)) {
    saveTasks(next);
  }
  return next;
}

export function saveTasks(data: TasksData): void {
  saveJson(LQ_KEYS.tasks, normalizeTasksShape(data));
}

export function toggleDailyTask(data: TasksData, id: string): { data: TasksData; task: LoveTask | null } {
  let changed: LoveTask | null = null;
  const dailyTasks = data.dailyTasks.map((t) => {
    if (t.id !== id) return t;
    changed = { ...t, done: !t.done };
    return changed;
  });
  const base = normalizeTasksShape(data);
  return { data: { ...base, dailyTasks }, task: changed };
}

/**
 * Replace one daily love task with another template (no reward).
 * Does not reset per-task reward or reroll counts for other slots.
 */
export function replaceLoveTask(data: TasksData, taskId: string, isPro = false): TasksData {
  const base = normalizeTasksShape(data);
  const task = base.dailyTasks.find((t) => t.id === taskId);
  if (!task) return base;

  const pool = isPro ? [...LOVE_TASK_POOL, ...LOVE_TASK_POOL_PRO] : LOVE_TASK_POOL;
  const usedByOthers = new Set(base.dailyTasks.filter((t) => t.id !== taskId).map((t) => t.templateId));
  const candidates = pool.filter((tpl) => tpl.id !== task.templateId && !usedByOthers.has(tpl.id));
  const pickPool = candidates.length > 0 ? candidates : pool.filter((tpl) => tpl.id !== task.templateId);
  const picked = pickPool[Math.floor(Math.random() * Math.max(pickPool.length, 1))] ?? pool[0];

  const newTask: LoveTask = {
    id: makeId(),
    templateId: picked.id,
    label: picked.label,
    emoji: picked.emoji,
    done: false,
  };

  const rerollsByTaskId = { ...base.rerollsByTaskId };
  const prevRerolls = rerollsByTaskId[taskId] ?? 0;
  delete rerollsByTaskId[taskId];
  rerollsByTaskId[newTask.id] = prevRerolls + 1;

  return {
    ...base,
    dailyTasks: base.dailyTasks.map((t) => (t.id === taskId ? newTask : t)),
    rerollsByTaskId,
  };
}

export function dailyTaskProgress(tasks: LoveTask[]) {
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

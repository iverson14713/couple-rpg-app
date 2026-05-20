import { LOVE_TASK_POOL } from '../data/loveTaskPool';
import { makeId } from '../lib/id';
import { pickCountForDay, shuffleWithSeed } from '../lib/seededRandom';
import { todayKey } from '../lib/dates';
import type { LoveTask, TasksData } from './types';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export function generateDailyTasks(dateKey: string): LoveTask[] {
  const count = pickCountForDay(dateKey, 1, 3);
  const shuffled = shuffleWithSeed(LOVE_TASK_POOL, `${dateKey}-tasks`);
  return shuffled.slice(0, count).map((t) => ({
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
  const rewardedTaskIds = Array.isArray(raw.rewardedTaskIds) ? raw.rewardedTaskIds : [];

  let dailyRewardClaimedDate: string | null = null;
  if (typeof raw.dailyRewardClaimedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dailyRewardClaimedDate)) {
    dailyRewardClaimedDate = raw.dailyRewardClaimedDate;
  }
  // Legacy: old builds used rewardedTaskIds + task instance ids; if any id was stored for today's
  // task set, treat LoveCoin as already claimed for today so we never double-grant after upgrade.
  if (!dailyRewardClaimedDate && date === today && rewardedTaskIds.length > 0) {
    dailyRewardClaimedDate = today;
  }

  return {
    date,
    dailyTasks,
    rewardedTaskIds,
    dailyRewardClaimedDate,
  };
}

export function defaultTasksData(): TasksData {
  const today = todayKey();
  return normalizeTasksShape({
    date: today,
    dailyTasks: generateDailyTasks(today),
    rewardedTaskIds: [],
    dailyRewardClaimedDate: null,
  });
}

export function ensureTodayTasks(data: TasksData): TasksData {
  const today = todayKey();
  const cur = normalizeTasksShape(data);

  if (cur.date === today && cur.dailyTasks.length > 0) {
    return cur;
  }

  if (cur.date === today && cur.dailyTasks.length === 0) {
    return {
      date: today,
      dailyTasks: generateDailyTasks(today),
      rewardedTaskIds: cur.rewardedTaskIds,
      dailyRewardClaimedDate: cur.dailyRewardClaimedDate,
    };
  }

  return {
    date: today,
    dailyTasks: generateDailyTasks(today),
    rewardedTaskIds: [],
    dailyRewardClaimedDate: null,
  };
}

function migrateLegacyTasks(raw: unknown): TasksData | null {
  if (!raw || typeof raw !== 'object') return null;
  if ('dailyTasks' in raw && Array.isArray((raw as TasksData).dailyTasks)) {
    return normalizeTasksShape(raw as TasksData);
  }
  return null;
}

function rawMissingRewardedIds(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  return !Array.isArray((raw as { rewardedTaskIds?: unknown }).rewardedTaskIds);
}

function rawMissingDailyRewardClaimed(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  return !('dailyRewardClaimedDate' in (raw as object));
}

export function loadTasks(): TasksData {
  const raw = loadJson<unknown>(LQ_KEYS.tasks, null);
  const parsed = migrateLegacyTasks(raw) ?? defaultTasksData();
  const next = ensureTodayTasks(parsed);
  if (
    !raw ||
    (parsed as TasksData).date !== next.date ||
    next.dailyTasks.length !== (parsed as TasksData).dailyTasks?.length ||
    rawMissingRewardedIds(raw) ||
    rawMissingDailyRewardClaimed(raw)
  ) {
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
 * Excludes the current template and templates already used by other slots when possible.
 * Does not clear `dailyRewardClaimedDate` (daily LoveCoin claim is date-scoped, not per task id).
 */
export function replaceLoveTask(data: TasksData, taskId: string): TasksData {
  const base = normalizeTasksShape(data);
  const task = base.dailyTasks.find((t) => t.id === taskId);
  if (!task) return base;
  const usedByOthers = new Set(base.dailyTasks.filter((t) => t.id !== taskId).map((t) => t.templateId));
  const candidates = LOVE_TASK_POOL.filter((tpl) => tpl.id !== task.templateId && !usedByOthers.has(tpl.id));
  const pool = candidates.length > 0 ? candidates : LOVE_TASK_POOL.filter((tpl) => tpl.id !== task.templateId);
  const picked = pool[Math.floor(Math.random() * Math.max(pool.length, 1))] ?? LOVE_TASK_POOL[0];
  const newTask: LoveTask = {
    id: makeId(),
    templateId: picked.id,
    label: picked.label,
    emoji: picked.emoji,
    done: false,
  };
  return {
    ...base,
    dailyTasks: base.dailyTasks.map((t) => (t.id === taskId ? newTask : t)),
  };
}

export function dailyTaskProgress(tasks: LoveTask[]) {
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

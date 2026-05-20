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

export function defaultTasksData(): TasksData {
  const today = todayKey();
  return { date: today, dailyTasks: generateDailyTasks(today) };
}

export function ensureTodayTasks(data: TasksData): TasksData {
  const today = todayKey();
  if (data.date === today && data.dailyTasks.length > 0) return data;
  return { date: today, dailyTasks: generateDailyTasks(today) };
}

function migrateLegacyTasks(raw: unknown): TasksData | null {
  if (!raw || typeof raw !== 'object') return null;
  if ('dailyTasks' in raw && Array.isArray((raw as TasksData).dailyTasks)) {
    return raw as TasksData;
  }
  return null;
}

export function loadTasks(): TasksData {
  const raw = loadJson<unknown>(LQ_KEYS.tasks, null);
  const parsed = migrateLegacyTasks(raw) ?? defaultTasksData();
  const next = ensureTodayTasks(parsed);
  if (
    !raw ||
    (parsed as TasksData).date !== next.date ||
    next.dailyTasks.length !== (parsed as TasksData).dailyTasks?.length
  ) {
    saveTasks(next);
  }
  return next;
}

export function saveTasks(data: TasksData): void {
  saveJson(LQ_KEYS.tasks, data);
}

export function toggleDailyTask(data: TasksData, id: string): { data: TasksData; task: LoveTask | null } {
  let changed: LoveTask | null = null;
  const dailyTasks = data.dailyTasks.map((t) => {
    if (t.id !== id) return t;
    changed = { ...t, done: !t.done };
    return changed;
  });
  return { data: { ...data, dailyTasks }, task: changed };
}

export function dailyTaskProgress(tasks: LoveTask[]) {
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

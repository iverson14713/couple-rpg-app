import { todayKey } from '../lib/dates';
import { makeId } from '../lib/id';
import type { LoveTask, TasksData } from './types';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

const DEFAULT_LOVE_TASKS: Omit<LoveTask, 'done'>[] = [
  { id: 'lt-1', label: '傳一則甜蜜訊息', emoji: '💌' },
  { id: 'lt-2', label: '說一句稱讚的話', emoji: '✨' },
  { id: 'lt-3', label: '牽手散步 10 分鐘', emoji: '🚶' },
  { id: 'lt-4', label: '規劃週末小約會', emoji: '📅' },
];

export function defaultTasksData(): TasksData {
  const today = todayKey();
  return {
    lastResetDate: today,
    loveTasks: DEFAULT_LOVE_TASKS.map((t) => ({ ...t, done: false })),
  };
}

function resetIfNewDay(data: TasksData): TasksData {
  const today = todayKey();
  if (data.lastResetDate === today) return data;
  return {
    lastResetDate: today,
    loveTasks: data.loveTasks.map((t) => ({ ...t, done: false, rewardedAt: undefined })),
  };
}

export function loadTasks(): TasksData {
  const raw = loadJson(LQ_KEYS.tasks, defaultTasksData());
  return resetIfNewDay(raw);
}

export function saveTasks(data: TasksData): void {
  saveJson(LQ_KEYS.tasks, data);
}

export function toggleLoveTask(data: TasksData, id: string): { data: TasksData; task: LoveTask | null } {
  const today = todayKey();
  let changed: LoveTask | null = null;
  const loveTasks = data.loveTasks.map((t) => {
    if (t.id !== id) return t;
    const nextDone = !t.done;
    changed = { ...t, done: nextDone, rewardedAt: nextDone ? today : undefined };
    return changed;
  });
  return { data: { ...data, loveTasks }, task: changed };
}

export function addLoveTask(data: TasksData, label: string): TasksData {
  const trimmed = label.trim();
  if (!trimmed) return data;
  return {
    ...data,
    loveTasks: [...data.loveTasks, { id: makeId(), label: trimmed, emoji: '💕', done: false }],
  };
}

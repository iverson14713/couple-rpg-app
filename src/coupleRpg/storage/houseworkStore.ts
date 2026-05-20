import { makeId } from '../lib/id';
import { weekKey } from '../lib/dates';
import type {
  HouseworkCompletion,
  HouseworkData,
  HouseworkItem,
  PartnerId,
  PendingHouseworkSpin,
} from './types';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export const DEFAULT_HOUSEWORK_ITEMS: HouseworkItem[] = [
  { id: 'hw-dishes', label: '洗碗', emoji: '🧽' },
  { id: 'hw-trash', label: '倒垃圾', emoji: '🗑️' },
  { id: 'hw-mop', label: '拖地', emoji: '🧹' },
  { id: 'hw-laundry', label: '洗衣服', emoji: '👕' },
  { id: 'hw-toilet', label: '洗廁所', emoji: '🚽' },
];

export function defaultHouseworkData(): HouseworkData {
  return {
    items: [...DEFAULT_HOUSEWORK_ITEMS],
    completions: [],
    pendingSpin: null,
  };
}

export function loadHousework(): HouseworkData {
  const data = loadJson(LQ_KEYS.housework, defaultHouseworkData());
  if (data.items.length === 0) {
    return { ...data, items: [...DEFAULT_HOUSEWORK_ITEMS] };
  }
  return data;
}

export function saveHousework(data: HouseworkData): void {
  saveJson(LQ_KEYS.housework, data);
}

export function spinHousework(items: HouseworkItem[]): PendingHouseworkSpin | null {
  if (items.length === 0) return null;
  const task = items[Math.floor(Math.random() * items.length)]!;
  const partner: PartnerId = Math.random() < 0.5 ? 'A' : 'B';
  return {
    taskId: task.id,
    taskLabel: task.label,
    emoji: task.emoji,
    partner,
    spunAt: new Date().toISOString(),
  };
}

export function completePending(
  data: HouseworkData,
  pending: PendingHouseworkSpin
): { data: HouseworkData; completion: HouseworkCompletion } {
  const completion: HouseworkCompletion = {
    id: makeId(),
    taskId: pending.taskId,
    taskLabel: pending.taskLabel,
    emoji: pending.emoji,
    partner: pending.partner,
    completedAt: new Date().toISOString(),
    points: 10,
  };
  return {
    data: {
      ...data,
      pendingSpin: null,
      completions: [completion, ...data.completions].slice(0, 200),
    },
    completion,
  };
}

export type WeeklyHouseworkStats = {
  weekKey: string;
  total: number;
  byPartner: Record<PartnerId, number>;
  byTask: { label: string; emoji: string; count: number }[];
};

export function getWeeklyStats(completions: HouseworkCompletion[], ref = new Date()): WeeklyHouseworkStats {
  const wk = weekKey(ref);
  const weekCompletions = completions.filter((c) => weekKey(new Date(c.completedAt)) === wk);

  const byPartner: Record<PartnerId, number> = { A: 0, B: 0 };
  const taskMap = new Map<string, { label: string; emoji: string; count: number }>();

  for (const c of weekCompletions) {
    byPartner[c.partner] += 1;
    const existing = taskMap.get(c.taskId);
    if (existing) existing.count += 1;
    else taskMap.set(c.taskId, { label: c.taskLabel, emoji: c.emoji, count: 1 });
  }

  return {
    weekKey: wk,
    total: weekCompletions.length,
    byPartner,
    byTask: [...taskMap.values()].sort((a, b) => b.count - a.count),
  };
}

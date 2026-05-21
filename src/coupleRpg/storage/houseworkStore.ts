import { makeId } from '../lib/id';
import { todayKey, weekKey } from '../lib/dates';
import { stampHouseworkData, touchAssignedChore } from './houseworkSyncMeta';
import type {
  HouseworkAssignedChore,
  HouseworkCompletion,
  HouseworkData,
  HouseworkItem,
  HouseworkTodayAssignment,
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
  { id: 'hw-fold', label: '折衣服', emoji: '👔' },
  { id: 'hw-litter', label: '清貓砂', emoji: '🐱' },
  { id: 'hw-living', label: '整理客廳', emoji: '🛋️' },
  { id: 'hw-shopping', label: '買日用品', emoji: '🛒' },
  { id: 'hw-bath', label: '清浴室', emoji: '🚿' },
  { id: 'hw-desk', label: '擦桌子', emoji: '🪑' },
];

function emptyTodayAssignment(date: string = todayKey()): HouseworkTodayAssignment {
  return { date, selectedTaskIds: [], assignedAt: null, chores: [] };
}

function mergeDefaultItems(items: HouseworkItem[]): HouseworkItem[] {
  const labels = new Set(items.map((i) => i.label));
  const merged = [...items];
  for (const d of DEFAULT_HOUSEWORK_ITEMS) {
    if (!labels.has(d.label)) merged.push({ ...d });
  }
  return merged;
}

function normalizeHouseworkData(raw: HouseworkData): HouseworkData {
  const today = todayKey();
  let todayAssignment = raw.todayAssignment ?? null;
  if (todayAssignment && todayAssignment.date !== today) {
    todayAssignment = null;
  }

  return {
    items: mergeDefaultItems(raw.items.length ? raw.items : [...DEFAULT_HOUSEWORK_ITEMS]),
    completions: raw.completions ?? [],
    pendingSpin: null,
    todayAssignment,
    lastExtraAssignee: raw.lastExtraAssignee ?? null,
  };
}

export function defaultHouseworkData(): HouseworkData {
  return {
    items: [...DEFAULT_HOUSEWORK_ITEMS],
    completions: [],
    pendingSpin: null,
    todayAssignment: null,
    lastExtraAssignee: null,
  };
}

export function loadHousework(): HouseworkData {
  const data = loadJson<HouseworkData>(LQ_KEYS.housework, defaultHouseworkData());
  return normalizeHouseworkData(data);
}

export function saveHousework(data: HouseworkData): void {
  saveJson(LQ_KEYS.housework, stampHouseworkData(data));
}

export function getTodayAssignment(data: HouseworkData, today: string = todayKey()): HouseworkTodayAssignment | null {
  const a = data.todayAssignment;
  if (!a || a.date !== today) return null;
  return a;
}

export function ensureTodayAssignment(data: HouseworkData, today: string = todayKey()): HouseworkData {
  const cur = getTodayAssignment(data, today);
  if (cur) return data;
  return { ...data, todayAssignment: emptyTodayAssignment(today), pendingSpin: null };
}

export function setSelectedTaskIds(data: HouseworkData, taskIds: string[], today: string = todayKey()): HouseworkData {
  const base = ensureTodayAssignment(data, today);
  const cur = getTodayAssignment(base, today)!;
  return {
    ...base,
    todayAssignment: {
      ...cur,
      selectedTaskIds: taskIds,
      assignedAt: null,
      chores: [],
    },
  };
}

function shuffleIds<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function splitCounts(
  n: number,
  lastExtra: PartnerId | null
): { countA: number; countB: number; newExtra: PartnerId | null } {
  if (n <= 0) return { countA: 0, countB: 0, newExtra: lastExtra };
  if (n % 2 === 0) {
    return { countA: n / 2, countB: n / 2, newExtra: lastExtra };
  }
  const extraFor: PartnerId = lastExtra === 'A' ? 'B' : 'A';
  if (extraFor === 'A') {
    return { countA: Math.ceil(n / 2), countB: Math.floor(n / 2), newExtra: 'A' };
  }
  return { countA: Math.floor(n / 2), countB: Math.ceil(n / 2), newExtra: 'B' };
}

export function buildDistribution(
  taskIds: string[],
  lastExtra: PartnerId | null
): { chores: HouseworkAssignedChore[]; newExtra: PartnerId | null } {
  const shuffled = shuffleIds(taskIds);
  const { countA, countB, newExtra } = splitCounts(shuffled.length, lastExtra);
  const chores: HouseworkAssignedChore[] = [];
  shuffled.forEach((taskId, index) => {
    const assignee: PartnerId = index < countA ? 'A' : 'B';
    chores.push({ taskId, assignee, completed: false, rewarded: false });
  });
  return { chores, newExtra: shuffled.length % 2 === 0 ? lastExtra : newExtra };
}

export function startTodayAssignment(data: HouseworkData, today: string = todayKey()): HouseworkData | null {
  const base = ensureTodayAssignment(data, today);
  const cur = getTodayAssignment(base, today)!;
  if (cur.selectedTaskIds.length === 0) return null;

  const { chores, newExtra } = buildDistribution(cur.selectedTaskIds, base.lastExtraAssignee);
  return {
    ...base,
    lastExtraAssignee: newExtra,
    todayAssignment: {
      ...cur,
      assignedAt: new Date().toISOString(),
      chores,
    },
  };
}

export function clearTodayAssignment(data: HouseworkData): HouseworkData {
  return { ...data, todayAssignment: null, pendingSpin: null };
}

export function reassignToday(data: HouseworkData, today: string = todayKey()): HouseworkData | null {
  const cur = getTodayAssignment(data, today);
  if (!cur || cur.selectedTaskIds.length === 0) return null;
  const { chores, newExtra } = buildDistribution(cur.selectedTaskIds, data.lastExtraAssignee);
  return {
    ...data,
    lastExtraAssignee: newExtra,
    todayAssignment: {
      ...cur,
      assignedAt: new Date().toISOString(),
      chores,
    },
  };
}

export type HouseworkChoreCompleteResult = {
  data: HouseworkData;
  granted: boolean;
  chore: HouseworkAssignedChore | null;
  item: HouseworkItem | null;
};

export type CompleteAssignedChoreOptions = {
  /** 通過每日 claim 檢查後才為 true */
  grantReward?: boolean;
  /** 今日此 taskId 已在 claim 表（含舊 record.rewarded 補登） */
  rewardAlreadyClaimed?: boolean;
};

export function completeAssignedChore(
  data: HouseworkData,
  taskId: string,
  today: string = todayKey(),
  completedByUserId?: string | null,
  options?: CompleteAssignedChoreOptions
): HouseworkChoreCompleteResult {
  const cur = getTodayAssignment(data, today);
  if (!cur?.assignedAt) {
    return { data, granted: false, chore: null, item: null };
  }

  const chore = cur.chores.find((c) => c.taskId === taskId);
  const item = data.items.find((i) => i.id === taskId) ?? null;
  if (!chore || chore.completed) {
    return { data, granted: false, chore: chore ?? null, item };
  }

  const grantNow = options?.grantReward === true;
  const rewardMarked =
    grantNow || options?.rewardAlreadyClaimed === true || chore.rewarded;
  const now = new Date().toISOString();
  const updatedChore: HouseworkAssignedChore = touchAssignedChore({
    ...chore,
    completed: true,
    rewarded: rewardMarked,
    completedAt: chore.completedAt ?? now,
    completedBy: chore.completedBy ?? completedByUserId ?? null,
  });
  const chores = cur.chores.map((c) => (c.taskId === taskId ? updatedChore : c));

  let completions = data.completions;
  if (grantNow && item) {
    const completion: HouseworkCompletion = {
      id: makeId(),
      taskId: item.id,
      taskLabel: item.label,
      emoji: item.emoji,
      partner: chore.assignee,
      completedAt: new Date().toISOString(),
      points: 10,
      rpgRewardGranted: true,
    };
    completions = [completion, ...completions].slice(0, 200);
  }

  return {
    data: {
      ...data,
      completions,
      todayAssignment: { ...cur, chores },
    },
    granted: grantNow,
    chore: updatedChore,
    item,
  };
}

export type HouseworkHomeStatus = {
  done: number;
  total: number;
  badge?: string;
  summaryPart?: string;
};

export function getHouseworkHomeStatus(data: HouseworkData, today: string = todayKey()): HouseworkHomeStatus {
  const a = getTodayAssignment(data, today);
  if (!a?.assignedAt || a.chores.length === 0) {
    if (a && a.selectedTaskIds.length > 0) {
      return { done: 0, total: 0, badge: '待分配', summaryPart: '家事待分配' };
    }
    return { done: 0, total: 0, badge: '家事待做' };
  }

  const total = a.chores.length;
  const done = a.chores.filter((c) => c.completed).length;

  if (done >= total) {
    return { done, total, badge: '已完成', summaryPart: `家事 ${done}/${total}` };
  }
  const progress = `${done}/${total}`;
  return { done, total, badge: `進行中 ${progress}`, summaryPart: `家事 ${progress}` };
}

/** @deprecated 舊轉盤流程保留型別相容 */
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
    rpgRewardGranted: false,
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

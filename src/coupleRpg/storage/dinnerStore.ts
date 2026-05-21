import { makeId } from '../lib/id';
import { todayKey } from '../lib/dates';
import type { DinnerData, DinnerHistoryEntry, DinnerHomeStatus, DinnerOption } from './types';
import { stampDinnerData, touchDinnerHistoryEntry, touchDinnerOption } from './dinnerSyncMeta';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export function getActiveDinnerOptions(options: DinnerOption[]): DinnerOption[] {
  return options.filter((o) => o.isActive !== false && o.label.trim());
}

const DEFAULT_OPTIONS: DinnerOption[] = [
  { id: 'd-hotpot', label: '火鍋' },
  { id: 'd-pasta', label: '義大利麵' },
  { id: 'd-sushi', label: '壽司' },
  { id: 'd-bento', label: '便當' },
  { id: 'd-home', label: '在家開伙' },
];

export function defaultDinnerData(): DinnerData {
  return { options: [...DEFAULT_OPTIONS], history: [] };
}

export function loadDinner(): DinnerData {
  return loadJson(LQ_KEYS.dinner, defaultDinnerData());
}

export function saveDinner(data: DinnerData): void {
  saveJson(LQ_KEYS.dinner, stampDinnerData(data));
}

export function pickRandomOption(options: DinnerOption[]): DinnerOption | null {
  const active = getActiveDinnerOptions(options);
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)] ?? null;
}

export function softRemoveDinnerOption(data: DinnerData, id: string): DinnerData {
  const options = data.options.map((o) =>
    o.id === id ? touchDinnerOption({ ...o, isActive: false }) : o
  );
  return stampDinnerData({ ...data, options });
}

export function getTodayDinner(history: DinnerHistoryEntry[]): DinnerHistoryEntry | null {
  const key = todayKey();
  return history.find((h) => h.date === key) ?? null;
}

export function saveTodayResult(
  data: DinnerData,
  label: string,
  meta?: { selectedFoodLocalId?: string | null; decidedBy?: string | null }
): DinnerData {
  const date = todayKey();
  const savedAt = new Date().toISOString();
  const existing = data.history.find((h) => h.date === date);
  const entry: DinnerHistoryEntry = touchDinnerHistoryEntry({
    id: existing?.id ?? makeId(),
    date,
    label: label.trim(),
    savedAt,
    selectedFoodLocalId: meta?.selectedFoodLocalId ?? existing?.selectedFoodLocalId ?? null,
    decidedBy: meta?.decidedBy ?? existing?.decidedBy ?? null,
    remoteId: existing?.remoteId ?? null,
  });
  const withoutToday = data.history.filter((h) => h.date !== date);
  const history = [entry, ...withoutToday]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  return stampDinnerData({ ...data, history });
}

export function clearTodayDinnerResult(data: DinnerData): DinnerData {
  const date = todayKey();
  const history = data.history.filter((h) => h.date !== date);
  return stampDinnerData({ ...data, history });
}

export function getDinnerHomeStatus(
  history: DinnerHistoryEntry[],
  today: string = todayKey()
): DinnerHomeStatus {
  const todayEntry = history.find((h) => h.date === today);
  if (todayEntry?.label?.trim()) {
    const name = todayEntry.label.trim();
    return { badge: '已決定', summaryPart: `晚餐：${name}` };
  }
  return { badge: '待決定' };
}

export function getRecentHistory(history: DinnerHistoryEntry[], limit = 7): DinnerHistoryEntry[] {
  return [...history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

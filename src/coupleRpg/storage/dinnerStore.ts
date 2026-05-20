import { makeId } from '../lib/id';
import { todayKey } from '../lib/dates';
import type { DinnerData, DinnerHistoryEntry, DinnerOption } from './types';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

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
  saveJson(LQ_KEYS.dinner, data);
}

export function pickRandomOption(options: DinnerOption[]): DinnerOption | null {
  if (options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)] ?? null;
}

export function getTodayDinner(history: DinnerHistoryEntry[]): DinnerHistoryEntry | null {
  const key = todayKey();
  return history.find((h) => h.date === key) ?? null;
}

export function saveTodayResult(data: DinnerData, label: string): DinnerData {
  const date = todayKey();
  const withoutToday = data.history.filter((h) => h.date !== date);
  const entry: DinnerHistoryEntry = {
    id: makeId(),
    date,
    label,
    savedAt: new Date().toISOString(),
  };
  const history = [entry, ...withoutToday]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  return { ...data, history };
}

export function getRecentHistory(history: DinnerHistoryEntry[], limit = 7): DinnerHistoryEntry[] {
  return [...history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

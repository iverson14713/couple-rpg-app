import { DATE_IDEAS_POOL } from '../data/dateIdeasPool';
import { makeId } from '../lib/id';
import { todayKey, timeLabel } from '../lib/dates';
import type { DateFilterKey, DateFilters, DateHistoryEntry, DatePlannerData, DateSuggestion } from './dateTypes';
import { DEFAULT_DATE_FILTERS } from './dateTypes';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export function defaultDatePlannerData(): DatePlannerData {
  return {
    filters: DEFAULT_DATE_FILTERS(),
    favoriteIds: [],
    current: null,
    history: [],
  };
}

export function loadDatePlanner(): DatePlannerData {
  const raw = loadJson(LQ_KEYS.datePlanner, defaultDatePlannerData());
  return {
    ...defaultDatePlannerData(),
    ...raw,
    filters: { ...DEFAULT_DATE_FILTERS(), ...raw.filters },
    favoriteIds: raw.favoriteIds ?? [],
    history: raw.history ?? [],
  };
}

export function saveDatePlanner(data: DatePlannerData): void {
  saveJson(LQ_KEYS.datePlanner, data);
}

export function getActiveFilterKeys(filters: DateFilters): DateFilterKey[] {
  return (Object.keys(filters) as DateFilterKey[]).filter((k) => filters[k]);
}

export function filterIdeas(filters: DateFilters) {
  const active = getActiveFilterKeys(filters);
  if (active.length === 0) return [...DATE_IDEAS_POOL];
  return DATE_IDEAS_POOL.filter((idea) => active.every((key) => idea.tags.includes(key)));
}

export function pickRandomDateIdea(filters: DateFilters): DateSuggestion | null {
  const pool = filterIdeas(filters);
  if (pool.length === 0) return null;
  const picked = pool[Math.floor(Math.random() * pool.length)]!;
  return {
    ...picked,
    instanceId: makeId(),
    generatedAt: new Date().toISOString(),
    completed: false,
  };
}

export function toggleFavorite(data: DatePlannerData, ideaId: string): DatePlannerData {
  const set = new Set(data.favoriteIds);
  if (set.has(ideaId)) set.delete(ideaId);
  else set.add(ideaId);
  return { ...data, favoriteIds: [...set] };
}

export function isFavorite(data: DatePlannerData, ideaId: string): boolean {
  return data.favoriteIds.includes(ideaId);
}

export function completeCurrentDate(data: DatePlannerData): { data: DatePlannerData; entry: DateHistoryEntry | null } {
  const cur = data.current;
  if (!cur || cur.completed) return { data, entry: null };

  const entry: DateHistoryEntry = {
    id: makeId(),
    ideaId: cur.id,
    title: cur.title,
    emoji: cur.emoji,
    date: todayKey(),
    time: timeLabel(),
    cost: cur.cost,
    duration: cur.duration,
  };

  const history = [entry, ...data.history].slice(0, 30);
  const current: DateSuggestion = { ...cur, completed: true };

  return {
    data: { ...data, current, history },
    entry,
  };
}

export function getRecentDateHistory(history: DateHistoryEntry[], limit = 7): DateHistoryEntry[] {
  return history.slice(0, limit);
}

export function getFavoriteIdeas(favoriteIds: string[]) {
  return DATE_IDEAS_POOL.filter((i) => favoriteIds.includes(i.id));
}

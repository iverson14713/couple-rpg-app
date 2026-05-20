import { makeId } from '../lib/id';
import { timeLabel, todayKey } from '../lib/dates';
import type { ActivityLogEntry } from './types';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export function loadActivity(): ActivityLogEntry[] {
  return loadJson(LQ_KEYS.activity, []);
}

export function saveActivity(entries: ActivityLogEntry[]): void {
  saveJson(LQ_KEYS.activity, entries.slice(0, 50));
}

export function appendActivity(summary: string): ActivityLogEntry[] {
  const entries = loadActivity();
  const entry: ActivityLogEntry = {
    id: makeId(),
    date: todayKey(),
    time: timeLabel(),
    summary,
  };
  const next = [entry, ...entries].slice(0, 50);
  saveActivity(next);
  return next;
}

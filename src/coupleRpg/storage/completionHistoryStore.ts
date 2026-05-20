import { makeId } from '../lib/id';
import { timeLabel, todayKey } from '../lib/dates';
import type { CompletionRecord, FlirtGameId } from './types';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

const MAX_RECORDS = 40;

export function loadCompletionHistory(): CompletionRecord[] {
  return loadJson(LQ_KEYS.completionHistory, []);
}

export function saveCompletionHistory(records: CompletionRecord[]): void {
  saveJson(LQ_KEYS.completionHistory, records.slice(0, MAX_RECORDS));
}

export function appendCompletion(
  kind: CompletionRecord['kind'],
  title: string,
  emoji: string,
  meta?: { gameId?: FlirtGameId; detail?: string }
): CompletionRecord[] {
  const entry: CompletionRecord = {
    id: makeId(),
    kind,
    date: todayKey(),
    time: timeLabel(),
    title,
    emoji,
    gameId: meta?.gameId,
    detail: meta?.detail,
  };
  const next = [entry, ...loadCompletionHistory()].slice(0, MAX_RECORDS);
  saveCompletionHistory(next);
  return next;
}

export function getRecentCompletions(records: CompletionRecord[], limit = 20): CompletionRecord[] {
  return records.slice(0, limit);
}

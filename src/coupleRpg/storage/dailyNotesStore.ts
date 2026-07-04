import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import type { CoupleDailyNote, DailyNotesCache } from './dailyNotesTypes';

const EMPTY: DailyNotesCache = { coupleId: '', notes: [], syncedAt: null };

type DismissMap = Record<string, true>;

function cacheKey(userId: string): string {
  return `${LQ_KEYS.dailyNotes}-${userId}`;
}

function dismissKey(userId: string): string {
  return `${LQ_KEYS.dailyNotePromptDismiss}-${userId}`;
}

/** sourceKey: coupleId:sourceType:sourceId:noteDate */
export function buildMemoryPromptSourceKey(
  coupleId: string,
  noteDate: string,
  sourceType: string,
  sourceId?: string | null
): string {
  return `${coupleId}:${sourceType}:${sourceId ?? '_'}:${noteDate}`;
}

export function loadDailyNotesCache(userId: string | null): DailyNotesCache {
  if (!userId) return EMPTY;
  return loadJson<DailyNotesCache>(cacheKey(userId), EMPTY);
}

export function saveDailyNotesCache(userId: string | null, cache: DailyNotesCache): void {
  if (!userId) return;
  saveJson(cacheKey(userId), cache);
}

export function mergeDailyNotes(
  local: CoupleDailyNote[],
  remote: CoupleDailyNote[]
): CoupleDailyNote[] {
  const map = new Map<string, CoupleDailyNote>();
  for (const note of local) map.set(note.noteDate, note);
  for (const note of remote) {
    const prev = map.get(note.noteDate);
    if (!prev || Date.parse(note.updatedAt) >= Date.parse(prev.updatedAt)) {
      map.set(note.noteDate, {
        ...note,
        photoUrl: note.photoUrl ?? prev?.photoUrl ?? null,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.noteDate.localeCompare(a.noteDate));
}

export function isDailyNotePromptDismissed(userId: string | null, sourceKey: string): boolean {
  if (!userId) return false;
  const map = loadJson<DismissMap>(dismissKey(userId), {});
  return map[sourceKey] === true;
}

export function dismissDailyNotePrompt(userId: string | null, sourceKey: string): void {
  if (!userId) return;
  const map = loadJson<DismissMap>(dismissKey(userId), {});
  map[sourceKey] = true;
  saveJson(dismissKey(userId), map);
}

export function clearDailyNotePromptDismiss(userId: string | null, sourceKey: string): void {
  if (!userId) return;
  const map = loadJson<DismissMap>(dismissKey(userId), {});
  delete map[sourceKey];
  saveJson(dismissKey(userId), map);
}

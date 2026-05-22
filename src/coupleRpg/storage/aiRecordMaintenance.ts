import { dateItineraryRecordId, importantDateRecordId } from '../lib/aiRecordIds';
import { AI_RECORD_HISTORY_CAP_PRO, AI_RECORD_RETENTION_MS, dispatchAiRecordsChanged } from '../lib/aiRecordsConfig';
import { loadAiFavoriteIds } from './aiFavoritesStore';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import type { SavedDateItineraryAi } from './dateItineraryAiCache';
import type { SavedImportantDateAi } from './importantDateAiCache';

function isRecordExpired(savedAt: string, recordId: string, favoriteIds: Set<string>): boolean {
  if (favoriteIds.has(recordId)) return false;
  const age = Date.now() - new Date(savedAt).getTime();
  return age > AI_RECORD_RETENTION_MS;
}

function loadDateHistoryRaw(): SavedDateItineraryAi[] {
  const raw = loadJson<SavedDateItineraryAi[] | null>(LQ_KEYS.dateItineraryAiHistory, null);
  return Array.isArray(raw) ? raw : [];
}

function loadImportantHistoryRaw(): SavedImportantDateAi[] {
  const raw = loadJson<SavedImportantDateAi[] | null>(LQ_KEYS.importantDateAiHistory, null);
  return Array.isArray(raw) ? raw : [];
}

function pruneDateHistory(hist: SavedDateItineraryAi[], favoriteIds: Set<string>): SavedDateItineraryAi[] {
  return hist
    .filter((r) => r?.plan?.title && r.suggestion?.title)
    .filter((r) => !isRecordExpired(r.savedAt, dateItineraryRecordId(r), favoriteIds))
    .slice(0, AI_RECORD_HISTORY_CAP_PRO);
}

function pruneImportantHistory(
  hist: SavedImportantDateAi[],
  favoriteIds: Set<string>
): SavedImportantDateAi[] {
  return hist
    .filter((r) => r?.plan?.title && r.event?.displayTitle)
    .filter((r) => !isRecordExpired(r.savedAt, importantDateRecordId(r), favoriteIds))
    .slice(0, AI_RECORD_HISTORY_CAP_PRO);
}

/** 啟動／列表載入時執行 90 天清理（已收藏略過） */
export function maintainDateItineraryAiStorage(isPro: boolean): boolean {
  const favoriteIds = loadAiFavoriteIds();
  let changed = false;

  const last = loadJson<SavedDateItineraryAi | null>(LQ_KEYS.lastDateItineraryAi, null);
  if (last?.plan?.title && last.suggestion?.title) {
    if (isRecordExpired(last.savedAt, dateItineraryRecordId(last), favoriteIds)) {
      saveJson(LQ_KEYS.lastDateItineraryAi, null);
      changed = true;
    }
  }

  if (!isPro) {
    if (changed) dispatchAiRecordsChanged();
    return changed;
  }

  const before = loadDateHistoryRaw();
  const after = pruneDateHistory(before, favoriteIds);
  if (after.length !== before.length) {
    saveJson(LQ_KEYS.dateItineraryAiHistory, after);
    changed = true;
    const currentLast = loadJson<SavedDateItineraryAi | null>(LQ_KEYS.lastDateItineraryAi, null);
    if (!currentLast && after[0]) {
      saveJson(LQ_KEYS.lastDateItineraryAi, after[0]);
    } else if (
      currentLast &&
      isRecordExpired(currentLast.savedAt, dateItineraryRecordId(currentLast), favoriteIds)
    ) {
      saveJson(LQ_KEYS.lastDateItineraryAi, after[0] ?? null);
    }
  }

  if (changed) dispatchAiRecordsChanged();
  return changed;
}

export function maintainImportantDateAiStorage(isPro: boolean): boolean {
  const favoriteIds = loadAiFavoriteIds();
  let changed = false;

  const last = loadJson<SavedImportantDateAi | null>(LQ_KEYS.lastImportantDateAi, null);
  if (last?.plan?.title && last.event?.displayTitle) {
    if (isRecordExpired(last.savedAt, importantDateRecordId(last), favoriteIds)) {
      saveJson(LQ_KEYS.lastImportantDateAi, null);
      changed = true;
    }
  }

  if (!isPro) {
    if (changed) dispatchAiRecordsChanged();
    return changed;
  }

  const before = loadImportantHistoryRaw();
  const after = pruneImportantHistory(before, favoriteIds);
  if (after.length !== before.length) {
    saveJson(LQ_KEYS.importantDateAiHistory, after);
    changed = true;
    const currentLast = loadJson<SavedImportantDateAi | null>(LQ_KEYS.lastImportantDateAi, null);
    if (!currentLast && after[0]) {
      saveJson(LQ_KEYS.lastImportantDateAi, after[0]);
    } else if (
      currentLast &&
      isRecordExpired(currentLast.savedAt, importantDateRecordId(currentLast), favoriteIds)
    ) {
      saveJson(LQ_KEYS.lastImportantDateAi, after[0] ?? null);
    }
  }

  if (changed) dispatchAiRecordsChanged();
  return changed;
}

export function maintainAllAiRecordsStorage(isPro: boolean): void {
  maintainDateItineraryAiStorage(isPro);
  maintainImportantDateAiStorage(isPro);
}

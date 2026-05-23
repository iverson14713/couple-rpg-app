import { formatDateShort, todayKey } from '../lib/dates';
import { importantDateRecordId } from '../lib/aiRecordIds';
import { AI_RECORD_HISTORY_CAP_PRO, dispatchAiRecordsChanged } from '../lib/aiRecordsConfig';
import { removeAiFavoriteById } from './aiFavoritesStore';
import { maintainImportantDateAiStorage } from './aiRecordMaintenance';
import type { SavedImportantDatePlan } from '../lib/importantDateItineraryPlan';
import { isSavedImportantItineraryPlan } from '../lib/importantDateItineraryPlan';
import type { AiBudgetChoice, AiStyleChoice } from '../lib/importantDateAiPrompt';
import type { ImportantDateEvent } from '../lib/importantDateEvents';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export type SavedImportantDateEventSnap = {
  id: string;
  icon: string;
  displayTitle: string;
  typeLabel: string;
  name: string;
};

export type SavedImportantDateSettings = {
  budget: AiBudgetChoice;
  customBudget: string;
  style: AiStyleChoice;
  partnerPrefs: string;
};

export type SavedImportantDateAi = {
  savedAt: string;
  dateKey: string;
  event: SavedImportantDateEventSnap;
  plan: SavedImportantDatePlan;
  settings: SavedImportantDateSettings;
};

export function snapshotImportantDateEvent(event: ImportantDateEvent): SavedImportantDateEventSnap {
  return {
    id: event.id,
    icon: event.icon,
    displayTitle: event.displayTitle,
    typeLabel: event.typeLabel,
    name: event.name,
  };
}

/** 僅供檢視已存結果時還原 sheet 標題用 */
export function savedEventToImportantDateEvent(snap: SavedImportantDateEventSnap): ImportantDateEvent {
  return {
    ...snap,
    kind: 'custom',
    dateYmd: '',
    dateLabel: '',
    daysUntil: 0,
    daysSince: 0,
    isToday: false,
    status: 'upcoming',
  };
}

function isValidImportantDateRecord(raw: SavedImportantDateAi | null | undefined): raw is SavedImportantDateAi {
  if (!raw?.event?.displayTitle || !raw.plan?.title) return false;
  if (isSavedImportantItineraryPlan(raw.plan)) {
    return raw.plan.segments.length > 0;
  }
  return true;
}

export function loadLastImportantDateAi(): SavedImportantDateAi | null {
  const raw = loadJson<SavedImportantDateAi | null>(LQ_KEYS.lastImportantDateAi, null);
  return isValidImportantDateRecord(raw) ? raw : null;
}

function loadImportantDateAiHistory(): SavedImportantDateAi[] {
  const raw = loadJson<SavedImportantDateAi[] | null>(LQ_KEYS.importantDateAiHistory, null);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidImportantDateRecord);
}

export function deleteImportantDateAiRecord(record: SavedImportantDateAi, isPro: boolean): void {
  removeAiFavoriteById(importantDateRecordId(record));

  const last = loadLastImportantDateAi();
  if (isPro) {
    const hist = loadImportantDateAiHistory().filter((r) => r.savedAt !== record.savedAt);
    saveJson(LQ_KEYS.importantDateAiHistory, hist);
    if (last?.savedAt === record.savedAt) {
      saveJson(LQ_KEYS.lastImportantDateAi, hist[0] ?? null);
    }
  } else if (last?.savedAt === record.savedAt) {
    saveJson(LQ_KEYS.lastImportantDateAi, null);
  }
  dispatchAiRecordsChanged();
}

export function listImportantDateAiRecords(isPro: boolean): SavedImportantDateAi[] {
  maintainImportantDateAiStorage(isPro);
  if (isPro) {
    const hist = loadImportantDateAiHistory();
    if (hist.length > 0) return hist.slice(0, AI_RECORD_HISTORY_CAP_PRO);
    const last = loadLastImportantDateAi();
    return last ? [last] : [];
  }
  const last = loadLastImportantDateAi();
  return last ? [last] : [];
}

export function saveImportantDateAi(
  input: Omit<SavedImportantDateAi, 'savedAt' | 'dateKey'> & { savedAt?: string; dateKey?: string },
  options?: { isPro?: boolean }
): SavedImportantDateAi {
  const record: SavedImportantDateAi = {
    savedAt: input.savedAt ?? new Date().toISOString(),
    dateKey: input.dateKey ?? todayKey(),
    event: input.event,
    plan: input.plan,
    settings: input.settings,
  };
  saveJson(LQ_KEYS.lastImportantDateAi, record);
  if (options?.isPro) {
    const prev = loadImportantDateAiHistory();
    const next = [record, ...prev.filter((r) => r.savedAt !== record.savedAt)].slice(
      0,
      AI_RECORD_HISTORY_CAP_PRO
    );
    saveJson(LQ_KEYS.importantDateAiHistory, next);
  }
  dispatchAiRecordsChanged();
  return record;
}

export function formatSavedImportantDateLabel(record: SavedImportantDateAi): string {
  return formatDateShort(record.dateKey);
}

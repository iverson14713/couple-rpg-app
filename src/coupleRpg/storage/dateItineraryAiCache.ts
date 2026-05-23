import { formatDateShort, todayKey } from '../lib/dates';
import { hydrateDateItineraryPlan, type DateItineraryPlan } from '../lib/dateItineraryAiModel';
import type {
  DateAiBudgetChoice,
  DateAiStyleChoice,
  DateAiTransportChoice,
} from '../lib/dateItineraryAiPrompt';
import type { DateCost, DateDuration, DateFilterKey, DateSuggestion } from './dateTypes';
import { dateItineraryRecordId } from '../lib/aiRecordIds';
import { AI_RECORD_HISTORY_CAP_PRO, dispatchAiRecordsChanged } from '../lib/aiRecordsConfig';
import { removeAiFavoriteById } from './aiFavoritesStore';
import { maintainDateItineraryAiStorage } from './aiRecordMaintenance';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

/** @deprecated 請改用 AI_RECORDS_CHANGED_EVENT */
export const DATE_ITINERARY_AI_SAVED_EVENT = 'lovequest:ai-records-changed';

export type SavedDateItinerarySuggestion = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  scenario: string;
  cost: DateCost;
  duration: DateDuration;
  tags: DateFilterKey[];
};

export type SavedDateItinerarySettings = {
  departure: string;
  budget: DateAiBudgetChoice;
  customBudget: string;
  transport: DateAiTransportChoice;
  style: DateAiStyleChoice;
  partnerPrefs: string;
};

/** 免費版：僅保留最近一次 AI 約會行程（localStorage） */
export type SavedDateItineraryAi = {
  savedAt: string;
  dateKey: string;
  suggestion: SavedDateItinerarySuggestion;
  plan: DateItineraryPlan;
  settings: SavedDateItinerarySettings;
};

export function snapshotDateSuggestion(s: DateSuggestion): SavedDateItinerarySuggestion {
  return {
    id: s.id,
    title: s.title,
    emoji: s.emoji,
    description: s.description,
    scenario: s.scenario,
    cost: s.cost,
    duration: s.duration,
    tags: [...s.tags],
  };
}

export function savedSuggestionToDateSuggestion(snap: SavedDateItinerarySuggestion): DateSuggestion {
  return {
    ...snap,
    instanceId: 'saved-view',
    generatedAt: '',
    completed: false,
  };
}

function isValidDateItineraryRecord(
  raw: SavedDateItineraryAi | null | undefined
): raw is SavedDateItineraryAi {
  if (!raw?.plan?.title || !raw.suggestion?.title) return false;
  raw.plan = hydrateDateItineraryPlan(raw.plan);
  return true;
}

export function loadLastDateItineraryAi(): SavedDateItineraryAi | null {
  const raw = loadJson<SavedDateItineraryAi | null>(LQ_KEYS.lastDateItineraryAi, null);
  return isValidDateItineraryRecord(raw) ? raw : null;
}

function loadDateItineraryAiHistory(): SavedDateItineraryAi[] {
  const raw = loadJson<SavedDateItineraryAi[] | null>(LQ_KEYS.dateItineraryAiHistory, null);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidDateItineraryRecord);
}

export function deleteDateItineraryAiRecord(record: SavedDateItineraryAi, isPro: boolean): void {
  removeAiFavoriteById(dateItineraryRecordId(record));

  const last = loadLastDateItineraryAi();
  if (isPro) {
    const hist = loadDateItineraryAiHistory().filter((r) => r.savedAt !== record.savedAt);
    saveJson(LQ_KEYS.dateItineraryAiHistory, hist);
    if (last?.savedAt === record.savedAt) {
      saveJson(LQ_KEYS.lastDateItineraryAi, hist[0] ?? null);
    }
  } else if (last?.savedAt === record.savedAt) {
    saveJson(LQ_KEYS.lastDateItineraryAi, null);
  }
  dispatchAiRecordsChanged();
}

export function listDateItineraryAiRecords(isPro: boolean): SavedDateItineraryAi[] {
  maintainDateItineraryAiStorage(isPro);
  if (isPro) {
    const hist = loadDateItineraryAiHistory();
    if (hist.length > 0) return hist.slice(0, AI_RECORD_HISTORY_CAP_PRO);
    const last = loadLastDateItineraryAi();
    return last ? [last] : [];
  }
  const last = loadLastDateItineraryAi();
  return last ? [last] : [];
}

export function saveLastDateItineraryAi(
  input: Omit<SavedDateItineraryAi, 'savedAt' | 'dateKey'> & { savedAt?: string; dateKey?: string },
  options?: { isPro?: boolean }
): SavedDateItineraryAi {
  const record: SavedDateItineraryAi = {
    savedAt: input.savedAt ?? new Date().toISOString(),
    dateKey: input.dateKey ?? todayKey(),
    suggestion: input.suggestion,
    plan: input.plan,
    settings: input.settings,
  };
  saveJson(LQ_KEYS.lastDateItineraryAi, record);
  if (options?.isPro) {
    const prev = loadDateItineraryAiHistory();
    const next = [record, ...prev.filter((r) => r.savedAt !== record.savedAt)].slice(
      0,
      AI_RECORD_HISTORY_CAP_PRO
    );
    saveJson(LQ_KEYS.dateItineraryAiHistory, next);
  }
  dispatchAiRecordsChanged();
  return record;
}

export function formatSavedItineraryDate(record: SavedDateItineraryAi): string {
  return formatDateShort(record.dateKey);
}

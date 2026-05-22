import { formatDateShort, todayKey } from '../lib/dates';
import type { DateItineraryPlan } from '../lib/dateItineraryAiModel';
import type {
  DateAiBudgetChoice,
  DateAiStyleChoice,
  DateAiTransportChoice,
} from '../lib/dateItineraryAiPrompt';
import type { DateCost, DateDuration, DateFilterKey, DateSuggestion } from './dateTypes';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export const DATE_ITINERARY_AI_SAVED_EVENT = 'lovequest:date-itinerary-ai-saved';

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

export function loadLastDateItineraryAi(): SavedDateItineraryAi | null {
  const raw = loadJson<SavedDateItineraryAi | null>(LQ_KEYS.lastDateItineraryAi, null);
  if (!raw?.plan?.title || !raw.suggestion?.title) return null;
  return raw;
}

export function saveLastDateItineraryAi(
  input: Omit<SavedDateItineraryAi, 'savedAt' | 'dateKey'> & { savedAt?: string; dateKey?: string }
): SavedDateItineraryAi {
  const record: SavedDateItineraryAi = {
    savedAt: input.savedAt ?? new Date().toISOString(),
    dateKey: input.dateKey ?? todayKey(),
    suggestion: input.suggestion,
    plan: input.plan,
    settings: input.settings,
  };
  saveJson(LQ_KEYS.lastDateItineraryAi, record);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATE_ITINERARY_AI_SAVED_EVENT));
  }
  return record;
}

export function formatSavedItineraryDate(record: SavedDateItineraryAi): string {
  return formatDateShort(record.dateKey);
}

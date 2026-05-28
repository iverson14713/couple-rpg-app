import { parseAiRecordId } from '../lib/aiRecordIds';
import { hydrateDateItineraryPlan } from '../lib/dateItineraryAiModel';
import { AI_RECORD_HISTORY_CAP_PRO, dispatchAiRecordsChanged } from '../lib/aiRecordsConfig';
import {
  type SavedDateItineraryAi,
  loadLastDateItineraryAi,
} from './dateItineraryAiCache';
import {
  type SavedImportantDateAi,
  loadLastImportantDateAi,
} from './importantDateAiCache';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

function loadDateHistoryRaw(): SavedDateItineraryAi[] {
  const raw = loadJson<SavedDateItineraryAi[] | null>(LQ_KEYS.dateItineraryAiHistory, null);
  return Array.isArray(raw) ? raw : [];
}

function loadImportantHistoryRaw(): SavedImportantDateAi[] {
  const raw = loadJson<SavedImportantDateAi[] | null>(LQ_KEYS.importantDateAiHistory, null);
  return Array.isArray(raw) ? raw : [];
}

function isDateRecord(raw: unknown): raw is SavedDateItineraryAi {
  const r = raw as SavedDateItineraryAi | null | undefined;
  if (!r?.plan?.title || !r.suggestion?.title || !r.savedAt) return false;
  r.plan = hydrateDateItineraryPlan(r.plan);
  return true;
}

function isImportantRecord(raw: unknown): raw is SavedImportantDateAi {
  const r = raw as SavedImportantDateAi | null | undefined;
  return Boolean(r?.plan?.title && r.event?.displayTitle && r.savedAt);
}

/** Resolve favorited record body from local history (for cloud upload). */
export function findAiRecordPayloadById(recordId: string): Record<string, unknown> | null {
  const parsed = parseAiRecordId(recordId);
  if (!parsed) return null;

  if (parsed.kind === 'date_itinerary') {
    const fromHist = loadDateHistoryRaw().find((r) => r.savedAt === parsed.savedAt);
    if (fromHist) return fromHist as unknown as Record<string, unknown>;
    const last = loadLastDateItineraryAi();
    if (last?.savedAt === parsed.savedAt) return last as unknown as Record<string, unknown>;
    return null;
  }

  const fromHist = loadImportantHistoryRaw().find((r) => r.savedAt === parsed.savedAt);
  if (fromHist) return fromHist as unknown as Record<string, unknown>;
  const last = loadLastImportantDateAi();
  if (last?.savedAt === parsed.savedAt) return last as unknown as Record<string, unknown>;
  return null;
}

export function restoreDateItineraryAiFromPayload(payload: unknown): boolean {
  if (!isDateRecord(payload)) return false;
  const prev = loadDateHistoryRaw();
  const next = [payload, ...prev.filter((r) => r.savedAt !== payload.savedAt)].slice(
    0,
    AI_RECORD_HISTORY_CAP_PRO
  );
  saveJson(LQ_KEYS.dateItineraryAiHistory, next);
  return true;
}

export function restoreImportantDateAiFromPayload(payload: unknown): boolean {
  if (!isImportantRecord(payload)) return false;
  const prev = loadImportantHistoryRaw();
  const next = [payload, ...prev.filter((r) => r.savedAt !== payload.savedAt)].slice(
    0,
    AI_RECORD_HISTORY_CAP_PRO
  );
  saveJson(LQ_KEYS.importantDateAiHistory, next);
  return true;
}

export function restoreAiRecordFromPayload(recordId: string, payload: unknown): boolean {
  const parsed = parseAiRecordId(recordId);
  if (!parsed || payload == null) return false;
  if (parsed.kind === 'date_itinerary') return restoreDateItineraryAiFromPayload(payload);
  return restoreImportantDateAiFromPayload(payload);
}

export function restoreAiRecordsFromFavoriteRows(
  rows: { record_id: string; record_payload: unknown }[]
): number {
  let restored = 0;
  let missingPayload = 0;
  for (const row of rows) {
    if (row.record_payload == null) {
      missingPayload += 1;
      continue;
    }
    if (restoreAiRecordFromPayload(row.record_id, row.record_payload)) restored += 1;
  }
  if (missingPayload > 0) {
    console.warn(
      `[ai-favorites] ${missingPayload} cloud favorite(s) have no record_payload; re-favorite after app update to backfill`
    );
  }
  if (restored > 0) dispatchAiRecordsChanged();
  return restored;
}

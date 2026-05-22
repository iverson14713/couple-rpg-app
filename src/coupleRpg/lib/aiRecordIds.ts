import type { SavedDateItineraryAi } from '../storage/dateItineraryAiCache';
import type { SavedImportantDateAi } from '../storage/importantDateAiCache';

export type AiRecordKind = 'date_itinerary' | 'important_date';

export function dateItineraryRecordId(record: Pick<SavedDateItineraryAi, 'savedAt'>): string {
  return `date_itinerary:${record.savedAt}`;
}

export function importantDateRecordId(record: Pick<SavedImportantDateAi, 'savedAt'>): string {
  return `important_date:${record.savedAt}`;
}

export function parseAiRecordId(id: string): { kind: AiRecordKind; savedAt: string } | null {
  if (id.startsWith('date_itinerary:')) {
    return { kind: 'date_itinerary', savedAt: id.slice('date_itinerary:'.length) };
  }
  if (id.startsWith('important_date:')) {
    return { kind: 'important_date', savedAt: id.slice('important_date:'.length) };
  }
  return null;
}

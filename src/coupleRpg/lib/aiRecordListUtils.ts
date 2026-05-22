import { dateItineraryRecordId, importantDateRecordId } from './aiRecordIds';
import type { SavedDateItineraryAi } from '../storage/dateItineraryAiCache';
import type { SavedImportantDateAi } from '../storage/importantDateAiCache';

export type AiRecordSortMode = 'newest' | 'favorites_first';

export function sortDateItineraryRecords(
  records: SavedDateItineraryAi[],
  mode: AiRecordSortMode,
  isFavorite: (id: string) => boolean
): SavedDateItineraryAi[] {
  const sorted = [...records];
  sorted.sort((a, b) => compareBySortMode(a.savedAt, dateItineraryRecordId(a), b.savedAt, dateItineraryRecordId(b), mode, isFavorite));
  return sorted;
}

export function sortImportantDateRecords(
  records: SavedImportantDateAi[],
  mode: AiRecordSortMode,
  isFavorite: (id: string) => boolean
): SavedImportantDateAi[] {
  const sorted = [...records];
  sorted.sort((a, b) =>
    compareBySortMode(
      a.savedAt,
      importantDateRecordId(a),
      b.savedAt,
      importantDateRecordId(b),
      mode,
      isFavorite
    )
  );
  return sorted;
}

function compareBySortMode(
  savedAtA: string,
  idA: string,
  savedAtB: string,
  idB: string,
  mode: AiRecordSortMode,
  isFavorite: (id: string) => boolean
): number {
  if (mode === 'favorites_first') {
    const favA = isFavorite(idA);
    const favB = isFavorite(idB);
    if (favA !== favB) return favA ? -1 : 1;
  }
  return savedAtB.localeCompare(savedAtA);
}

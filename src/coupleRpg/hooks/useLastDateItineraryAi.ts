import { useCallback, useEffect, useState } from 'react';
import {
  DATE_ITINERARY_AI_SAVED_EVENT,
  loadLastDateItineraryAi,
  type SavedDateItineraryAi,
} from '../storage/dateItineraryAiCache';

export function useLastDateItineraryAi(): SavedDateItineraryAi | null {
  const [record, setRecord] = useState<SavedDateItineraryAi | null>(() => loadLastDateItineraryAi());

  const sync = useCallback(() => {
    setRecord(loadLastDateItineraryAi());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(DATE_ITINERARY_AI_SAVED_EVENT, sync);
    return () => window.removeEventListener(DATE_ITINERARY_AI_SAVED_EVENT, sync);
  }, [sync]);

  return record;
}

import { useCallback, useEffect, useState } from 'react';
import { AI_RECORDS_CHANGED_EVENT } from '../lib/aiRecordsConfig';
import { listDateItineraryAiRecords, type SavedDateItineraryAi } from '../storage/dateItineraryAiCache';
import {
  listImportantDateAiRecords,
  type SavedImportantDateAi,
} from '../storage/importantDateAiCache';
import { useUserPlan } from '../context/UserPlanContext';

export function useAiRecords() {
  const { isPro } = useUserPlan();
  const [dateRecords, setDateRecords] = useState<SavedDateItineraryAi[]>(() =>
    listDateItineraryAiRecords(isPro)
  );
  const [importantRecords, setImportantRecords] = useState<SavedImportantDateAi[]>(() =>
    listImportantDateAiRecords(isPro)
  );

  const sync = useCallback(() => {
    setDateRecords(listDateItineraryAiRecords(isPro));
    setImportantRecords(listImportantDateAiRecords(isPro));
  }, [isPro]);

  useEffect(() => {
    sync();
    window.addEventListener(AI_RECORDS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AI_RECORDS_CHANGED_EVENT, sync);
  }, [sync]);

  return { isPro, dateRecords, importantRecords, refresh: sync };
}

import { useCallback, useEffect, useState } from 'react';
import { AI_RECORDS_CHANGED_EVENT } from '../lib/aiRecordsConfig';
import {
  deleteDateItineraryAiRecord,
  listDateItineraryAiRecords,
  type SavedDateItineraryAi,
} from '../storage/dateItineraryAiCache';
import {
  deleteImportantDateAiRecord,
  listImportantDateAiRecords,
  type SavedImportantDateAi,
} from '../storage/importantDateAiCache';
import { AI_FAVORITES_CHANGED_EVENT } from '../storage/aiFavoritesStore';
import { maintainAllAiRecordsStorage } from '../storage/aiRecordMaintenance';
import { useUserPlan } from '../context/UserPlanContext';

export function useAiRecords() {
  const { isPro } = useUserPlan();
  const [dateRecords, setDateRecords] = useState<SavedDateItineraryAi[]>(() => {
    maintainAllAiRecordsStorage(isPro);
    return listDateItineraryAiRecords(isPro);
  });
  const [importantRecords, setImportantRecords] = useState<SavedImportantDateAi[]>(() => {
    return listImportantDateAiRecords(isPro);
  });

  const sync = useCallback(() => {
    maintainAllAiRecordsStorage(isPro);
    setDateRecords(listDateItineraryAiRecords(isPro));
    setImportantRecords(listImportantDateAiRecords(isPro));
  }, [isPro]);

  const removeDateRecord = useCallback(
    (record: SavedDateItineraryAi) => {
      deleteDateItineraryAiRecord(record, isPro);
      sync();
    },
    [isPro, sync]
  );

  const removeImportantRecord = useCallback(
    (record: SavedImportantDateAi) => {
      deleteImportantDateAiRecord(record, isPro);
      sync();
    },
    [isPro, sync]
  );

  useEffect(() => {
    sync();
    window.addEventListener(AI_RECORDS_CHANGED_EVENT, sync);
    window.addEventListener(AI_FAVORITES_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener(AI_RECORDS_CHANGED_EVENT, sync);
      window.removeEventListener(AI_FAVORITES_CHANGED_EVENT, sync);
    };
  }, [sync]);

  return {
    isPro,
    dateRecords,
    importantRecords,
    refresh: sync,
    removeDateRecord,
    removeImportantRecord,
  };
}

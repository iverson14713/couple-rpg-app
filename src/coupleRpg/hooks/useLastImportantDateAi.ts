import { useCallback, useEffect, useState } from 'react';
import { AI_RECORDS_CHANGED_EVENT } from '../lib/aiRecordsConfig';
import { loadLastImportantDateAi, type SavedImportantDateAi } from '../storage/importantDateAiCache';

export function useLastImportantDateAi(): SavedImportantDateAi | null {
  const [record, setRecord] = useState<SavedImportantDateAi | null>(() => loadLastImportantDateAi());

  const sync = useCallback(() => {
    setRecord(loadLastImportantDateAi());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(AI_RECORDS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AI_RECORDS_CHANGED_EVENT, sync);
  }, [sync]);

  return record;
}

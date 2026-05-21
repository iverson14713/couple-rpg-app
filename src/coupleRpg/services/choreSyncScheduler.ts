/**
 * Debounced chore items sync — local-first; today's assignment stays on device.
 */
import {
  ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC,
  ENABLE_CHORE_ITEMS_CLOUD_SYNC,
} from '../constants/choreSyncFlags';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canSyncChoreItems,
  preserveLocalHouseworkAssignment,
  pullChoresFromRemote,
  pullTodayChoreRecordsFromRemote,
  pushChoresToRemote,
  pushTodayChoreRecordsToRemote,
  type ChoreSyncStatus,
} from './choreSyncService';
import { ensureHouseworkStableIds } from '../storage/houseworkSyncMeta';
import type { HouseworkData } from '../storage/types';
import { loadHousework, saveHousework } from '../storage/houseworkStore';

const LOG = '[chore-sync-scheduler]';
const DEFAULT_DEBOUNCE_MS = 1500;

export type ChoreSyncUpdateMeta = {
  mode: 'full' | 'ids-only' | 'skip';
};

export type ChoreSyncCtx = {
  currentUserId: string | null;
  partnerUserId: string | null;
  myName: string;
  partnerName: string;
};

export type ChoreSyncSchedulerOptions = {
  debounceMs?: number;
  canSync: () => boolean;
  getSupabase: () => SupabaseClient | null;
  getCoupleId: () => string | null;
  getCtx: () => ChoreSyncCtx;
  onStatusChange: (status: ChoreSyncStatus, error: string | null) => void;
  onHouseworkUpdated: (data: HouseworkData, meta?: ChoreSyncUpdateMeta) => void;
};

export type ChoreSyncScheduler = {
  scheduleChoreSync: (reason?: string) => void;
  flushChoreSync: (options?: { allowPull?: boolean }) => Promise<void>;
  retryChoreSync: () => void;
  pullFromRemoteIfIdle: () => Promise<void>;
  hasPendingChanges: () => boolean;
  dispose: () => void;
};

const noopChoreScheduler: ChoreSyncScheduler = {
  scheduleChoreSync: () => {},
  flushChoreSync: async () => {},
  retryChoreSync: () => {},
  pullFromRemoteIfIdle: async () => {},
  hasPendingChanges: () => false,
  dispose: () => {},
};

export function createChoreSyncScheduler(options: ChoreSyncSchedulerOptions): ChoreSyncScheduler {
  if (!ENABLE_CHORE_ITEMS_CLOUD_SYNC) {
    options.onStatusChange('local', null);
    return noopChoreScheduler;
  }

  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let syncInProgress = false;
  let hasPendingChanges = false;
  let pendingSyncAfterCurrent = false;
  let choreSyncScheduled = false;

  const setStatus = (status: ChoreSyncStatus, error: string | null = null) => {
    options.onStatusChange(status, error);
  };

  const clearDebounce = () => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    choreSyncScheduled = false;
  };

  const runItemsSync = async (): Promise<void> => {
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    const ctx = options.getCtx();
    if (!options.canSync() || !supabase || !coupleId) {
      setStatus('local', null);
      return;
    }

    syncInProgress = true;
    setStatus('syncing', null);

    try {
      const uiSnapshot = loadHousework();
      let data = ensureHouseworkStableIds(loadHousework());

      await pushChoresToRemote(supabase, coupleId, data, ctx.currentUserId);
      data = await pullChoresFromRemote(supabase, coupleId, data);

      if (ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC) {
        data = await pushTodayChoreRecordsToRemote(supabase, coupleId, data, ctx);
        data = await pullTodayChoreRecordsFromRemote(supabase, coupleId, data);
      }

      data = preserveLocalHouseworkAssignment(data, uiSnapshot);
      saveHousework(data);
      options.onHouseworkUpdated(data);
      hasPendingChanges = false;
      setStatus('synced', null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`${LOG} sync failed:`, msg);
      hasPendingChanges = true;
      setStatus('error', '同步失敗，稍後再試');
    } finally {
      syncInProgress = false;
      if (pendingSyncAfterCurrent || hasPendingChanges) {
        pendingSyncAfterCurrent = false;
        scheduleChoreSync('after-current');
      }
    }
  };

  const scheduleChoreSync = (reason?: string) => {
    void reason;
    if (!options.canSync()) {
      clearDebounce();
      setStatus('local', null);
      return;
    }

    hasPendingChanges = true;
    setStatus('editing', null);

    if (syncInProgress) {
      pendingSyncAfterCurrent = true;
      return;
    }

    choreSyncScheduled = true;
    clearDebounce();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      choreSyncScheduled = false;
      if (syncInProgress) {
        pendingSyncAfterCurrent = true;
        return;
      }
      void runItemsSync();
    }, debounceMs);
  };

  const flushChoreSync = async (_opts?: { allowPull?: boolean }) => {
    clearDebounce();
    if (syncInProgress) {
      pendingSyncAfterCurrent = true;
      return;
    }
    await runItemsSync();
  };

  const retryChoreSync = () => {
    hasPendingChanges = true;
    void flushChoreSync();
  };

  const pullFromRemoteIfIdle = async (opts?: { force?: boolean }) => {
    if (!opts?.force && (hasPendingChanges || syncInProgress || choreSyncScheduled)) {
      return;
    }

    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    if (!options.canSync() || !supabase || !coupleId) {
      setStatus('local', null);
      return;
    }

    setStatus('syncing', null);
    try {
      const uiSnapshot = loadHousework();
      let cur = await pullChoresFromRemote(supabase, coupleId, uiSnapshot);
      if (ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC) {
        cur = await pullTodayChoreRecordsFromRemote(supabase, coupleId, cur);
      } else {
        cur = preserveLocalHouseworkAssignment(cur, uiSnapshot);
      }
      saveHousework(cur);
      options.onHouseworkUpdated(cur);
      setStatus('synced', null);
    } catch (e) {
      console.warn(`${LOG} pull failed:`, e);
      setStatus('error', '同步失敗，稍後再試');
    }
  };

  return {
    scheduleChoreSync,
    flushChoreSync,
    retryChoreSync,
    pullFromRemoteIfIdle,
    hasPendingChanges: () => hasPendingChanges,
    dispose: () => {
      clearDebounce();
      pendingSyncAfterCurrent = false;
    },
  };
}

export { canSyncChoreItems };

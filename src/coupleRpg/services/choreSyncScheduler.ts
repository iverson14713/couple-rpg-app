/**
 * Debounced, queued chore sync — local-first, single-flight, no stale overwrites.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canSyncChores,
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
  onHouseworkUpdated: (data: HouseworkData) => void;
};

export type ChoreSyncScheduler = {
  scheduleChoreSync: (reason?: string) => void;
  flushChoreSync: () => Promise<void>;
  retryChoreSync: () => void;
  pullFromRemoteIfIdle: () => Promise<void>;
  hasPendingChanges: () => boolean;
  dispose: () => void;
};

export function createChoreSyncScheduler(options: ChoreSyncSchedulerOptions): ChoreSyncScheduler {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let syncInProgress = false;
  let hasPendingChanges = false;
  let pendingSyncAfterCurrent = false;
  let choreSyncScheduled = false;
  let lastSyncedAt: string | null = null;

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

  const runFullSync = async (): Promise<void> => {
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    if (!options.canSync() || !supabase || !coupleId) {
      setStatus('local', null);
      return;
    }

    syncInProgress = true;
    setStatus('syncing', null);

    try {
      let data = ensureHouseworkStableIds(loadHousework());
      const ctx = options.getCtx();

      data = await pushChoresToRemote(supabase, coupleId, data, ctx.currentUserId);
      data = await pushTodayChoreRecordsToRemote(supabase, coupleId, data, ctx);
      data = await pullChoresFromRemote(supabase, coupleId, data);
      data = await pullTodayChoreRecordsFromRemote(supabase, coupleId, data);

      saveHousework(data);
      options.onHouseworkUpdated(data);
      lastSyncedAt = new Date().toISOString();
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
        hasPendingChanges = true;
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

    if (syncInProgress) {
      pendingSyncAfterCurrent = true;
      setStatus('editing', null);
      return;
    }

    setStatus('editing', null);
    choreSyncScheduled = true;

    clearDebounce();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      choreSyncScheduled = false;
      if (syncInProgress) {
        pendingSyncAfterCurrent = true;
        return;
      }
      void runFullSync();
    }, debounceMs);
  };

  const flushChoreSync = async () => {
    clearDebounce();
    if (syncInProgress) {
      pendingSyncAfterCurrent = true;
      return;
    }
    await runFullSync();
  };

  const retryChoreSync = () => {
    hasPendingChanges = true;
    void flushChoreSync();
  };

  const pullFromRemoteIfIdle = async () => {
    if (hasPendingChanges || syncInProgress || choreSyncScheduled) {
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
      let cur = loadHousework();
      cur = await pullChoresFromRemote(supabase, coupleId, cur);
      cur = await pullTodayChoreRecordsFromRemote(supabase, coupleId, cur);
      saveHousework(cur);
      options.onHouseworkUpdated(cur);
      lastSyncedAt = new Date().toISOString();
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

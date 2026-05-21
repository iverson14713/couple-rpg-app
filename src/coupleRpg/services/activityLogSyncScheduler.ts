/**
 * Debounced activity log sync — push local entries, then pull partner updates.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canSyncActivityLogs,
  pullActivityLogsFromRemote,
  pushPendingActivityLogs,
  type ActivityLogSyncStatus,
} from './activityLogSyncService';

const LOG = '[activity-log-sync-scheduler]';
const DEFAULT_DEBOUNCE_MS = 800;
const POLL_MS = 25_000;

export type ActivityLogSyncSchedulerOptions = {
  debounceMs?: number;
  pollMs?: number;
  canSync: () => boolean;
  getSupabase: () => SupabaseClient | null;
  getCoupleId: () => string | null;
  getIsPro: () => boolean;
  onStatusChange: (status: ActivityLogSyncStatus, error: string | null) => void;
};

export type ActivityLogSyncScheduler = {
  scheduleActivityLogSync: (reason?: string) => void;
  pullFromRemoteIfIdle: () => Promise<void>;
  retryActivityLogSync: () => void;
  dispose: () => void;
};

export function createActivityLogSyncScheduler(
  options: ActivityLogSyncSchedulerOptions
): ActivityLogSyncScheduler {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const pollMs = options.pollMs ?? POLL_MS;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let syncInProgress = false;
  let hasPendingChanges = false;
  let pendingSyncAfterCurrent = false;

  const setStatus = (status: ActivityLogSyncStatus, error: string | null = null) => {
    options.onStatusChange(status, error);
  };

  const clearDebounce = () => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const runSync = async (): Promise<void> => {
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    if (!options.canSync() || !supabase || !coupleId) {
      setStatus('local', null);
      return;
    }

    syncInProgress = true;
    setStatus('syncing', null);

    try {
      await pushPendingActivityLogs(supabase, coupleId, options.getIsPro());
      await pullActivityLogsFromRemote(supabase, coupleId, options.getIsPro());
      hasPendingChanges = false;
      setStatus('synced', null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`${LOG} sync failed:`, msg);
      hasPendingChanges = true;
      setStatus('error', '動態同步失敗，稍後再試');
    } finally {
      syncInProgress = false;
      if (pendingSyncAfterCurrent || hasPendingChanges) {
        pendingSyncAfterCurrent = false;
        scheduleActivityLogSync('after-current');
      }
    }
  };

  const scheduleActivityLogSync = (reason?: string) => {
    void reason;
    if (!options.canSync()) {
      clearDebounce();
      setStatus('local', null);
      return;
    }

    hasPendingChanges = true;

    if (syncInProgress) {
      pendingSyncAfterCurrent = true;
      return;
    }

    clearDebounce();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (syncInProgress) {
        pendingSyncAfterCurrent = true;
        return;
      }
      void runSync();
    }, debounceMs);
  };

  const pullFromRemoteIfIdle = async () => {
    if (hasPendingChanges || syncInProgress || debounceTimer != null) return;

    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    if (!options.canSync() || !supabase || !coupleId) {
      setStatus('local', null);
      return;
    }

    setStatus('syncing', null);
    try {
      await pullActivityLogsFromRemote(supabase, coupleId, options.getIsPro());
      setStatus('synced', null);
    } catch (e) {
      console.warn(`${LOG} pull failed:`, e);
      setStatus('error', '動態同步失敗，稍後再試');
    }
  };

  const retryActivityLogSync = () => {
    hasPendingChanges = true;
    clearDebounce();
    void runSync();
  };

  if (typeof window !== 'undefined') {
    pollTimer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void pullFromRemoteIfIdle();
    }, pollMs);
  }

  return {
    scheduleActivityLogSync,
    pullFromRemoteIfIdle,
    retryActivityLogSync,
    dispose: () => {
      clearDebounce();
      if (pollTimer != null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      pendingSyncAfterCurrent = false;
    },
  };
}

export { canSyncActivityLogs };

/**
 * Debounced AI favorites sync — push pending ops, merge with remote.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canSyncAiFavorites,
  pullAiFavoritesFromRemote,
  syncAiFavoritesWithRemote,
  type AiFavoritesSyncStatus,
} from './aiFavoritesSyncService';
import { getAiFavoritesSyncErrorInfo } from './aiFavoritesSyncErrors';

const LOG = '[ai-favorites-sync-scheduler]';
const DEFAULT_DEBOUNCE_MS = 400;
const RETRY_AFTER_ERROR_MS = 30_000;

export type AiFavoritesSyncSchedulerOptions = {
  debounceMs?: number;
  canSync: () => boolean;
  getSupabase: () => SupabaseClient | null;
  getUserId: () => string | null;
  onStatusChange: (status: AiFavoritesSyncStatus, error: string | null) => void;
};

export type AiFavoritesSyncScheduler = {
  scheduleAiFavoritesSync: (reason?: string) => void;
  pullFromRemote: () => Promise<void>;
  retrySync: () => void;
  dispose: () => void;
};

export function createAiFavoritesSyncScheduler(
  options: AiFavoritesSyncSchedulerOptions
): AiFavoritesSyncScheduler {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let syncInProgress = false;
  let hasPendingChanges = false;
  let pendingSyncAfterCurrent = false;
  let lastErrorPermanent = false;

  const setStatus = (status: AiFavoritesSyncStatus, error: string | null = null) => {
    options.onStatusChange(status, error);
  };

  const clearDebounce = () => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const clearRetryTimer = () => {
    if (retryTimer != null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  const scheduleRetryAfterError = () => {
    if (lastErrorPermanent) return;
    clearRetryTimer();
    retryTimer = setTimeout(() => {
      retryTimer = null;
      if (hasPendingChanges && !syncInProgress) {
        scheduleAiFavoritesSync('retry-backoff');
      }
    }, RETRY_AFTER_ERROR_MS);
  };

  const runSync = async (): Promise<void> => {
    const supabase = options.getSupabase();
    const userId = options.getUserId();
    if (!options.canSync() || !supabase || !userId) {
      setStatus('local', null);
      return;
    }

    syncInProgress = true;
    lastErrorPermanent = false;
    setStatus('syncing', null);

    let shouldReschedule = false;

    try {
      await syncAiFavoritesWithRemote(supabase, userId);
      hasPendingChanges = false;
      clearRetryTimer();
      setStatus('synced', null);
    } catch (e) {
      const info = getAiFavoritesSyncErrorInfo(e);
      lastErrorPermanent = info.permanent;
      console.warn(`${LOG} sync failed:`, info.message, info.code ?? '');
      hasPendingChanges = !info.permanent;
      shouldReschedule = !info.permanent && (pendingSyncAfterCurrent || hasPendingChanges);
      setStatus('error', info.userMessage);
      if (!info.permanent) scheduleRetryAfterError();
    } finally {
      syncInProgress = false;
      if (shouldReschedule) {
        pendingSyncAfterCurrent = false;
        scheduleAiFavoritesSync('after-current');
      } else {
        pendingSyncAfterCurrent = false;
      }
    }
  };

  const scheduleAiFavoritesSync = (reason?: string) => {
    void reason;
    if (!options.canSync()) {
      clearDebounce();
      setStatus('local', null);
      return;
    }

    if (lastErrorPermanent) return;

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

  const pullFromRemote = async () => {
    const supabase = options.getSupabase();
    const userId = options.getUserId();
    if (!options.canSync() || !supabase || !userId) {
      setStatus('local', null);
      return;
    }

    setStatus('loading', null);
    try {
      await pullAiFavoritesFromRemote(supabase, userId);
      lastErrorPermanent = false;
      hasPendingChanges = false;
      clearRetryTimer();
      setStatus('synced', null);
    } catch (e) {
      const info = getAiFavoritesSyncErrorInfo(e);
      lastErrorPermanent = info.permanent;
      console.warn(`${LOG} pull failed:`, info.message, info.code ?? '');
      setStatus('error', info.userMessage);
    }
  };

  const retrySync = () => {
    lastErrorPermanent = false;
    hasPendingChanges = true;
    clearDebounce();
    clearRetryTimer();
    void runSync();
  };

  return {
    scheduleAiFavoritesSync,
    pullFromRemote,
    retrySync,
    dispose: () => {
      clearDebounce();
      clearRetryTimer();
      pendingSyncAfterCurrent = false;
      lastErrorPermanent = false;
    },
  };
}

export { canSyncAiFavorites };

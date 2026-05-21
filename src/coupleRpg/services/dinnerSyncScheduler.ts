/**
 * Debounced dinner options sync — local-first; today's result stays on device.
 */
import { ENABLE_DINNER_DECISION_CLOUD_SYNC } from '../constants/dinnerSyncFlags';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canSyncDinnerOptions,
  pullFoodOptionsFromRemote,
  pullTodayFoodDecisionFromRemote,
  pushFoodOptionsToRemote,
  pushTodayFoodDecisionToRemote,
  type DinnerSyncStatus,
} from './dinnerSyncService';
import { ensureDinnerStableIds } from '../storage/dinnerSyncMeta';
import type { DinnerData } from '../storage/types';
import { loadDinner, saveDinner } from '../storage/dinnerStore';

const LOG = '[dinner-sync-scheduler]';
const DEFAULT_DEBOUNCE_MS = 1500;

export type DinnerSyncSchedulerOptions = {
  debounceMs?: number;
  canSync: () => boolean;
  getSupabase: () => SupabaseClient | null;
  getCoupleId: () => string | null;
  getUserId: () => string | null;
  onStatusChange: (status: DinnerSyncStatus, error: string | null) => void;
  onDinnerUpdated: (data: DinnerData) => void;
};

export type DinnerSyncScheduler = {
  scheduleDinnerSync: (reason?: string) => void;
  flushDinnerSync: () => Promise<void>;
  retryDinnerSync: () => void;
  pullFromRemoteIfIdle: () => Promise<void>;
  hasPendingChanges: () => boolean;
  dispose: () => void;
};

function preserveLocalHistory(incoming: DinnerData, localHistory: DinnerData['history']): DinnerData {
  if (ENABLE_DINNER_DECISION_CLOUD_SYNC) return incoming;
  return { ...incoming, history: localHistory };
}

export function createDinnerSyncScheduler(options: DinnerSyncSchedulerOptions): DinnerSyncScheduler {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let syncInProgress = false;
  let hasPendingChanges = false;
  let pendingSyncAfterCurrent = false;
  let dinnerSyncScheduled = false;

  const setStatus = (status: DinnerSyncStatus, error: string | null = null) => {
    options.onStatusChange(status, error);
  };

  const clearDebounce = () => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    dinnerSyncScheduled = false;
  };

  const runOptionsSync = async (): Promise<void> => {
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    const userId = options.getUserId();
    if (!options.canSync() || !supabase || !coupleId) {
      setStatus('local', null);
      return;
    }

    syncInProgress = true;
    setStatus('syncing', null);

    try {
      let data = ensureDinnerStableIds(loadDinner());
      const localHistory = data.history;

      await pushFoodOptionsToRemote(supabase, coupleId, data, userId);
      data = await pullFoodOptionsFromRemote(supabase, coupleId, data);

      if (ENABLE_DINNER_DECISION_CLOUD_SYNC) {
        await pushTodayFoodDecisionToRemote(supabase, coupleId, data);
        data = await pullTodayFoodDecisionFromRemote(supabase, coupleId, data);
      }

      data = preserveLocalHistory(data, localHistory);
      saveDinner(data);
      options.onDinnerUpdated(data);
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
        scheduleDinnerSync('after-current');
      }
    }
  };

  const scheduleDinnerSync = (reason?: string) => {
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
    dinnerSyncScheduled = true;
    clearDebounce();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      dinnerSyncScheduled = false;
      if (syncInProgress) {
        pendingSyncAfterCurrent = true;
        return;
      }
      void runOptionsSync();
    }, debounceMs);
  };

  const flushDinnerSync = async () => {
    clearDebounce();
    if (syncInProgress) {
      pendingSyncAfterCurrent = true;
      return;
    }
    await runOptionsSync();
  };

  const retryDinnerSync = () => {
    hasPendingChanges = true;
    void flushDinnerSync();
  };

  const pullFromRemoteIfIdle = async () => {
    if (hasPendingChanges || syncInProgress || dinnerSyncScheduled) {
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
      let cur = loadDinner();
      const localHistory = cur.history;
      cur = await pullFoodOptionsFromRemote(supabase, coupleId, cur);
      if (ENABLE_DINNER_DECISION_CLOUD_SYNC) {
        cur = await pullTodayFoodDecisionFromRemote(supabase, coupleId, cur);
      } else {
        cur = preserveLocalHistory(cur, localHistory);
      }
      saveDinner(cur);
      options.onDinnerUpdated(cur);
      setStatus('synced', null);
    } catch (e) {
      console.warn(`${LOG} pull failed:`, e);
      setStatus('error', '同步失敗，稍後再試');
    }
  };

  return {
    scheduleDinnerSync,
    flushDinnerSync,
    retryDinnerSync,
    pullFromRemoteIfIdle,
    hasPendingChanges: () => hasPendingChanges,
    dispose: () => {
      clearDebounce();
      pendingSyncAfterCurrent = false;
    },
  };
}

export { canSyncDinnerOptions };

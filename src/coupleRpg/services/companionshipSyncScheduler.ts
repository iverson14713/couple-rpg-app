import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canSyncCompanionship,
  pullCompanionshipEventsFromRemote,
  syncCompanionshipEvents,
} from './companionshipSyncService';

const LOG = '[companionship-sync-scheduler]';
const DEFAULT_DEBOUNCE_MS = 600;
const POLL_MS = 20_000;

export type CompanionshipSyncSchedulerOptions = {
  debounceMs?: number;
  pollMs?: number;
  canSync: () => boolean;
  getSupabase: () => SupabaseClient | null;
  getCoupleId: () => string | null;
  getUserId: () => string | null;
};

export type CompanionshipSyncScheduler = {
  scheduleCompanionshipSync: (reason?: string) => void;
  pullFromRemoteIfIdle: () => Promise<void>;
  dispose: () => void;
};

export function createCompanionshipSyncScheduler(
  options: CompanionshipSyncSchedulerOptions
): CompanionshipSyncScheduler {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const pollMs = options.pollMs ?? POLL_MS;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let syncInProgress = false;
  let hasPending = false;

  const clearDebounce = () => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const runSync = async () => {
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    const userId = options.getUserId();
    if (!options.canSync() || !supabase || !coupleId || !userId) return;

    syncInProgress = true;
    try {
      await syncCompanionshipEvents(supabase, coupleId, userId);
      hasPending = false;
    } catch (e) {
      hasPending = true;
      console.warn(`${LOG} sync failed:`, e);
    } finally {
      syncInProgress = false;
    }
  };

  const scheduleCompanionshipSync = () => {
    if (!options.canSync()) {
      clearDebounce();
      return;
    }
    hasPending = true;
    if (syncInProgress) return;
    clearDebounce();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void runSync();
    }, debounceMs);
  };

  const pullFromRemoteIfIdle = async () => {
    if (hasPending || syncInProgress || debounceTimer != null) return;
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    if (!options.canSync() || !supabase || !coupleId) return;
    try {
      await pullCompanionshipEventsFromRemote(supabase, coupleId);
    } catch (e) {
      console.warn(`${LOG} pull failed:`, e);
    }
  };

  if (typeof window !== 'undefined') {
    pollTimer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void pullFromRemoteIfIdle();
    }, pollMs);
  }

  return {
    scheduleCompanionshipSync,
    pullFromRemoteIfIdle,
    dispose: () => {
      clearDebounce();
      if (pollTimer != null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },
  };
}

export { canSyncCompanionship };

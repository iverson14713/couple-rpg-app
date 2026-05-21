/**
 * Debounced, queued chore sync — local-first, background push, conservative pull.
 */
import { ENABLE_CHORE_CLOUD_SYNC } from '../constants/choreSyncFlags';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canSyncChores,
  mergeHouseworkDataSafe,
  mergeHouseworkRemoteIdsOnly,
  pullChoresFromRemote,
  pullTodayChoreRecordsFromRemote,
  pushChoresToRemote,
  pushTodayChoreRecordsToRemote,
  type ChoreSyncStatus,
} from './choreSyncService';
import {
  clearHouseworkLocalDirty,
  getHouseworkLastLocalChangeAt,
  hasHouseworkLocalDirty,
  isHouseworkUserEditing,
  markHouseworkLocalDirty,
} from '../storage/houseworkSyncGuard';
import { ensureHouseworkStableIds } from '../storage/houseworkSyncMeta';
import type { HouseworkData } from '../storage/types';
import { loadHousework, saveHousework } from '../storage/houseworkStore';

const LOG = '[chore-sync-scheduler]';
const DEFAULT_DEBOUNCE_MS = 1500;
const USER_EDITING_WINDOW_MS = 2500;

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
  pullFromRemoteIfIdle: (options?: { force?: boolean }) => Promise<void>;
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
  if (!ENABLE_CHORE_CLOUD_SYNC) {
    options.onStatusChange('local', null);
    return noopChoreScheduler;
  }

  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let syncInProgress = false;
  let hasPendingChanges = false;
  let pendingSyncAfterCurrent = false;
  let choreSyncScheduled = false;
  let postEditPullTimer: ReturnType<typeof setTimeout> | null = null;

  const setStatus = (status: ChoreSyncStatus, error: string | null = null) => {
    options.onStatusChange(status, error);
  };

  const displayStatus = (): ChoreSyncStatus => {
    if (isHouseworkUserEditing() || hasHouseworkLocalDirty()) return 'editing';
    if (syncInProgress) return 'syncing';
    return 'synced';
  };

  const clearDebounce = () => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    choreSyncScheduled = false;
  };

  const schedulePostEditPull = () => {
    if (postEditPullTimer != null) clearTimeout(postEditPullTimer);
    const elapsed = Date.now() - getHouseworkLastLocalChangeAt();
    const delay = Math.max(80, USER_EDITING_WINDOW_MS - elapsed + 80);
    postEditPullTimer = setTimeout(() => {
      postEditPullTimer = null;
      if (syncInProgress || choreSyncScheduled) return;
      if (isHouseworkUserEditing()) {
        schedulePostEditPull();
        return;
      }
      if (!hasHouseworkLocalDirty() && !hasPendingChanges) return;
      void runBackgroundSync(true);
    }, delay);
  };

  const shouldSkipUiUpdate = (startRevision: number): boolean => {
    const fresh = loadHousework();
    const editedDuringSync = (fresh.syncRevision ?? 0) > startRevision;
    return editedDuringSync || isHouseworkUserEditing() || hasHouseworkLocalDirty();
  };

  const runPushOnly = async (): Promise<void> => {
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    if (!supabase || !coupleId) return;

    const uiSnapshot = loadHousework();
    const startRevision = uiSnapshot.syncRevision ?? 0;
    const ctx = options.getCtx();

    let data = ensureHouseworkStableIds(loadHousework());
    data = await pushChoresToRemote(supabase, coupleId, data, ctx.currentUserId);
    data = await pushTodayChoreRecordsToRemote(supabase, coupleId, data, ctx);
    saveHousework(data);

    if (shouldSkipUiUpdate(startRevision)) {
      hasPendingChanges = true;
      setStatus('editing', null);
      return;
    }

    options.onHouseworkUpdated(mergeHouseworkRemoteIdsOnly(uiSnapshot, data), { mode: 'ids-only' });
  };

  const runPullMerge = async (preferLocal: boolean): Promise<HouseworkData> => {
    const supabase = options.getSupabase()!;
    const coupleId = options.getCoupleId()!;
    const uiSnapshot = loadHousework();

    let pulled = uiSnapshot;
    pulled = await pullChoresFromRemote(supabase, coupleId, pulled);
    pulled = await pullTodayChoreRecordsFromRemote(supabase, coupleId, pulled, undefined, {
      preferLocal,
    });

    const merged = mergeHouseworkDataSafe(uiSnapshot, pulled, { preferLocal });
    saveHousework(merged);
    return merged;
  };

  const runBackgroundSync = async (allowPull: boolean): Promise<void> => {
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    if (!options.canSync() || !supabase || !coupleId) {
      setStatus('local', null);
      return;
    }

    syncInProgress = true;
    setStatus(displayStatus(), null);

    try {
      await runPushOnly();

      const canPull =
        allowPull && !hasHouseworkLocalDirty() && !isHouseworkUserEditing() && !hasPendingChanges;

      if (canPull) {
        const uiSnapshot = loadHousework();
        const startRevision = uiSnapshot.syncRevision ?? 0;
        if (!shouldSkipUiUpdate(startRevision)) {
          const merged = await runPullMerge(false);
          options.onHouseworkUpdated(merged, { mode: 'full' });
          clearHouseworkLocalDirty();
          hasPendingChanges = false;
          setStatus('synced', null);
          return;
        }
      }

      if (hasHouseworkLocalDirty() || isHouseworkUserEditing()) {
        hasPendingChanges = true;
        setStatus('editing', null);
        schedulePostEditPull();
      } else {
        clearHouseworkLocalDirty();
        hasPendingChanges = false;
        setStatus('synced', null);
      }
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
    markHouseworkLocalDirty();

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
      void runBackgroundSync(false);
    }, debounceMs);
  };

  const flushChoreSync = async (opts?: { allowPull?: boolean }) => {
    clearDebounce();
    if (syncInProgress) {
      pendingSyncAfterCurrent = true;
      return;
    }
    await runBackgroundSync(opts?.allowPull ?? true);
  };

  const retryChoreSync = () => {
    hasPendingChanges = true;
    void flushChoreSync({ allowPull: true });
  };

  const pullFromRemoteIfIdle = async (opts?: { force?: boolean }) => {
    if (!opts?.force && (hasPendingChanges || syncInProgress || choreSyncScheduled)) {
      return;
    }
    if (isHouseworkUserEditing() || hasHouseworkLocalDirty()) {
      return;
    }

    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    if (!options.canSync() || !supabase || !coupleId) {
      setStatus('local', null);
      return;
    }

    syncInProgress = true;
    setStatus('syncing', null);

    try {
      const uiSnapshot = loadHousework();
      const merged = await runPullMerge(hasHouseworkLocalDirty());
      options.onHouseworkUpdated(mergeHouseworkDataSafe(uiSnapshot, merged, { preferLocal: false }), {
        mode: 'full',
      });
      clearHouseworkLocalDirty();
      hasPendingChanges = false;
      setStatus('synced', null);
    } catch (e) {
      console.warn(`${LOG} pull failed:`, e);
      setStatus('error', '同步失敗，稍後再試');
    } finally {
      syncInProgress = false;
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
      if (postEditPullTimer != null) clearTimeout(postEditPullTimer);
      postEditPullTimer = null;
      pendingSyncAfterCurrent = false;
    },
  };
}

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canSyncCoinWallet,
  growthSnapshotToRpgFields,
  migrateLocalGrowthIfNeeded,
  pullGrowthFromRemote,
  pushPendingGrowthTransactions,
  type CoinWalletSyncStatus,
  type GrowthSnapshot,
} from './coinWalletSyncService';
import { markWalletHydrated } from './walletHydrationGuard';
import type { RpgState } from '../storage/types';

const LOG = '[growth-sync-scheduler]';
const DEBOUNCE_MS = 600;
const POLL_MS = 20_000;

export type CoinWalletSyncSchedulerOptions = {
  canSync: () => boolean;
  getSupabase: () => SupabaseClient | null;
  getCoupleId: () => string | null;
  getUserId: () => string | null;
  getLocalRpg: () => Pick<RpgState, 'loveCoins' | 'heartPoints' | 'compatibility' | 'xp'>;
  onGrowthApplied: (snapshot: GrowthSnapshot) => void;
  onStatusChange: (status: CoinWalletSyncStatus, error: string | null) => void;
};

export type CoinWalletSyncScheduler = {
  /** Debounced pull-only sync (no migrate / no push). */
  schedulePull: () => void;
  /** @deprecated use schedulePull */
  scheduleSync: () => void;
  pullFromRemoteIfIdle: () => Promise<void>;
  /** Push deferred txs after explicit user wallet action (guarded). */
  flushPendingAfterUserAction: () => Promise<void>;
  dispose: () => void;
};

export function createCoinWalletSyncScheduler(
  options: CoinWalletSyncSchedulerOptions
): CoinWalletSyncScheduler {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let syncInProgress = false;
  let pendingAfter = false;

  const setStatus = (s: CoinWalletSyncStatus, err: string | null = null) => {
    options.onStatusChange(s, err);
  };

  /** Pull remote only — never migrate or push during hydrate / background refresh. */
  const runPullOnly = async (): Promise<void> => {
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    const userId = options.getUserId();
    if (!options.canSync() || !supabase || !coupleId || !userId) {
      setStatus('local', null);
      return;
    }

    syncInProgress = true;
    setStatus('syncing', null);

    try {
      console.log(`${LOG} pull start`, { userId, coupleId });
      const pulled = await pullGrowthFromRemote(supabase, userId, coupleId);
      options.onGrowthApplied(pulled.snapshot);
      markWalletHydrated();
      console.log(`${LOG} pull done`, {
        userId,
        coupleId,
        loveCoins: pulled.snapshot.loveCoinBalance,
        exp: pulled.snapshot.exp,
        txCount: pulled.transactions.length,
      });
      setStatus('synced', null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`${LOG} pull failed:`, msg);
      setStatus('error', '成長數值同步失敗，稍後再試');
    } finally {
      syncInProgress = false;
      if (pendingAfter) {
        pendingAfter = false;
        void runPullOnly();
      }
    }
  };

  const runPushAndPull = async (): Promise<void> => {
    const supabase = options.getSupabase();
    const coupleId = options.getCoupleId();
    const userId = options.getUserId();
    if (!options.canSync() || !supabase || !coupleId || !userId) return;

    syncInProgress = true;
    setStatus('syncing', null);
    try {
      const local = options.getLocalRpg();
      await migrateLocalGrowthIfNeeded(supabase, coupleId, userId, local);
      await pushPendingGrowthTransactions(supabase, coupleId, userId);
      const pulled = await pullGrowthFromRemote(supabase, userId, coupleId);
      options.onGrowthApplied(pulled.snapshot);
      markWalletHydrated();
      setStatus('synced', null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`${LOG} push+pull failed:`, msg);
      setStatus('error', '成長數值同步失敗，稍後再試');
    } finally {
      syncInProgress = false;
    }
  };

  const schedulePull = () => {
    if (syncInProgress) {
      pendingAfter = true;
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void runPullOnly();
    }, DEBOUNCE_MS);
  };

  const pullFromRemoteIfIdle = async () => {
    if (syncInProgress) return;
    await runPullOnly();
  };

  const flushPendingAfterUserAction = async () => {
    if (syncInProgress) return;
    await runPushAndPull();
  };

  pollTimer = setInterval(() => {
    if (options.canSync()) schedulePull();
  }, POLL_MS);

  if (options.canSync()) {
    setTimeout(() => schedulePull(), 100);
  }

  return {
    schedulePull,
    scheduleSync: schedulePull,
    pullFromRemoteIfIdle,
    flushPendingAfterUserAction,
    dispose: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pollTimer) clearInterval(pollTimer);
    },
  };
}

export { canSyncCoinWallet, growthSnapshotToRpgFields };

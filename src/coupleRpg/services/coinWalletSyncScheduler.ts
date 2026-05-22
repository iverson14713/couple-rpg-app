import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canSyncCoinWallet,
  migrateLocalLoveCoinsIfNeeded,
  pullCoinWalletFromRemote,
  pushPendingCoinTransactions,
  type CoinWalletSyncStatus,
} from './coinWalletSyncService';

const LOG = '[coin-wallet-scheduler]';
const DEBOUNCE_MS = 600;
const POLL_MS = 20_000;

export type CoinWalletSyncSchedulerOptions = {
  canSync: () => boolean;
  getSupabase: () => SupabaseClient | null;
  getCoupleId: () => string | null;
  getUserId: () => string | null;
  getLocalRpgBalance: () => number;
  onBalanceApplied: (balance: number) => void;
  onStatusChange: (status: CoinWalletSyncStatus, error: string | null) => void;
};

export type CoinWalletSyncScheduler = {
  scheduleSync: (reason?: string) => void;
  pullFromRemoteIfIdle: () => Promise<void>;
  flushPending: () => Promise<void>;
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

  const runSync = async (): Promise<void> => {
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
      await migrateLocalLoveCoinsIfNeeded(
        supabase,
        coupleId,
        userId,
        options.getLocalRpgBalance()
      );
      await pushPendingCoinTransactions(supabase, coupleId, userId);
      const { balance } = await pullCoinWalletFromRemote(supabase, coupleId);
      options.onBalanceApplied(balance);
      setStatus('synced', null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`${LOG} sync failed:`, msg);
      setStatus('error', 'LoveCoin 同步失敗，稍後再試');
    } finally {
      syncInProgress = false;
      if (pendingAfter) {
        pendingAfter = false;
        void runSync();
      }
    }
  };

  const scheduleSync = () => {
    if (syncInProgress) {
      pendingAfter = true;
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void runSync();
    }, DEBOUNCE_MS);
  };

  const pullFromRemoteIfIdle = async () => {
    if (syncInProgress) return;
    await runSync();
  };

  const flushPending = async () => {
    scheduleSync();
  };

  pollTimer = setInterval(() => {
    if (options.canSync()) scheduleSync();
  }, POLL_MS);

  if (options.canSync()) {
    setTimeout(() => scheduleSync(), 100);
  }

  return {
    scheduleSync,
    pullFromRemoteIfIdle,
    flushPending,
    dispose: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pollTimer) clearInterval(pollTimer);
    },
  };
}

export { canSyncCoinWallet };

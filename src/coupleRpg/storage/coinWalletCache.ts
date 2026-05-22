import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import type { CoinTransactionRecord, CoinWalletCache } from './coinWalletTypes';

function defaultCache(): CoinWalletCache {
  return {
    version: 1,
    coupleId: null,
    balance: 0,
    updatedAt: null,
    transactions: [],
    migrationDone: false,
  };
}

export function loadCoinWalletCache(): CoinWalletCache {
  const raw = loadJson<CoinWalletCache | null>(LQ_KEYS.coinWalletCache, null);
  if (!raw || raw.version !== 1) return defaultCache();
  return {
    ...defaultCache(),
    ...raw,
    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
  };
}

export function saveCoinWalletCache(cache: CoinWalletCache): void {
  saveJson(LQ_KEYS.coinWalletCache, cache);
}

export function applyWalletBalanceToCache(
  coupleId: string,
  balance: number,
  updatedAt: string | null,
  transactions: CoinTransactionRecord[]
): CoinWalletCache {
  const cache: CoinWalletCache = {
    version: 1,
    coupleId,
    balance: Math.max(0, Math.floor(balance)),
    updatedAt,
    transactions: transactions.slice(0, 120),
    migrationDone: loadCoinWalletCache().migrationDone,
  };
  saveCoinWalletCache(cache);
  return cache;
}

export function upsertPendingTransaction(
  tx: CoinTransactionRecord
): CoinWalletCache {
  const prev = loadCoinWalletCache();
  const without = prev.transactions.filter((t) => t.idempotencyKey !== tx.idempotencyKey);
  const optimisticBalance = Math.max(0, prev.balance + tx.amount);
  const cache: CoinWalletCache = {
    ...prev,
    balance: optimisticBalance,
    transactions: [tx, ...without].slice(0, 120),
  };
  saveCoinWalletCache(cache);
  return cache;
}

export function markTransactionSynced(idempotencyKey: string, remoteId: string): CoinWalletCache {
  const prev = loadCoinWalletCache();
  const cache: CoinWalletCache = {
    ...prev,
    transactions: prev.transactions.map((t) =>
      t.idempotencyKey === idempotencyKey ? { ...t, id: remoteId, syncPending: false } : t
    ),
  };
  saveCoinWalletCache(cache);
  return cache;
}

export function getPendingCoinTransactions(): CoinTransactionRecord[] {
  return loadCoinWalletCache().transactions.filter((t) => t.syncPending);
}

export function setCoinWalletMigrationDone(coupleId: string): void {
  const prev = loadCoinWalletCache();
  saveCoinWalletCache({ ...prev, coupleId, migrationDone: true });
}

export function isCoinWalletMigrationDone(coupleId: string): boolean {
  const c = loadCoinWalletCache();
  return Boolean(c.migrationDone && c.coupleId === coupleId);
}

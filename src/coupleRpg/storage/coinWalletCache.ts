import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import { getActiveStorageUserId } from './storageSession';
import type {
  CoinWalletCache,
  GrowthSnapshot,
  UserCoinTransactionRecord,
} from './coinWalletTypes';
import { defaultGrowthSnapshot } from './coinWalletTypes';

function defaultCache(): CoinWalletCache {
  return {
    version: 3,
    userId: null,
    coupleId: null,
    snapshot: defaultGrowthSnapshot(),
    userCoinTransactions: [],
    migrationDone: false,
  };
}

function migrateV2ToV3(raw: CoinWalletCache & { transactions?: unknown[] }): CoinWalletCache {
  const txs = Array.isArray(raw.transactions)
    ? (raw.transactions as Array<{
        id: string;
        coupleId: string;
        userId: string | null;
        txType: UserCoinTransactionRecord['txType'];
        source: string;
        note?: string | null;
        idempotencyKey: string;
        loveCoinDelta?: number;
        amount?: number;
        createdAt: string;
        syncPending?: boolean;
        emoji?: string | null;
      }>)
        .filter((t) => (t.loveCoinDelta ?? t.amount ?? 0) !== 0)
        .map(
          (t): UserCoinTransactionRecord => ({
            id: t.id,
            userId: t.userId ?? raw.userId ?? '',
            coupleId: t.coupleId,
            amount: t.loveCoinDelta ?? t.amount ?? 0,
            txType: t.txType,
            source: t.source,
            note: t.note ?? null,
            idempotencyKey: t.idempotencyKey,
            createdAt: t.createdAt,
            syncPending: t.syncPending,
            emoji: t.emoji ?? null,
          })
        )
        .filter((t) => t.userId)
    : [];

  return {
    version: 3,
    userId: raw.userId ?? null,
    coupleId: raw.coupleId ?? null,
    snapshot: { ...defaultGrowthSnapshot(), ...raw.snapshot },
    userCoinTransactions: txs.length ? txs : raw.userCoinTransactions ?? [],
    migrationDone: raw.migrationDone,
  };
}

export function loadCoinWalletCache(): CoinWalletCache {
  const activeUserId = getActiveStorageUserId();
  if (!activeUserId) return defaultCache();

  const raw = loadJson<CoinWalletCache | Record<string, unknown> | null>(
    LQ_KEYS.coinWalletCache,
    null
  );
  if (!raw) return defaultCache();
  if ((raw as CoinWalletCache).version === 3) {
    const c = raw as CoinWalletCache;
    if (c.userId && c.userId !== activeUserId) return defaultCache();
    return {
      ...defaultCache(),
      ...c,
      snapshot: { ...defaultGrowthSnapshot(), ...c.snapshot },
      userCoinTransactions: Array.isArray(c.userCoinTransactions) ? c.userCoinTransactions : [],
    };
  }
  if ((raw as { version?: number }).version === 2) {
    return migrateV2ToV3(raw as CoinWalletCache & { transactions?: unknown[] });
  }
  if ((raw as { version?: number }).version === 1) {
    const balance = typeof (raw as { balance?: number }).balance === 'number' ? (raw as { balance: number }).balance : 0;
    return migrateV2ToV3({
      version: 2,
      coupleId: (raw as { coupleId?: string | null }).coupleId ?? null,
      userId: null,
      snapshot: {
        ...defaultGrowthSnapshot(),
        loveCoinBalance: balance,
      },
      userCoinTransactions: [],
      migrationDone: Boolean((raw as { migrationDone?: boolean }).migrationDone),
      transactions: [],
    } as CoinWalletCache & { transactions: unknown[] });
  }
  return defaultCache();
}

export function saveCoinWalletCache(cache: CoinWalletCache): void {
  saveJson(LQ_KEYS.coinWalletCache, cache);
}

export function applyGrowthSnapshotToCache(
  userId: string,
  coupleId: string,
  snapshot: GrowthSnapshot,
  userCoinTransactions: UserCoinTransactionRecord[]
): CoinWalletCache {
  const prev = loadCoinWalletCache();
  const cache: CoinWalletCache = {
    version: 3,
    userId,
    coupleId,
    snapshot: {
      loveCoinBalance: Math.max(0, Math.floor(snapshot.loveCoinBalance)),
      heartValue: Math.min(100, Math.max(0, Math.floor(snapshot.heartValue))),
      bondValue: Math.min(100, Math.max(0, Math.floor(snapshot.bondValue))),
      exp: Math.max(0, Math.floor(snapshot.exp)),
      level: Math.max(1, Math.floor(snapshot.level)),
      updatedAt: snapshot.updatedAt,
    },
    userCoinTransactions: userCoinTransactions.slice(0, 120),
    migrationDone: prev.migrationDone,
  };
  saveCoinWalletCache(cache);
  return cache;
}

export function upsertPendingUserCoinTransaction(tx: UserCoinTransactionRecord): CoinWalletCache {
  const prev = loadCoinWalletCache();
  const without = prev.userCoinTransactions.filter((t) => t.idempotencyKey !== tx.idempotencyKey);
  const snap = { ...prev.snapshot };
  snap.loveCoinBalance = Math.max(0, snap.loveCoinBalance + tx.amount);

  const cache: CoinWalletCache = {
    ...prev,
    snapshot: snap,
    userCoinTransactions: [tx, ...without].slice(0, 120),
  };
  saveCoinWalletCache(cache);
  return cache;
}

export function markUserCoinTransactionSynced(
  idempotencyKey: string,
  remoteId: string
): CoinWalletCache {
  const prev = loadCoinWalletCache();
  const cache: CoinWalletCache = {
    ...prev,
    userCoinTransactions: prev.userCoinTransactions.map((t) =>
      t.idempotencyKey === idempotencyKey ? { ...t, id: remoteId, syncPending: false } : t
    ),
  };
  saveCoinWalletCache(cache);
  return cache;
}

export function getPendingUserCoinTransactions(): UserCoinTransactionRecord[] {
  return loadCoinWalletCache().userCoinTransactions.filter((t) => t.syncPending);
}

export function setCoinWalletMigrationDone(userId: string, coupleId: string): void {
  const prev = loadCoinWalletCache();
  saveCoinWalletCache({ ...prev, userId, coupleId, migrationDone: true });
}

export function isCoinWalletMigrationDone(userId: string, coupleId: string): boolean {
  const c = loadCoinWalletCache();
  return Boolean(c.migrationDone && c.userId === userId && c.coupleId === coupleId);
}

export function getCachedGrowthSnapshot(): GrowthSnapshot {
  return loadCoinWalletCache().snapshot;
}

export function getCachedCoinBalance(): number {
  return loadCoinWalletCache().snapshot.loveCoinBalance;
}

/** @deprecated use upsertPendingUserCoinTransaction */
export function upsertPendingGrowthTransaction(
  tx: import('./coinWalletTypes').GrowthTransactionRecord
): CoinWalletCache {
  return upsertPendingUserCoinTransaction({
    id: tx.id,
    userId: tx.userId ?? '',
    coupleId: tx.coupleId,
    amount: tx.loveCoinDelta,
    txType: tx.txType,
    source: tx.source,
    note: tx.note,
    idempotencyKey: tx.idempotencyKey,
    createdAt: tx.createdAt,
    syncPending: tx.syncPending,
    emoji: tx.emoji,
  });
}

/** @deprecated */
export function markGrowthTransactionSynced(
  idempotencyKey: string,
  remoteId: string
): CoinWalletCache {
  return markUserCoinTransactionSynced(idempotencyKey, remoteId);
}

/** @deprecated */
export function getPendingGrowthTransactions(): UserCoinTransactionRecord[] {
  return getPendingUserCoinTransactions();
}

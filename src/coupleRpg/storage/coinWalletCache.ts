import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import type {
  CoinWalletCache,
  GrowthSnapshot,
  GrowthTransactionRecord,
} from './coinWalletTypes';
import { defaultGrowthSnapshot } from './coinWalletTypes';

function defaultCache(): CoinWalletCache {
  return {
    version: 2,
    coupleId: null,
    snapshot: defaultGrowthSnapshot(),
    transactions: [],
    migrationDone: false,
  };
}

function migrateV1ToV2(raw: Record<string, unknown>): CoinWalletCache {
  const balance = typeof raw.balance === 'number' ? raw.balance : 0;
  return {
    version: 2,
    coupleId: (raw.coupleId as string | null) ?? null,
    snapshot: {
      loveCoinBalance: balance,
      heartValue: 50,
      bondValue: 60,
      exp: 0,
      level: 1,
      updatedAt: (raw.updatedAt as string | null) ?? null,
    },
    transactions: [],
    migrationDone: Boolean(raw.migrationDone),
  };
}

export function loadCoinWalletCache(): CoinWalletCache {
  const raw = loadJson<CoinWalletCache | Record<string, unknown> | null>(
    LQ_KEYS.coinWalletCache,
    null
  );
  if (!raw) return defaultCache();
  if ((raw as CoinWalletCache).version === 2) {
    const c = raw as CoinWalletCache;
    return {
      ...defaultCache(),
      ...c,
      snapshot: { ...defaultGrowthSnapshot(), ...c.snapshot },
      transactions: Array.isArray(c.transactions) ? c.transactions : [],
    };
  }
  if ((raw as { version?: number }).version === 1) {
    return migrateV1ToV2(raw as Record<string, unknown>);
  }
  return defaultCache();
}

export function saveCoinWalletCache(cache: CoinWalletCache): void {
  saveJson(LQ_KEYS.coinWalletCache, cache);
}

export function applyGrowthSnapshotToCache(
  coupleId: string,
  snapshot: GrowthSnapshot,
  transactions: GrowthTransactionRecord[]
): CoinWalletCache {
  const prev = loadCoinWalletCache();
  const cache: CoinWalletCache = {
    version: 2,
    coupleId,
    snapshot: {
      loveCoinBalance: Math.max(0, Math.floor(snapshot.loveCoinBalance)),
      heartValue: Math.min(100, Math.max(0, Math.floor(snapshot.heartValue))),
      bondValue: Math.min(100, Math.max(0, Math.floor(snapshot.bondValue))),
      exp: Math.max(0, Math.floor(snapshot.exp)),
      level: Math.max(1, Math.floor(snapshot.level)),
      updatedAt: snapshot.updatedAt,
    },
    transactions: transactions.slice(0, 120),
    migrationDone: prev.migrationDone,
  };
  saveCoinWalletCache(cache);
  return cache;
}

/** @deprecated use applyGrowthSnapshotToCache */
export function applyWalletBalanceToCache(
  coupleId: string,
  balance: number,
  updatedAt: string | null,
  transactions: import('./coinWalletTypes').CoinTransactionRecord[]
): CoinWalletCache {
  const growthTxs: GrowthTransactionRecord[] = transactions.map((t) => ({
    id: t.id,
    coupleId: t.coupleId,
    userId: t.userId,
    txType: t.txType,
    source: t.source,
    note: t.title,
    idempotencyKey: t.idempotencyKey,
    loveCoinDelta: t.amount,
    heartDelta: 0,
    bondDelta: 0,
    expDelta: 0,
    createdAt: t.createdAt,
    syncPending: t.syncPending,
    emoji: t.emoji,
  }));
  const prev = loadCoinWalletCache();
  return applyGrowthSnapshotToCache(
    coupleId,
    {
      loveCoinBalance: balance,
      heartValue: prev.snapshot.heartValue,
      bondValue: prev.snapshot.bondValue,
      exp: prev.snapshot.exp,
      level: prev.snapshot.level,
      updatedAt,
    },
    growthTxs
  );
}

export function upsertPendingGrowthTransaction(tx: GrowthTransactionRecord): CoinWalletCache {
  const prev = loadCoinWalletCache();
  const without = prev.transactions.filter((t) => t.idempotencyKey !== tx.idempotencyKey);
  const snap = { ...prev.snapshot };
  snap.loveCoinBalance = Math.max(0, snap.loveCoinBalance + tx.loveCoinDelta);
  snap.heartValue = Math.min(100, Math.max(0, snap.heartValue + tx.heartDelta));
  snap.bondValue = Math.min(100, Math.max(0, snap.bondValue + tx.bondDelta));
  snap.exp = Math.max(0, snap.exp + tx.expDelta);
  snap.level = Math.max(1, Math.floor(snap.exp / 100) + 1);

  const cache: CoinWalletCache = {
    ...prev,
    snapshot: snap,
    transactions: [tx, ...without].slice(0, 120),
  };
  saveCoinWalletCache(cache);
  return cache;
}

export function markGrowthTransactionSynced(
  idempotencyKey: string,
  remoteId: string
): CoinWalletCache {
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

export function getPendingGrowthTransactions(): GrowthTransactionRecord[] {
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

export function getCachedGrowthSnapshot(): GrowthSnapshot {
  return loadCoinWalletCache().snapshot;
}

export function getCachedCoinBalance(): number {
  return loadCoinWalletCache().snapshot.loveCoinBalance;
}

export type CoinTxType = 'earn' | 'spend' | 'adjust';

/** Merged view: user LoveCoin + couple growth (heart, bond, exp, level). */
export type GrowthSnapshot = {
  loveCoinBalance: number;
  heartValue: number;
  bondValue: number;
  exp: number;
  level: number;
  updatedAt: string | null;
};

export type UserCoinTransactionRecord = {
  id: string;
  userId: string;
  coupleId: string;
  amount: number;
  txType: CoinTxType;
  source: string;
  note: string | null;
  idempotencyKey: string;
  createdAt: string;
  syncPending?: boolean;
  emoji?: string | null;
};

export type GrowthTransactionRecord = {
  id: string;
  coupleId: string;
  userId: string | null;
  txType: CoinTxType;
  source: string;
  note: string | null;
  idempotencyKey: string;
  loveCoinDelta: number;
  heartDelta: number;
  bondDelta: number;
  expDelta: number;
  createdAt: string;
  syncPending?: boolean;
  emoji?: string | null;
};

/** @deprecated use UserCoinTransactionRecord */
export type CoinTransactionRecord = {
  id: string;
  coupleId: string;
  userId: string | null;
  amount: number;
  txType: CoinTxType;
  source: string;
  title: string | null;
  emoji: string | null;
  idempotencyKey: string;
  createdAt: string;
  syncPending?: boolean;
};

export type CoinWalletCache = {
  version: 3;
  userId: string | null;
  coupleId: string | null;
  snapshot: GrowthSnapshot;
  /** Current user's LoveCoin ledger (cloud source of truth when synced). */
  userCoinTransactions: UserCoinTransactionRecord[];
  migrationDone?: boolean;
};

export function defaultGrowthSnapshot(): GrowthSnapshot {
  return {
    loveCoinBalance: 0,
    heartValue: 50,
    bondValue: 60,
    exp: 0,
    level: 1,
    updatedAt: null,
  };
}

export function userCoinTxToCoinRecord(tx: UserCoinTransactionRecord): CoinTransactionRecord {
  return {
    id: tx.id,
    coupleId: tx.coupleId,
    userId: tx.userId,
    amount: tx.amount,
    txType: tx.txType,
    source: tx.source,
    title: tx.note,
    emoji: tx.emoji ?? null,
    idempotencyKey: tx.idempotencyKey,
    createdAt: tx.createdAt,
    syncPending: tx.syncPending,
  };
}

/** @deprecated */
export function growthTxToCoinRecord(tx: GrowthTransactionRecord): CoinTransactionRecord {
  return {
    id: tx.id,
    coupleId: tx.coupleId,
    userId: tx.userId,
    amount: tx.loveCoinDelta,
    txType: tx.txType,
    source: tx.source,
    title: tx.note,
    emoji: tx.emoji ?? null,
    idempotencyKey: tx.idempotencyKey,
    createdAt: tx.createdAt,
    syncPending: tx.syncPending,
  };
}

export type CoinTxType = 'earn' | 'spend' | 'adjust';

/** Supabase couple_wallets snapshot (source of truth when cloud sync on). */
export type GrowthSnapshot = {
  loveCoinBalance: number;
  heartValue: number;
  bondValue: number;
  exp: number;
  level: number;
  updatedAt: string | null;
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
  /** 兌換／任務顯示用 */
  emoji?: string | null;
};

/** @deprecated use GrowthTransactionRecord — kept for earn history mapping */
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
  version: 2;
  coupleId: string | null;
  snapshot: GrowthSnapshot;
  transactions: GrowthTransactionRecord[];
  /** 本機成長數值已匯入雲端 */
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

export type CoinTxType = 'earn' | 'spend' | 'adjust';

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
  /** 尚未成功寫入 Supabase */
  syncPending?: boolean;
};

export type CoinWalletCache = {
  version: 1;
  coupleId: string | null;
  balance: number;
  updatedAt: string | null;
  transactions: CoinTransactionRecord[];
  /** 本機餘額已匯入雲端 */
  migrationDone?: boolean;
};

/**
 * LoveCoin wallet — Supabase transaction ledger as source of truth.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ENABLE_COIN_WALLET_CLOUD_SYNC } from '../constants/coinWalletSyncFlags';
import { localMigrationCoinKey } from '../lib/coinIdempotency';
import { makeId } from '../lib/id';
import type { CoinEarnMeta } from '../storage/rewardTypes';
import {
  applyWalletBalanceToCache,
  getPendingCoinTransactions,
  isCoinWalletMigrationDone,
  loadCoinWalletCache,
  markTransactionSynced,
  setCoinWalletMigrationDone,
  upsertPendingTransaction,
} from '../storage/coinWalletCache';
import type { CoinTransactionRecord, CoinTxType } from '../storage/coinWalletTypes';

const LOG = '[coin-wallet-sync]';
const TX_LIMIT = 100;

export type CoinWalletSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

type WalletRow = { couple_id: string; balance: number; updated_at: string };
type TxRow = {
  id: string;
  couple_id: string;
  user_id: string | null;
  amount: number;
  tx_type: CoinTxType;
  source: string;
  title: string | null;
  emoji: string | null;
  idempotency_key: string;
  created_at: string;
};

export function canSyncCoinWallet(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  if (!ENABLE_COIN_WALLET_CLOUD_SYNC) return false;
  return Boolean(
    input.configured && input.userId && input.coupleId && input.online && input.isFullyBound
  );
}

function rowToRecord(row: TxRow): CoinTransactionRecord {
  return {
    id: row.id,
    coupleId: row.couple_id,
    userId: row.user_id,
    amount: row.amount,
    txType: row.tx_type,
    source: row.source,
    title: row.title,
    emoji: row.emoji,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    syncPending: false,
  };
}

export async function pullCoinWalletFromRemote(
  supabase: SupabaseClient,
  coupleId: string
): Promise<{ balance: number; transactions: CoinTransactionRecord[] }> {
  const { data: wallet, error: wErr } = await supabase
    .from('couple_wallets')
    .select('couple_id, balance, updated_at')
    .eq('couple_id', coupleId)
    .maybeSingle();

  if (wErr) throw wErr;

  const { data: txs, error: tErr } = await supabase
    .from('coin_transactions')
    .select(
      'id, couple_id, user_id, amount, tx_type, source, title, emoji, idempotency_key, created_at'
    )
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(TX_LIMIT);

  if (tErr) throw tErr;

  const balance = wallet ? Number((wallet as WalletRow).balance) || 0 : 0;
  const updatedAt = wallet ? (wallet as WalletRow).updated_at : null;
  const transactions = ((txs ?? []) as TxRow[]).map(rowToRecord);

  applyWalletBalanceToCache(coupleId, balance, updatedAt, transactions);
  return { balance, transactions };
}

export type PostCoinTxInput = {
  coupleId: string;
  userId: string | null;
  amount: number;
  txType: CoinTxType;
  source: string;
  idempotencyKey: string;
  title?: string;
  emoji?: string;
};

export async function postCoinTransactionRemote(
  supabase: SupabaseClient,
  input: PostCoinTxInput
): Promise<CoinTransactionRecord> {
  const { data, error } = await supabase.rpc('lovequest_post_coin_transaction', {
    p_couple_id: input.coupleId,
    p_user_id: input.userId,
    p_amount: input.amount,
    p_tx_type: input.txType,
    p_source: input.source,
    p_idempotency_key: input.idempotencyKey,
    p_title: input.title ?? null,
    p_emoji: input.emoji ?? null,
    p_metadata: {},
  });

  if (error) {
    if (error.message?.includes('insufficient_balance')) {
      throw new Error('insufficient_balance');
    }
    throw error;
  }

  const row = data as TxRow;
  return rowToRecord(row);
}

export async function pushPendingCoinTransactions(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string | null
): Promise<void> {
  const pending = getPendingCoinTransactions();
  for (const tx of pending) {
    try {
      const remote = await postCoinTransactionRemote(supabase, {
        coupleId,
        userId: tx.userId ?? userId,
        amount: tx.amount,
        txType: tx.txType,
        source: tx.source,
        idempotencyKey: tx.idempotencyKey,
        title: tx.title ?? undefined,
        emoji: tx.emoji ?? undefined,
      });
      markTransactionSynced(tx.idempotencyKey, remote.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`${LOG} push pending failed ${tx.idempotencyKey}:`, msg);
    }
  }
}

/** 首次綁定：將本機 RPG loveCoins 匯入雲端（一次性） */
export async function migrateLocalLoveCoinsIfNeeded(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string | null,
  localBalance: number
): Promise<void> {
  if (localBalance <= 0 || isCoinWalletMigrationDone(coupleId)) return;

  const { balance } = await pullCoinWalletFromRemote(supabase, coupleId);
  if (balance > 0) {
    setCoinWalletMigrationDone(coupleId);
    return;
  }

  const key = localMigrationCoinKey(coupleId);
  try {
    await postCoinTransactionRemote(supabase, {
      coupleId,
      userId,
      amount: localBalance,
      txType: 'adjust',
      source: 'migration',
      idempotencyKey: key,
      title: '本機餘額匯入',
      emoji: '🪙',
    });
    setCoinWalletMigrationDone(coupleId);
  } catch (e) {
    console.warn(`${LOG} migration failed:`, e);
  }
}

export type RecordCoinResult =
  | { ok: true; balance: number; synced: boolean }
  | { ok: false; error: string };

/** 記錄一筆 LoveCoin 交易；雲端可用時以 Supabase 為準 */
export async function recordCoinTransaction(
  supabase: SupabaseClient | null,
  canSync: boolean,
  input: PostCoinTxInput & { meta?: CoinEarnMeta }
): Promise<RecordCoinResult> {
  const title = input.title ?? input.meta?.title;
  const emoji = input.emoji ?? input.meta?.emoji;

  const pending: CoinTransactionRecord = {
    id: makeId(),
    coupleId: input.coupleId,
    userId: input.userId,
    amount: input.amount,
    txType: input.txType,
    source: input.source,
    title: title ?? null,
    emoji: emoji ?? null,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date().toISOString(),
    syncPending: true,
  };

  upsertPendingTransaction(pending);

  if (!canSync || !supabase) {
    const cache = loadCoinWalletCache();
    return { ok: true, balance: cache.balance, synced: false };
  }

  try {
    await postCoinTransactionRemote(supabase, {
      ...input,
      title,
      emoji,
    });
    markTransactionSynced(input.idempotencyKey, pending.id);
    const { balance } = await pullCoinWalletFromRemote(supabase, input.coupleId);
    return { ok: true, balance, synced: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'insufficient_balance') {
      return { ok: false, error: 'insufficient_balance' };
    }
    console.warn(`${LOG} record deferred (pending):`, msg);
    const cache = loadCoinWalletCache();
    return { ok: true, balance: cache.balance, synced: false };
  }
}

export function getCachedCoinBalance(): number {
  return loadCoinWalletCache().balance;
}

export function coinTransactionsToEarnHistory(
  transactions: CoinTransactionRecord[]
): import('../storage/rewardTypes').LoveCoinEarnRecord[] {
  return transactions
    .filter((t) => t.amount > 0)
    .slice(0, 80)
    .map((t) => ({
      id: t.id,
      date: t.createdAt.slice(0, 10),
      time: t.createdAt.slice(11, 16),
      source: (t.source as import('../storage/rewardTypes').EarnSource) || 'task',
      title: t.title ?? t.source,
      emoji: t.emoji ?? '🪙',
      coins: t.amount,
    }));
}

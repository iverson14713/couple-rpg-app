/**
 * Couple growth stats — Supabase ledger as source of truth.
 * LoveCoin, heart, bond, EXP, level + transaction log.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ENABLE_COIN_WALLET_CLOUD_SYNC } from '../constants/coinWalletSyncFlags';
import { localMigrationGrowthKey } from '../lib/growthIdempotency';
import { makeId } from '../lib/id';
import type { CoinEarnMeta } from '../storage/rewardTypes';
import {
  applyGrowthSnapshotToCache,
  getPendingGrowthTransactions,
  isCoinWalletMigrationDone,
  loadCoinWalletCache,
  markGrowthTransactionSynced,
  setCoinWalletMigrationDone,
  upsertPendingGrowthTransaction,
} from '../storage/coinWalletCache';
import type {
  CoinTransactionRecord,
  CoinTxType,
  GrowthSnapshot,
  GrowthTransactionRecord,
} from '../storage/coinWalletTypes';
import { growthTxToCoinRecord } from '../storage/coinWalletTypes';
import type { RpgReward } from '../storage/rpgLogic';
import type { RpgState } from '../storage/types';

const LOG = '[growth-sync]';
const TX_LIMIT = 100;

export type CoinWalletSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

type WalletRow = {
  couple_id: string;
  balance?: number;
  love_coin_balance?: number;
  heart_value?: number;
  bond_value?: number;
  exp?: number;
  level?: number;
  updated_at: string;
};

type GrowthTxRow = {
  id: string;
  couple_id: string;
  user_id: string | null;
  tx_type: CoinTxType;
  source: string;
  note: string | null;
  idempotency_key: string;
  love_coin_delta: number;
  heart_delta: number;
  bond_delta: number;
  exp_delta: number;
  created_at: string;
};

type RpcGrowthPayload = {
  wallet: WalletRow;
  transaction: GrowthTxRow;
  duplicate?: boolean;
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

export function walletRowToSnapshot(row: WalletRow | null): GrowthSnapshot {
  if (!row) return loadCoinWalletCache().snapshot;
  const love =
    row.love_coin_balance != null
      ? Number(row.love_coin_balance)
      : Number(row.balance) || 0;
  const exp = Number(row.exp) || 0;
  return {
    loveCoinBalance: Math.max(0, Math.floor(love)),
    heartValue: Math.min(100, Math.max(0, Number(row.heart_value) || 50)),
    bondValue: Math.min(100, Math.max(0, Number(row.bond_value) || 60)),
    exp: Math.max(0, Math.floor(exp)),
    level: Math.max(1, Number(row.level) || Math.floor(exp / 100) + 1),
    updatedAt: row.updated_at ?? null,
  };
}

function rowToGrowthRecord(row: GrowthTxRow, emoji?: string | null): GrowthTransactionRecord {
  return {
    id: row.id,
    coupleId: row.couple_id,
    userId: row.user_id,
    txType: row.tx_type,
    source: row.source,
    note: row.note,
    idempotencyKey: row.idempotency_key,
    loveCoinDelta: row.love_coin_delta,
    heartDelta: row.heart_delta,
    bondDelta: row.bond_delta,
    expDelta: row.exp_delta,
    createdAt: row.created_at,
    syncPending: false,
    emoji: emoji ?? null,
  };
}

export function growthSnapshotToRpgFields(
  snapshot: GrowthSnapshot
): Pick<RpgState, 'loveCoins' | 'heartPoints' | 'compatibility' | 'xp' | 'level'> {
  return {
    loveCoins: snapshot.loveCoinBalance,
    heartPoints: snapshot.heartValue,
    compatibility: snapshot.bondValue,
    xp: snapshot.exp,
    level: snapshot.level,
  };
}

export function rewardToGrowthDeltas(reward: RpgReward): {
  loveCoinDelta: number;
  heartDelta: number;
  bondDelta: number;
  expDelta: number;
} {
  return {
    loveCoinDelta: reward.loveCoins ?? 0,
    heartDelta: reward.heart ?? 0,
    bondDelta: reward.compatibility ?? 0,
    expDelta: reward.xp ?? 0,
  };
}

export function hasGrowthDeltas(deltas: {
  loveCoinDelta: number;
  heartDelta: number;
  bondDelta: number;
  expDelta: number;
}): boolean {
  return (
    deltas.loveCoinDelta !== 0 ||
    deltas.heartDelta !== 0 ||
    deltas.bondDelta !== 0 ||
    deltas.expDelta !== 0
  );
}

export async function pullGrowthFromRemote(
  supabase: SupabaseClient,
  coupleId: string
): Promise<{ snapshot: GrowthSnapshot; transactions: GrowthTransactionRecord[] }> {
  const { data: wallet, error: wErr } = await supabase
    .from('couple_wallets')
    .select(
      'couple_id, balance, love_coin_balance, heart_value, bond_value, exp, level, updated_at'
    )
    .eq('couple_id', coupleId)
    .maybeSingle();

  if (wErr) throw wErr;

  const { data: txs, error: tErr } = await supabase
    .from('couple_growth_transactions')
    .select(
      'id, couple_id, user_id, tx_type, source, note, idempotency_key, love_coin_delta, heart_delta, bond_delta, exp_delta, created_at'
    )
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(TX_LIMIT);

  if (tErr) throw tErr;

  const snapshot = walletRowToSnapshot(wallet as WalletRow | null);
  const transactions = ((txs ?? []) as GrowthTxRow[]).map((r) => rowToGrowthRecord(r));

  applyGrowthSnapshotToCache(coupleId, snapshot, transactions);
  return { snapshot, transactions };
}

/** @deprecated use pullGrowthFromRemote */
export async function pullCoinWalletFromRemote(
  supabase: SupabaseClient,
  coupleId: string
): Promise<{ balance: number; transactions: CoinTransactionRecord[] }> {
  const { snapshot, transactions } = await pullGrowthFromRemote(supabase, coupleId);
  return {
    balance: snapshot.loveCoinBalance,
    transactions: transactions.map(growthTxToCoinRecord),
  };
}

export type PostGrowthEventInput = {
  coupleId: string;
  userId: string | null;
  txType: CoinTxType;
  source: string;
  idempotencyKey: string;
  note?: string;
  loveCoinDelta?: number;
  heartDelta?: number;
  bondDelta?: number;
  expDelta?: number;
  emoji?: string;
};

export async function postGrowthEventRemote(
  supabase: SupabaseClient,
  input: PostGrowthEventInput
): Promise<{ snapshot: GrowthSnapshot; transaction: GrowthTransactionRecord }> {
  const { data, error } = await supabase.rpc('lovequest_post_growth_event', {
    p_couple_id: input.coupleId,
    p_user_id: input.userId,
    p_tx_type: input.txType,
    p_source: input.source,
    p_idempotency_key: input.idempotencyKey,
    p_note: input.note ?? null,
    p_love_coin_delta: input.loveCoinDelta ?? 0,
    p_heart_delta: input.heartDelta ?? 0,
    p_bond_delta: input.bondDelta ?? 0,
    p_exp_delta: input.expDelta ?? 0,
    p_metadata: {},
  });

  if (error) {
    if (error.message?.includes('insufficient_love_coin')) {
      throw new Error('insufficient_balance');
    }
    throw error;
  }

  const payload = data as RpcGrowthPayload;
  const snapshot = walletRowToSnapshot(payload.wallet);
  const transaction = rowToGrowthRecord(payload.transaction, input.emoji);
  return { snapshot, transaction };
}

export async function pushPendingGrowthTransactions(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string | null
): Promise<void> {
  const pending = getPendingGrowthTransactions();
  for (const tx of pending) {
    try {
      const { transaction } = await postGrowthEventRemote(supabase, {
        coupleId,
        userId: tx.userId ?? userId,
        txType: tx.txType,
        source: tx.source,
        idempotencyKey: tx.idempotencyKey,
        note: tx.note ?? undefined,
        loveCoinDelta: tx.loveCoinDelta,
        heartDelta: tx.heartDelta,
        bondDelta: tx.bondDelta,
        expDelta: tx.expDelta,
        emoji: tx.emoji ?? undefined,
      });
      markGrowthTransactionSynced(tx.idempotencyKey, transaction.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`${LOG} push pending failed ${tx.idempotencyKey}:`, msg);
    }
  }
}

/** @deprecated */
export const pushPendingCoinTransactions = pushPendingGrowthTransactions;

export async function migrateLocalGrowthIfNeeded(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string | null,
  localRpg: Pick<RpgState, 'loveCoins' | 'heartPoints' | 'compatibility' | 'xp'>
): Promise<void> {
  if (isCoinWalletMigrationDone(coupleId)) return;

  const { snapshot, transactions } = await pullGrowthFromRemote(supabase, coupleId);
  if (transactions.length > 0 || snapshot.exp > 0 || snapshot.loveCoinBalance > 0) {
    setCoinWalletMigrationDone(coupleId);
    return;
  }

  const hasLocal =
    localRpg.loveCoins > 0 ||
    localRpg.heartPoints !== 50 ||
    localRpg.compatibility !== 60 ||
    localRpg.xp > 0;
  if (!hasLocal) {
    setCoinWalletMigrationDone(coupleId);
    return;
  }

  const key = localMigrationGrowthKey(coupleId);
  try {
    const { error } = await supabase.rpc('lovequest_init_growth_from_local', {
      p_couple_id: coupleId,
      p_user_id: userId,
      p_love_coin: Math.max(0, Math.floor(localRpg.loveCoins)),
      p_heart: Math.min(100, Math.max(0, Math.floor(localRpg.heartPoints))),
      p_bond: Math.min(100, Math.max(0, Math.floor(localRpg.compatibility))),
      p_exp: Math.max(0, Math.floor(localRpg.xp)),
      p_idempotency_key: key,
    });
    if (error) throw error;
    setCoinWalletMigrationDone(coupleId);
    await pullGrowthFromRemote(supabase, coupleId);
  } catch (e) {
    console.warn(`${LOG} migration failed:`, e);
  }
}

/** @deprecated */
export async function migrateLocalLoveCoinsIfNeeded(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string | null,
  localBalance: number
): Promise<void> {
  await migrateLocalGrowthIfNeeded(supabase, coupleId, userId, {
    loveCoins: localBalance,
    heartPoints: 50,
    compatibility: 60,
    xp: 0,
  });
}

export type RecordGrowthResult =
  | { ok: true; snapshot: GrowthSnapshot; synced: boolean }
  | { ok: false; error: string };

export async function recordGrowthEvent(
  supabase: SupabaseClient | null,
  canSync: boolean,
  input: PostGrowthEventInput & { meta?: CoinEarnMeta }
): Promise<RecordGrowthResult> {
  const note = input.note ?? input.meta?.title ?? input.source;
  const emoji = input.emoji ?? input.meta?.emoji;

  const pending: GrowthTransactionRecord = {
    id: makeId(),
    coupleId: input.coupleId,
    userId: input.userId,
    txType: input.txType,
    source: input.source,
    note: note ?? null,
    idempotencyKey: input.idempotencyKey,
    loveCoinDelta: input.loveCoinDelta ?? 0,
    heartDelta: input.heartDelta ?? 0,
    bondDelta: input.bondDelta ?? 0,
    expDelta: input.expDelta ?? 0,
    createdAt: new Date().toISOString(),
    syncPending: true,
    emoji: emoji ?? null,
  };

  upsertPendingGrowthTransaction(pending);

  if (!canSync || !supabase) {
    return { ok: true, snapshot: loadCoinWalletCache().snapshot, synced: false };
  }

  try {
    await postGrowthEventRemote(supabase, { ...input, note, emoji });
    markGrowthTransactionSynced(input.idempotencyKey, pending.id);
    const { snapshot } = await pullGrowthFromRemote(supabase, input.coupleId);
    return { ok: true, snapshot, synced: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'insufficient_balance') {
      return { ok: false, error: 'insufficient_balance' };
    }
    console.warn(`${LOG} record deferred (pending):`, msg);
    return { ok: true, snapshot: loadCoinWalletCache().snapshot, synced: false };
  }
}

/** @deprecated use recordGrowthEvent */
export async function recordCoinTransaction(
  supabase: SupabaseClient | null,
  canSync: boolean,
  input: {
    coupleId: string;
    userId: string | null;
    amount: number;
    txType: CoinTxType;
    source: string;
    idempotencyKey: string;
    title?: string;
    emoji?: string;
    meta?: CoinEarnMeta;
  }
): Promise<
  | { ok: true; balance: number; synced: boolean }
  | { ok: false; error: string }
> {
  const result = await recordGrowthEvent(supabase, canSync, {
    coupleId: input.coupleId,
    userId: input.userId,
    txType: input.txType,
    source: input.source,
    idempotencyKey: input.idempotencyKey,
    note: input.title,
    emoji: input.emoji,
    loveCoinDelta: input.amount,
    meta: input.meta,
  });
  if (!result.ok) return result;
  return {
    ok: true,
    balance: result.snapshot.loveCoinBalance,
    synced: result.synced,
  };
}

export function getCachedCoinBalance(): number {
  return loadCoinWalletCache().snapshot.loveCoinBalance;
}

export function getCachedGrowthSnapshot(): GrowthSnapshot {
  return loadCoinWalletCache().snapshot;
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

export function growthTransactionsToEarnHistory(
  transactions: GrowthTransactionRecord[]
): import('../storage/rewardTypes').LoveCoinEarnRecord[] {
  return coinTransactionsToEarnHistory(transactions.map(growthTxToCoinRecord));
}

/**
 * LoveCoin: per-user wallet (user_wallets + user_coin_transactions).
 * Couple growth: heart, bond, exp, level on couple_wallets (unchanged Phase 1).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ENABLE_COIN_WALLET_CLOUD_SYNC } from '../constants/coinWalletSyncFlags';
import { localMigrationGrowthKey } from '../lib/growthIdempotency';
import { makeId } from '../lib/id';
import type { CoinEarnMeta } from '../storage/rewardTypes';
import {
  applyGrowthSnapshotToCache,
  getPendingUserCoinTransactions,
  isCoinWalletMigrationDone,
  loadCoinWalletCache,
  markUserCoinTransactionSynced,
  setCoinWalletMigrationDone,
  upsertPendingUserCoinTransaction,
} from '../storage/coinWalletCache';
import type {
  CoinTransactionRecord,
  CoinTxType,
  GrowthSnapshot,
  GrowthTransactionRecord,
  UserCoinTransactionRecord,
} from '../storage/coinWalletTypes';
import { userCoinTxToCoinRecord } from '../storage/coinWalletTypes';
import type { RpgReward } from '../storage/rpgLogic';
import type { RpgState } from '../storage/types';
import { canUseUserStorage } from '../storage/storageGuard';

const LOG = '[growth-sync]';
const TX_LIMIT = 100;

export type CoinWalletSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

type CoupleWalletRow = {
  couple_id: string;
  balance?: number;
  love_coin_balance?: number;
  heart_value?: number;
  bond_value?: number;
  exp?: number;
  level?: number;
  updated_at: string;
};

type UserWalletRow = {
  user_id: string;
  love_coin_balance: number;
  updated_at: string;
};

type UserCoinTxRow = {
  id: string;
  user_id: string;
  couple_id: string;
  amount: number;
  tx_type: CoinTxType;
  source: string;
  note: string | null;
  idempotency_key: string;
  created_at: string;
  metadata?: { emoji?: string };
};

type RpcUserCoinPayload = {
  wallet: UserWalletRow;
  transaction: UserCoinTxRow;
  duplicate?: boolean;
};

type RpcGrowthPayload = {
  wallet: CoupleWalletRow;
  transaction: GrowthTransactionRecord;
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
    canUseUserStorage(input.userId) &&
      input.configured &&
      input.userId &&
      input.coupleId &&
      input.online &&
      input.isFullyBound
  );
}

export function walletRowToCoupleGrowth(row: CoupleWalletRow | null): Pick<
  GrowthSnapshot,
  'heartValue' | 'bondValue' | 'exp' | 'level' | 'updatedAt'
> {
  if (!row) {
    const d = loadCoinWalletCache().snapshot;
    return {
      heartValue: d.heartValue,
      bondValue: d.bondValue,
      exp: d.exp,
      level: d.level,
      updatedAt: d.updatedAt,
    };
  }
  const exp = Number(row.exp) || 0;
  return {
    heartValue: Math.min(100, Math.max(0, Number(row.heart_value) || 50)),
    bondValue: Math.min(100, Math.max(0, Number(row.bond_value) || 60)),
    exp: Math.max(0, Math.floor(exp)),
    level: Math.max(1, Number(row.level) || Math.floor(exp / 100) + 1),
    updatedAt: row.updated_at ?? null,
  };
}

function rowToUserCoinRecord(row: UserCoinTxRow, emoji?: string | null): UserCoinTransactionRecord {
  const metaEmoji =
    emoji ??
    (row.metadata && typeof row.metadata === 'object' && 'emoji' in row.metadata
      ? String((row.metadata as { emoji?: string }).emoji ?? '')
      : null);
  return {
    id: row.id,
    userId: row.user_id,
    coupleId: row.couple_id,
    amount: row.amount,
    txType: row.tx_type,
    source: row.source,
    note: row.note,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    syncPending: false,
    emoji: metaEmoji || null,
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

export async function pullUserCoinFromRemote(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string
): Promise<{ balance: number; transactions: UserCoinTransactionRecord[] }> {
  const { data: wallet, error: wErr } = await supabase
    .from('user_wallets')
    .select('user_id, love_coin_balance, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (wErr) throw wErr;

  const { data: txs, error: tErr } = await supabase
    .from('user_coin_transactions')
    .select(
      'id, user_id, couple_id, amount, tx_type, source, note, idempotency_key, created_at, metadata'
    )
    .eq('user_id', userId)
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(TX_LIMIT);

  if (tErr) throw tErr;

  const balance = wallet
    ? Math.max(0, Math.floor(Number((wallet as UserWalletRow).love_coin_balance) || 0))
    : 0;
  const transactions = ((txs ?? []) as UserCoinTxRow[]).map((r) => rowToUserCoinRecord(r));

  return { balance, transactions };
}

export async function pullCoupleGrowthFromRemote(
  supabase: SupabaseClient,
  coupleId: string
): Promise<Pick<GrowthSnapshot, 'heartValue' | 'bondValue' | 'exp' | 'level' | 'updatedAt'>> {
  const { data: wallet, error } = await supabase
    .from('couple_wallets')
    .select('couple_id, heart_value, bond_value, exp, level, updated_at')
    .eq('couple_id', coupleId)
    .maybeSingle();

  if (error) throw error;
  return walletRowToCoupleGrowth(wallet as CoupleWalletRow | null);
}

export async function pullGrowthFromRemote(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string
): Promise<{ snapshot: GrowthSnapshot; transactions: UserCoinTransactionRecord[] }> {
  const [coin, coupleGrowth] = await Promise.all([
    pullUserCoinFromRemote(supabase, userId, coupleId),
    pullCoupleGrowthFromRemote(supabase, coupleId),
  ]);

  const snapshot: GrowthSnapshot = {
    loveCoinBalance: coin.balance,
    ...coupleGrowth,
    updatedAt: coin.transactions[0]?.createdAt ?? coupleGrowth.updatedAt,
  };

  applyGrowthSnapshotToCache(userId, coupleId, snapshot, coin.transactions);
  return { snapshot, transactions: coin.transactions };
}

/** @deprecated */
export async function pullCoinWalletFromRemote(
  supabase: SupabaseClient,
  coupleId: string,
  userId?: string | null
): Promise<{ balance: number; transactions: CoinTransactionRecord[] }> {
  const uid = userId ?? '';
  if (!uid) {
    return { balance: 0, transactions: [] };
  }
  const { snapshot, transactions } = await pullGrowthFromRemote(supabase, uid, coupleId);
  return {
    balance: snapshot.loveCoinBalance,
    transactions: transactions.map(userCoinTxToCoinRecord),
  };
}

export type PostUserCoinInput = {
  userId: string;
  coupleId: string;
  amount: number;
  txType: CoinTxType;
  source: string;
  idempotencyKey: string;
  note?: string;
  emoji?: string;
};

export async function postUserCoinTransactionRemote(
  supabase: SupabaseClient,
  input: PostUserCoinInput
): Promise<{ balance: number; transaction: UserCoinTransactionRecord }> {
  const { data, error } = await supabase.rpc('lovequest_post_user_coin_transaction', {
    p_user_id: input.userId,
    p_couple_id: input.coupleId,
    p_amount: input.amount,
    p_tx_type: input.txType,
    p_source: input.source,
    p_idempotency_key: input.idempotencyKey,
    p_note: input.note ?? null,
    p_metadata: input.emoji ? { emoji: input.emoji } : {},
  });

  if (error) {
    if (error.message?.includes('insufficient_balance')) {
      throw new Error('insufficient_balance');
    }
    throw error;
  }

  const payload = data as RpcUserCoinPayload;
  const wallet = payload.wallet;
  const transaction = rowToUserCoinRecord(payload.transaction, input.emoji);
  return {
    balance: Math.max(0, Math.floor(Number(wallet.love_coin_balance) || 0)),
    transaction,
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

export async function postCoupleGrowthEventRemote(
  supabase: SupabaseClient,
  input: PostGrowthEventInput
): Promise<Pick<GrowthSnapshot, 'heartValue' | 'bondValue' | 'exp' | 'level' | 'updatedAt'>> {
  const { data, error } = await supabase.rpc('lovequest_post_growth_event', {
    p_couple_id: input.coupleId,
    p_user_id: input.userId,
    p_tx_type: input.txType,
    p_source: input.source,
    p_idempotency_key: input.idempotencyKey,
    p_note: input.note ?? null,
    p_love_coin_delta: 0,
    p_heart_delta: input.heartDelta ?? 0,
    p_bond_delta: input.bondDelta ?? 0,
    p_exp_delta: input.expDelta ?? 0,
    p_metadata: {},
  });

  if (error) throw error;

  const payload = data as RpcGrowthPayload;
  return walletRowToCoupleGrowth(payload.wallet);
}

export async function pushPendingUserCoinTransactions(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string
): Promise<void> {
  const pending = getPendingUserCoinTransactions();
  for (const tx of pending) {
    if (tx.userId && tx.userId !== userId) continue;
    try {
      const { transaction } = await postUserCoinTransactionRemote(supabase, {
        userId,
        coupleId,
        amount: tx.amount,
        txType: tx.txType,
        source: tx.source,
        idempotencyKey: tx.idempotencyKey,
        note: tx.note ?? undefined,
        emoji: tx.emoji ?? undefined,
      });
      markUserCoinTransactionSynced(tx.idempotencyKey, transaction.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`${LOG} push user coin failed ${tx.idempotencyKey}:`, msg);
    }
  }
}

/** @deprecated */
export const pushPendingGrowthTransactions = pushPendingUserCoinTransactions;

export async function migrateLocalGrowthIfNeeded(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string | null,
  localRpg: Pick<RpgState, 'loveCoins' | 'heartPoints' | 'compatibility' | 'xp'>
): Promise<void> {
  if (!userId) return;
  if (isCoinWalletMigrationDone(userId, coupleId)) return;

  const { balance: remoteCoin, transactions } = await pullUserCoinFromRemote(
    supabase,
    userId,
    coupleId
  );
  const coupleGrowth = await pullCoupleGrowthFromRemote(supabase, coupleId);

  const hasCloudCoin = transactions.length > 0 || remoteCoin > 0;
  const hasCloudGrowth =
    coupleGrowth.exp > 0 ||
    coupleGrowth.heartValue !== 50 ||
    coupleGrowth.bondValue !== 60;

  if (hasCloudCoin && hasCloudGrowth) {
    setCoinWalletMigrationDone(userId, coupleId);
    return;
  }

  const hasLocalCoin = localRpg.loveCoins > 0;
  const hasLocalGrowth =
    localRpg.heartPoints !== 50 ||
    localRpg.compatibility !== 60 ||
    localRpg.xp > 0;

  if (!hasLocalCoin && !hasLocalGrowth) {
    setCoinWalletMigrationDone(userId, coupleId);
    return;
  }

  const key = localMigrationGrowthKey(userId, coupleId);
  try {
    if (!hasCloudCoin && hasLocalCoin) {
      await supabase.rpc('lovequest_init_user_coin_from_local', {
        p_user_id: userId,
        p_couple_id: coupleId,
        p_love_coin: Math.max(0, Math.floor(localRpg.loveCoins)),
        p_idempotency_key: `${key}:coin`,
      });
    }

    if (!hasCloudGrowth && hasLocalGrowth) {
      const { error } = await supabase.rpc('lovequest_init_growth_from_local', {
        p_couple_id: coupleId,
        p_user_id: userId,
        p_love_coin: 0,
        p_heart: Math.min(100, Math.max(0, Math.floor(localRpg.heartPoints))),
        p_bond: Math.min(100, Math.max(0, Math.floor(localRpg.compatibility))),
        p_exp: Math.max(0, Math.floor(localRpg.xp)),
        p_idempotency_key: `${key}:growth`,
      });
      if (error) throw error;
    }

    setCoinWalletMigrationDone(userId, coupleId);
    await pullGrowthFromRemote(supabase, userId, coupleId);
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
  const loveCoinDelta = input.loveCoinDelta ?? 0;
  const heartDelta = input.heartDelta ?? 0;
  const bondDelta = input.bondDelta ?? 0;
  const expDelta = input.expDelta ?? 0;
  const userId = input.userId;

  const cache = loadCoinWalletCache();
  let snapshot = { ...cache.snapshot };

  const coinKey =
    loveCoinDelta !== 0 ? `${input.idempotencyKey}:coin` : input.idempotencyKey;

  if (loveCoinDelta !== 0 && userId) {
    const pending: UserCoinTransactionRecord = {
      id: makeId(),
      userId,
      coupleId: input.coupleId,
      amount: loveCoinDelta,
      txType: input.txType,
      source: input.source,
      note: note ?? null,
      idempotencyKey: coinKey,
      createdAt: new Date().toISOString(),
      syncPending: true,
      emoji: emoji ?? null,
    };
    const updated = upsertPendingUserCoinTransaction(pending);
    snapshot = updated.snapshot;
  }

  const hasCoupleGrowth = heartDelta !== 0 || bondDelta !== 0 || expDelta !== 0;

  if (!canSync || !supabase) {
    if (hasCoupleGrowth) {
      snapshot = {
        ...snapshot,
        heartValue: Math.min(100, Math.max(0, snapshot.heartValue + heartDelta)),
        bondValue: Math.min(100, Math.max(0, snapshot.bondValue + bondDelta)),
        exp: Math.max(0, snapshot.exp + expDelta),
      };
      snapshot.level = Math.max(1, Math.floor(snapshot.exp / 100) + 1);
    }
    return { ok: true, snapshot, synced: false };
  }

  if (!userId && loveCoinDelta !== 0) {
    return { ok: false, error: 'missing_user_id' };
  }

  const growthKey =
    hasCoupleGrowth ? `${input.idempotencyKey}:growth` : input.idempotencyKey;

  try {
    if (loveCoinDelta !== 0 && userId) {
      const { balance, transaction } = await postUserCoinTransactionRemote(supabase, {
        userId,
        coupleId: input.coupleId,
        amount: loveCoinDelta,
        txType: input.txType,
        source: input.source,
        idempotencyKey: coinKey,
        note,
        emoji,
      });
      markUserCoinTransactionSynced(coinKey, transaction.id);
      snapshot.loveCoinBalance = balance;
    }

    if (hasCoupleGrowth) {
      const couplePart = await postCoupleGrowthEventRemote(supabase, {
        ...input,
        idempotencyKey: growthKey,
        loveCoinDelta: 0,
        heartDelta,
        bondDelta,
        expDelta,
        note,
        emoji,
      });
      snapshot = { ...snapshot, ...couplePart };
    }

    const pulled = await pullGrowthFromRemote(supabase, userId!, input.coupleId);
    return { ok: true, snapshot: pulled.snapshot, synced: true };
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
  transactions: UserCoinTransactionRecord[]
): import('../storage/rewardTypes').LoveCoinEarnRecord[] {
  return coinTransactionsToEarnHistory(transactions.map(userCoinTxToCoinRecord));
}

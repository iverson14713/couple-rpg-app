import type { OwnedCoupon, RewardCardStatus } from '../storage/rewardTypes';

/** UI / 文件用別名（DB 仍為 redeemed | used | completed | cancelled） */
export type RewardCardStatusAlias = 'active' | 'in_use' | 'completed' | 'cancelled';

const STATUS_ALIAS_TO_STORE: Record<RewardCardStatusAlias, RewardCardStatus> = {
  active: 'redeemed',
  in_use: 'used',
  completed: 'completed',
  cancelled: 'cancelled',
};

const STORE_TO_ALIAS: Record<RewardCardStatus, RewardCardStatusAlias> = {
  redeemed: 'active',
  used: 'in_use',
  completed: 'completed',
  cancelled: 'cancelled',
};

export function statusToStoreStatus(raw: string | undefined | null): RewardCardStatus {
  const s = String(raw ?? '').trim();
  if (s in STATUS_ALIAS_TO_STORE) return STATUS_ALIAS_TO_STORE[s as RewardCardStatusAlias];
  if (s === 'redeemed' || s === 'used' || s === 'completed' || s === 'cancelled') {
    return s as RewardCardStatus;
  }
  return 'redeemed';
}

export function storeStatusToAlias(status: RewardCardStatus): RewardCardStatusAlias {
  return STORE_TO_ALIAS[status] ?? 'active';
}

/** 正規化卡券：補 owner / completed_by，修正狀態字串 */
export function normalizeOwnedCoupon(raw: OwnedCoupon): OwnedCoupon {
  const status = statusToStoreStatus(raw.status as string);
  const redeemedBy = trimUuid(raw.redeemedBy);
  const ownerUserId = trimUuid(raw.ownerUserId) ?? redeemedBy;
  const usedBy = trimUuid(raw.usedBy);
  const completedByUserId = trimUuid(raw.completedByUserId);
  const targetUser = trimUuid(raw.targetUser);

  let usedAt = raw.usedAt ?? null;
  let completedAt = raw.completedAt ?? null;
  let usedByOut = usedBy;
  let completedByOut = completedByUserId;

  if (status === 'redeemed') {
    usedAt = null;
    completedAt = null;
    usedByOut = null;
    completedByOut = null;
  } else if (status === 'used') {
    completedAt = null;
    completedByOut = null;
  } else if (status === 'completed') {
    if (!completedByOut && targetUser) completedByOut = targetUser;
    if (!completedByOut && usedByOut) completedByOut = usedByOut;
  }

  return {
    ...raw,
    status,
    redeemedBy,
    ownerUserId,
    usedBy: usedByOut,
    completedByUserId: completedByOut,
    targetUser,
    usedAt,
    completedAt,
  };
}

function trimUuid(v: string | null | undefined): string | null {
  const t = String(v ?? '').trim();
  return t || null;
}

export function couponActorIds(c: OwnedCoupon): {
  redeemedBy: string | null;
  ownerUserId: string | null;
  usedBy: string | null;
  completedBy: string | null;
} {
  const n = normalizeOwnedCoupon(c);
  return {
    redeemedBy: n.redeemedBy,
    ownerUserId: n.ownerUserId,
    usedBy: n.usedBy,
    completedBy: n.completedByUserId,
  };
}

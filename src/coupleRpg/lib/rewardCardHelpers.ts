import { isCustomRewardCardId } from './customRewardCard';
import type { OwnedCoupon, RewardShopCategory } from '../storage/rewardTypes';
import type { RewardCardStatus } from '../storage/rewardTypes';

export { resolveDisplayNameForUserId as displayNameForUserId } from './coupleDisplayNames';
export type { UserDisplayNameContext } from './coupleDisplayNames';

/** 需由對方標記完成的卡券類型（商城預設） */
export function needsPartnerCompletion(category: RewardShopCategory, itemId: string): boolean {
  if (isCustomRewardCardId(itemId)) return false;
  return category === 'massage' || category === 'date' || category === 'flirt';
}

/** 此張卡券是否需對方完成 */
export function couponNeedsPartnerCompletion(coupon: Pick<OwnedCoupon, 'isCustom' | 'needsPartnerComplete' | 'category' | 'itemId'>): boolean {
  if (coupon.isCustom) return Boolean(coupon.needsPartnerComplete);
  return needsPartnerCompletion(coupon.category, coupon.itemId);
}

export const REWARD_CARD_STATUS_LABEL: Record<RewardCardStatus, string> = {
  redeemed: '可使用',
  used: '使用中',
  completed: '已完成',
  cancelled: '已取消',
};

export const STATUS_PROGRESS: Record<RewardCardStatus, number> = {
  cancelled: -1,
  redeemed: 0,
  used: 1,
  completed: 2,
};

export function pickPreferredStatus(a: RewardCardStatus, b: RewardCardStatus): RewardCardStatus {
  return STATUS_PROGRESS[a] >= STATUS_PROGRESS[b] ? a : b;
}

export function formatRedeemFeedLine(actorName: string, cardTitle: string): string {
  return `${actorName} 兌換了「${cardTitle}」`;
}

export function formatUseFeedLine(actorName: string, cardTitle: string): string {
  return `${actorName} 使用了「${cardTitle}」`;
}

export function formatCompleteFeedLine(actorName: string, cardTitle: string): string {
  return `${actorName} 完成了「${cardTitle}」`;
}

export function canOwnerUseRewardCard(
  coupon: Pick<OwnedCoupon, 'status' | 'ownerUserId' | 'redeemedBy'>,
  currentUserId: string | null
): boolean {
  if (coupon.status !== 'redeemed' || !currentUserId) return false;
  const owner = coupon.ownerUserId ?? coupon.redeemedBy;
  return owner === currentUserId;
}

export function canOwnerCompleteRewardCard(
  coupon: Pick<OwnedCoupon, 'status' | 'ownerUserId' | 'redeemedBy'>,
  currentUserId: string | null
): boolean {
  if (coupon.status !== 'used' || !currentUserId) return false;
  const owner = coupon.ownerUserId ?? coupon.redeemedBy;
  return owner === currentUserId;
}

export function canOwnerCancelUseRewardCard(
  coupon: Pick<OwnedCoupon, 'status' | 'ownerUserId' | 'redeemedBy'>,
  currentUserId: string | null
): boolean {
  return canOwnerCompleteRewardCard(coupon, currentUserId);
}

/** @deprecated 個人卡券僅持有人可完成 */
export function canMarkRewardCardComplete(
  coupon: Pick<OwnedCoupon, 'status' | 'ownerUserId' | 'redeemedBy'>,
  currentUserId: string | null
): boolean {
  return canOwnerCompleteRewardCard(coupon, currentUserId);
}

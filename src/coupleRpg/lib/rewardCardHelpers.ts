import type { RewardShopCategory, ShopItemId } from '../storage/rewardTypes';
import type { RewardCardStatus } from '../storage/rewardTypes';

/** 需由對方標記完成的卡券類型 */
export function needsPartnerCompletion(category: RewardShopCategory, _itemId: ShopItemId): boolean {
  return category === 'massage' || category === 'date' || category === 'flirt';
}

export function displayNameForUserId(
  userId: string | null | undefined,
  currentUserId: string | null,
  myNickname: string,
  partnerNickname: string
): string {
  if (!userId) return '某人';
  if (currentUserId && userId === currentUserId) return myNickname.trim() || '我';
  return partnerNickname.trim() || '另一半';
}

export const REWARD_CARD_STATUS_LABEL: Record<RewardCardStatus, string> = {
  redeemed: '待使用',
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

export function formatUseFeedLine(
  actorName: string,
  cardTitle: string,
  towardPartner: boolean
): string {
  if (towardPartner) return `${actorName} 對你使用了「${cardTitle}」`;
  return `${actorName} 使用了「${cardTitle}」`;
}

export function formatCompleteFeedLine(actorName: string, cardTitle: string): string {
  return `${actorName} 完成了「${cardTitle}」`;
}

export function canMarkRewardCardComplete(
  coupon: { status: RewardCardStatus; targetUser: string | null; usedBy: string | null },
  currentUserId: string | null,
  category: RewardShopCategory,
  itemId: ShopItemId
): boolean {
  if (coupon.status !== 'used') return false;
  if (!needsPartnerCompletion(category, itemId)) return false;
  if (!currentUserId) return false;
  if (coupon.targetUser) return coupon.targetUser === currentUserId;
  return coupon.usedBy !== currentUserId;
}

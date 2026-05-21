import type { CustomRewardCardInput } from '../storage/rewardTypes';
import type { RewardShopCategory } from '../storage/rewardTypes';

export const CUSTOM_REWARD_CARD_PREFIX = 'custom:';

export const CUSTOM_REWARD_COST_MIN = 1;
export const CUSTOM_REWARD_COST_MAX = 500;
export const CUSTOM_REWARD_COST_DEFAULT = 30;

export function isCustomRewardCardId(itemId: string): boolean {
  return itemId.startsWith(CUSTOM_REWARD_CARD_PREFIX);
}

export function makeCustomRewardItemId(): string {
  return `${CUSTOM_REWARD_CARD_PREFIX}${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
}

export function normalizeCustomRewardInput(raw: Partial<CustomRewardCardInput>): CustomRewardCardInput | null {
  const title = String(raw.title ?? '').trim();
  if (!title || title.length > 40) return null;

  const description = String(raw.description ?? '').trim().slice(0, 120);
  const emoji = (String(raw.emoji ?? '🎫').trim() || '🎫').slice(0, 4);
  const category = (raw.category ?? 'date') as RewardShopCategory;
  const cost = Math.round(Number(raw.cost));
  if (!Number.isFinite(cost) || cost < CUSTOM_REWARD_COST_MIN || cost > CUSTOM_REWARD_COST_MAX) {
    return null;
  }

  const validCategories: RewardShopCategory[] = ['massage', 'royal', 'date', 'flirt'];
  if (!validCategories.includes(category)) return null;

  return {
    title,
    description: description || '自訂的情侶驚喜，記得兌現喔～',
    emoji,
    category,
    cost,
    needsPartnerComplete: Boolean(raw.needsPartnerComplete),
  };
}

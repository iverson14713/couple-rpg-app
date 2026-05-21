export type EarnSource =
  | 'housework'
  | 'task'
  | 'game'
  | 'date'
  | 'dinner'
  | 'anniversary'
  | 'login'
  | 'redeem';

export type RewardShopCategory = 'massage' | 'royal' | 'date' | 'flirt';

export type ShopItemId =
  | 'massage-shoulder'
  | 'massage-full'
  | 'royal-no-chores'
  | 'royal-dinner-pick'
  | 'royal-boss'
  | 'date-bubble-tea'
  | 'date-late-snack'
  | 'date-pick'
  | 'flirt-hug'
  | 'flirt-kiss'
  | 'flirt-coquettish'
  | 'flirt-obey';

export type ShopItem = {
  id: ShopItemId;
  category: RewardShopCategory;
  title: string;
  description: string;
  emoji: string;
  cost: number;
};

export type LoveCoinEarnRecord = {
  id: string;
  date: string;
  time: string;
  source: EarnSource;
  title: string;
  emoji: string;
  coins: number;
};

export type RewardCardStatus = 'redeemed' | 'used' | 'completed' | 'cancelled';

/** Pro：自訂卡券兌換輸入 */
export type CustomRewardCardInput = {
  title: string;
  description: string;
  emoji: string;
  category: RewardShopCategory;
  cost: number;
  /** 勾選時需對方標記完成 */
  needsPartnerComplete: boolean;
};

export type OwnedCoupon = {
  /** 本地 client id（與 Supabase client_id 對應） */
  id: string;
  remoteId?: string | null;
  /** 商城 id 或 custom-{uuid} */
  itemId: string;
  cardId: string;
  cardTitle: string;
  cardType: string;
  title: string;
  emoji: string;
  category: RewardShopCategory;
  cost: number;
  /** Pro 自訂卡券 */
  isCustom?: boolean;
  description?: string;
  needsPartnerComplete?: boolean;
  redeemedBy: string | null;
  usedBy: string | null;
  targetUser: string | null;
  redeemedAt: string;
  usedAt: string | null;
  completedAt: string | null;
  note: string | null;
  status: RewardCardStatus;
  /** 待同步到 Supabase */
  syncPending?: boolean;
  /** @deprecated 舊版欄位，載入時遷移 */
  acquiredAt?: string;
};

export type RewardsData = {
  earnHistory: LoveCoinEarnRecord[];
  coupons: OwnedCoupon[];
  todayEarnedDate: string;
  todayEarnedCoins: number;
};

export const DEFAULT_REWARDS_DATA = (): RewardsData => ({
  earnHistory: [],
  coupons: [],
  todayEarnedDate: '',
  todayEarnedCoins: 0,
});

export type CoinEarnMeta = {
  source: EarnSource;
  title: string;
  emoji: string;
};

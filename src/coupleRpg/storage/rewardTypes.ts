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

export type OwnedCoupon = {
  id: string;
  itemId: ShopItemId;
  title: string;
  emoji: string;
  category: RewardShopCategory;
  cost: number;
  acquiredAt: string;
  usedAt: string | null;
  status: 'active' | 'used';
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

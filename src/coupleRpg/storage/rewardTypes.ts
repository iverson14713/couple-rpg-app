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
  /** 本地 id（與 Supabase local_id 對應） */
  id: string;
  remoteId?: string | null;
  /** 雲端列 updated_at（合併用） */
  remoteUpdatedAt?: string;
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
  /** 兌換者 user id */
  redeemedBy: string | null;
  /** 持有者（通常 = 兌換者） */
  ownerUserId?: string | null;
  /** 按下「使用」者 */
  usedBy: string | null;
  /** 確認「完成」者 */
  completedByUserId?: string | null;
  /** @deprecated 伴侶完成流程的目標 user；新資料請用 completedByUserId */
  targetUser: string | null;
  redeemedAt: string;
  usedAt: string | null;
  completedAt: string | null;
  note: string | null;
  status: RewardCardStatus;
  /** 待同步到 Supabase */
  syncPending?: boolean;
  /** 最近一次雲端同步失敗訊息（仍保留本機卡券） */
  syncError?: string | null;
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

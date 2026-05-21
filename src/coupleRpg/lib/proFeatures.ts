import { isProUser, type UserPlan } from '../storage/planStore';

export { isCouplePro, isCoupleProSubscription } from '../services/couplePlanService';
export type { CouplePlanSnapshot, CoupleSubscriptionRow } from '../services/couplePlanService';

/** Pro 功能標記（第一版僅 UI，不阻擋使用） */
export type ProFeatureId =
  | 'ai_in_app'
  | 'important_dates_unlimited'
  | 'custom_reward_cards'
  | 'full_sync'
  | 'history_unlimited'
  | 'housework_advanced'
  | 'flirt_games_premium';

export const PRO_FEATURE_LABELS: Record<ProFeatureId, string> = {
  ai_in_app: 'AI App 內生成',
  important_dates_unlimited: '重要日子無上限',
  custom_reward_cards: '自訂卡券',
  full_sync: '完整情侶雲端同步',
  history_unlimited: '歷史紀錄無上限',
  housework_advanced: '進階家事統計',
  flirt_games_premium: '進階小遊戲題庫',
};

export type ProFeatureCheck = {
  feature: ProFeatureId;
  label: string;
  isPro: boolean;
  /** 第一版一律允許使用，僅供未來鎖定 */
  allowed: boolean;
  showProBadge: boolean;
};

/**
 * 檢查 Pro 功能狀態。MVP 階段 `allowed` 恆為 true，僅用於顯示 Pro 標籤。
 */
export function requireProFeature(
  feature: ProFeatureId,
  isProOrPlan?: boolean | UserPlan
): ProFeatureCheck {
  const isPro =
    typeof isProOrPlan === 'boolean'
      ? isProOrPlan
      : isProUser(isProOrPlan);
  return {
    feature,
    label: PRO_FEATURE_LABELS[feature],
    isPro,
    allowed: true,
    showProBadge: !isPro,
  };
}

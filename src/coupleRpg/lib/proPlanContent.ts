/** Pro 方案展示文案 */
export const PRO_PLAN_TITLE = 'LoveQuest Pro';
export const PRO_PLAN_TAGLINE = '一人升級，甜蜜共享';
export const PRO_PLAN_DESCRIPTION =
  '只要其中一位開通 Pro，同一個情侶空間的兩個人都能一起使用進階功能。';

/** @deprecated 使用 PRO_PLAN_TAGLINE */
export const PRO_PLAN_SUBTITLE = PRO_PLAN_TAGLINE;

export const PRO_BENEFIT_LINES = [
  '💞 一人升級，兩人共享 Pro',
  '☁️ 完整情侶雲端同步',
  '✨ AI 約會行程規劃',
  '🎁 AI 禮物建議',
  '💌 AI 情話 / 卡片文字',
  '🎂 重要日子無上限',
  '🎟️ 自訂獎勵卡券',
  '🎲 更多情侶小遊戲題庫',
  '📜 完整歷史紀錄',
  '🚫 無廣告',
] as const;

export const PRO_PRICE_MONTHLY = 'NT$50';
export const PRO_PRICE_YEARLY = 'NT$490';
export const PRO_PRICE_YEARLY_AVG = '平均每月約 NT$41';

export const PRO_BTN_MONTHLY = '訂閱月費方案';
export const PRO_BTN_YEARLY = '訂閱年費方案';
export const PRO_BTN_RESTORE = '恢復購買';
export const PRO_BTN_LATER = '稍後再說';

export const PRO_LEGAL_AUTO_RENEW =
  '訂閱將自動續訂，除非在目前訂閱期結束前至少 24 小時於 Apple ID 設定中取消。';

export const PRO_LEGAL_MANAGE = '可隨時在 iPhone「設定 → Apple ID → 訂閱項目」管理或取消。';

export const PRO_IAP_IOS_ONLY = '目前僅 iOS App 支援 App Store 訂閱購買。';

export const PRO_ACTIVE_TITLE = '你們已解鎖 Pro';
export const PRO_ACTIVE_DESCRIPTION =
  '同一個情侶空間的兩個人都可以使用進階功能。';

export const PRO_CONTEXT_BOUND = '你們的情侶空間將一起升級 Pro';
export const PRO_CONTEXT_UNBOUND = '建議先完成情侶綁定，訂閱後兩人即可共享 Pro';
export const PRO_ACTIVE_CONTEXT_BOUND = '你們的情侶空間已共享 Pro';

export function getProCoupleContextMessage(isFullyBound: boolean): string {
  return isFullyBound ? PRO_CONTEXT_BOUND : PRO_CONTEXT_UNBOUND;
}

export const PRO_TOAST_PURCHASE_OK = '已成功開通 LoveQuest Pro';
export const PRO_TOAST_RESTORE_OK = '已恢復 LoveQuest Pro 訂閱';
export const PRO_TOAST_RESTORE_NONE = '尚未找到有效訂閱';
export const PRO_TOAST_PURCHASE_FAIL = '無法完成購買，請稍後再試';
export const PRO_TOAST_RESTORE_FAIL = '恢復購買失敗，請稍後再試';

export const PRO_TOAST_COUPLE = PRO_TOAST_PURCHASE_OK;
export const PRO_TOAST_LOCAL = '已在本機開通 Pro，綁定另一半後可雲端共享';
export const PRO_TOAST_COUPLE_FREE = '已將方案切回 Free';
export const PRO_TOAST_SYNC_FAILED = '無法同步方案至雲端，請稍後再試';

/** @deprecated 開發測試用 */
export const PRO_TOAST_ACTIVATED = PRO_TOAST_PURCHASE_OK;

/** Pro 方案展示文案（前端 UI，尚未接金流） */
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

export const PRO_PRICE_MONTHLY = 'NT$49';
export const PRO_PRICE_YEARLY = 'NT$399';
export const PRO_PRICE_YEARLY_AVG = '平均每月 NT$33';

export const PRO_BTN_PRIMARY = '開始甜蜜共享';
export const PRO_BTN_LATER = '先看看免費版';

export const PRO_ACTIVE_TITLE = '你們已解鎖 Pro';
export const PRO_ACTIVE_DESCRIPTION =
  '同一個情侶空間的兩個人都可以使用進階功能。';

export const PRO_CONTEXT_BOUND = '你們的情侶空間將一起升級 Pro';
export const PRO_CONTEXT_UNBOUND = '升級後可在綁定另一半時共享 Pro';
export const PRO_ACTIVE_CONTEXT_BOUND = '你們的情侶空間已共享 Pro';

export function getProCoupleContextMessage(isFullyBound: boolean): string {
  return isFullyBound ? PRO_CONTEXT_BOUND : PRO_CONTEXT_UNBOUND;
}

/** @deprecated 使用 PRO_TOAST_COUPLE 或 PRO_TOAST_LOCAL */
export const PRO_TOAST_ACTIVATED = '已切換為 Pro 體驗模式';

export const PRO_TOAST_COUPLE = '已為你們的情侶空間開通 Pro 體驗';

export const PRO_TOAST_LOCAL = '目前是本機 Pro 體驗，綁定另一半後可共享 Pro';

export const PRO_TOAST_COUPLE_FREE = '已將情侶空間方案切回 Free（測試）';

export const PRO_TOAST_SYNC_FAILED = '無法同步 Pro 至雲端，本機狀態未變更';

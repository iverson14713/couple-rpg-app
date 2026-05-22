/** 免費版各類 AI 僅保留最近 1 筆；Pro 可保留多筆歷史（本機） */
export const AI_RECORD_HISTORY_CAP_PRO = 30;

/** 未收藏紀錄保留天數（本機自動清理） */
export const AI_RECORD_RETENTION_DAYS = 90;
export const AI_RECORD_RETENTION_MS = AI_RECORD_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** 收合時預設顯示筆數 */
export const AI_RECORD_COLLAPSED_PREVIEW = 2;

export const AI_RECORDS_CHANGED_EVENT = 'lovequest:ai-records-changed';

export const AI_RECORD_RETENTION_HINT =
  '未收藏的 AI 紀錄會保留 90 天，已收藏紀錄會永久保留，直到手動刪除。';

export function dispatchAiRecordsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_RECORDS_CHANGED_EVENT));
  }
}

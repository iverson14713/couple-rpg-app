/** 免費版各類 AI 僅保留最近 1 筆；Pro 可保留多筆歷史（本機） */
export const AI_RECORD_HISTORY_CAP_PRO = 30;

export const AI_RECORDS_CHANGED_EVENT = 'lovequest:ai-records-changed';

export function dispatchAiRecordsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_RECORDS_CHANGED_EVENT));
  }
}

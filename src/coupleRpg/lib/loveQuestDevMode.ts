/**
 * LoveQuest 開發／除錯 UI（測試推播、Auth Debug 等）。
 * - Vite dev server：一律開啟
 * - Capacitor 本機包：需 VITE_LOVEQUEST_DEBUG_NOTIFICATIONS=true（見 .env.capacitor；上架前請改 false）
 */
export function isLoveQuestDevMode(): boolean {
  if (import.meta.env.DEV) return true;
  return import.meta.env.VITE_LOVEQUEST_DEBUG_NOTIFICATIONS === 'true';
}

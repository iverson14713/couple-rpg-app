/**
 * LoveQuest 開發／除錯 UI（測試推播、Auth Debug 等）。
 * 僅在 Vite dev server（import.meta.env.DEV）且 VITE_LOVEQUEST_DEBUG_NOTIFICATIONS=true。
 * production / build:ios / capacitor release（PROD）永不顯示。
 */
export function isLoveQuestDevMode(): boolean {
  if (import.meta.env.PROD) return false;
  return (
    import.meta.env.DEV && import.meta.env.VITE_LOVEQUEST_DEBUG_NOTIFICATIONS === 'true'
  );
}

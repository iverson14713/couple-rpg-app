/** 開發／除錯：Vite dev，或 Capacitor 本機包且 VITE_LOVEQUEST_DEBUG_NOTIFICATIONS=true（上架前請改 false） */
export function isLoveQuestNotificationDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  return import.meta.env.VITE_LOVEQUEST_DEBUG_NOTIFICATIONS === 'true';
}

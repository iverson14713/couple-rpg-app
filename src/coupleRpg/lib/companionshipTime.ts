export function formatCompanionshipTimeAgo(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '剛剛';
  const diffSec = Math.max(0, Math.floor((now - t) / 1000));
  if (diffSec < 60) return '剛剛';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function lightCompanionshipHaptic(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(14);
    }
  } catch {
    /* ignore */
  }
}

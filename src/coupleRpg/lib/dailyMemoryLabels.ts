import type { DailyMemorySourceType } from '../storage/dailyNotesTypes';

const SOURCE_LABELS: Record<string, string> = {
  love_task: '📍 今日戀愛任務',
  anniversary: '🎂 交往紀念日',
  ai_date: '💝 AI 約會',
  mini_game: '🎲 情侶小遊戲',
  housework: '🧹 家事',
  dinner: '🍽️ 晚餐',
  reward: '🎁 獎勵',
  custom: '💕 小回憶',
};

export function dailyMemorySourceLabel(
  sourceType: DailyMemorySourceType | string | null | undefined,
  sourceMeta?: Record<string, unknown> | null
): string | null {
  if (!sourceType) return null;
  if (sourceType === 'anniversary' && typeof sourceMeta?.name === 'string' && sourceMeta.name.trim()) {
    return `🎂 ${sourceMeta.name.trim()}`;
  }
  return SOURCE_LABELS[sourceType] ?? null;
}

/** Share card source line (no emoji, IG-friendly). */
export function dailyMemoryShareSourceLabel(
  sourceType: DailyMemorySourceType | string | null | undefined,
  sourceMeta?: Record<string, unknown> | null
): string | null {
  if (!sourceType) return null;
  if (sourceType === 'love_task') return '今日任務';
  if (sourceType === 'ai_date') return 'AI 約會';
  if (sourceType === 'anniversary') {
    if (typeof sourceMeta?.name === 'string' && sourceMeta.name.trim()) {
      return sourceMeta.name.trim();
    }
    return '紀念日';
  }
  const withEmoji = dailyMemorySourceLabel(sourceType, sourceMeta);
  return withEmoji ? withEmoji.replace(/^[^\s]+\s/, '') : null;
}

/** 2026 / 07 / 04 */
export function formatMemoryDisplayDate(noteDate: string): string {
  const [y, m, d] = noteDate.split('-');
  if (!y || !m || !d) return noteDate;
  return `${y} / ${m} / ${d}`;
}

/** 2026/07/04 */
export function formatMemoryCreatedDate(noteDate: string): string {
  const [y, m, d] = noteDate.split('-');
  if (!y || !m || !d) return noteDate;
  return `${y}/${m}/${d}`;
}

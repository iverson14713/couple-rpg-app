/** 分類對應 Emoji（結果卡與輪播預覽） */
export const CUSTOM_CATEGORY_EMOJI: Record<string, string> = {
  甜蜜: '❤️',
  真心話: '🤭',
  挑戰: '🔥',
  互動: '🤗',
  約會: '💑',
};

export function emojiForCustomCategory(category: string): string {
  return CUSTOM_CATEGORY_EMOJI[category] ?? '💌';
}

/** 抽題輪播預覽（第二階段） */
export const CUSTOM_DRAW_CAROUSEL_PREVIEWS = [
  { emoji: '❤️', label: '甜蜜' },
  { emoji: '🤭', label: '真心話' },
  { emoji: '🔥', label: '挑戰' },
  { emoji: '🤗', label: '互動' },
] as const;

const MOOD_LINES = [
  '今天勇敢說出口吧 ❤️',
  '完成後記得抱一下。',
  '今天適合增加戀愛濃度。',
  '相信對方一定會偷偷開心。',
  '一句話，也能讓今天變得更甜。',
] as const;

export function pickCustomDrawMoodLine(): string {
  return MOOD_LINES[Math.floor(Math.random() * MOOD_LINES.length)]!;
}

export function triggerCustomDrawHaptic(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 24, 10]);
    }
  } catch {
    /* ignore */
  }
}

export const CUSTOM_DRAW_TIMING = {
  flipMs: 280,
  shuffleMs: 800,
  carouselMs: 800,
  revealMs: 400,
  carouselTickMs: 160,
} as const;

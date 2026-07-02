export const HEART_CIRCLE_WIN_QUOTES = [
  '默契不只靠心動，也靠一點策略',
  '這局是愛情，也是戰爭',
  '輸了沒關係，抱一下再來一局',
  '今天的圈圈王誕生了',
  '看似甜蜜，其實超燒腦',
] as const;

export function pickHeartCircleQuote(): string {
  const idx = Math.floor(Math.random() * HEART_CIRCLE_WIN_QUOTES.length);
  return HEART_CIRCLE_WIN_QUOTES[idx] ?? HEART_CIRCLE_WIN_QUOTES[0];
}

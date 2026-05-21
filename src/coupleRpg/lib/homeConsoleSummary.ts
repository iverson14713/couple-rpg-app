/** 首頁總控台收合列：圖案化數值摘要 */
export function formatHomeConsoleCompactSummary(
  coupleHeaderLine: string,
  heart: number,
  compatibility: number,
  level: number,
  todayCoinEarned: number
): string {
  return `${coupleHeaderLine}　❤️ ${heart}｜🤝 ${compatibility}%｜✨ Lv.${level}｜🪙 +${todayCoinEarned}`;
}

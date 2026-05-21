/** 依餐點名稱回傳合適 emoji（無匹配則餐具）。 */
export function foodEmojiForLabel(label: string): string {
  const t = label.trim();
  if (!t) return '🍽️';
  const rules: [RegExp, string][] = [
    [/火鍋|麻辣|涮/i, '🍲'],
    [/披薩|pizza/i, '🍕'],
    [/壽司|日式|生魚/i, '🍣'],
    [/拉麵|麵|烏龍|米粉/i, '🍜'],
    [/漢堡|堡/i, '🍔'],
    [/炸雞|雞排|烤雞/i, '🍗'],
    [/牛排|牛/i, '🥩'],
    [/沙拉|蔬/i, '🥗'],
    [/便當|飯/i, '🍱'],
    [/粥|滷/i, '🥘'],
    [/燒烤|烤肉|串/i, '🍢'],
    [/泰|咖哩/i, '🍛'],
    [/咖啡|早午餐|brunch/i, '☕'],
    [/甜|蛋糕|點心|冰/i, '🍰'],
    [/在家|開伙|自煮|煮/i, '🏠'],
    [/外送|外賣/i, '🛵'],
    [/超商|便利/i, '🏪'],
  ];
  for (const [re, em] of rules) {
    if (re.test(t)) return em;
  }
  return '🍽️';
}

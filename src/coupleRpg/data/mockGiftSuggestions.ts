import { makeId } from '../lib/id';
import type { GiftPreferences, GiftSuggestion } from '../storage/anniversaryTypes';

const GIFT_TEMPLATES = [
  {
    name: '客製化情侶飾品',
    budget: '約 $800–2500',
    why: '可刻字紀念日期，日常佩戴會想起彼此。',
    prep: '提前 5–7 天下單，確認尺寸與刻字內容。',
  },
  {
    name: '質感香氛 / 蠟燭組',
    budget: '約 $600–1800',
    why: '營造居家浪漫氛圍，適合一起放鬆的晚上。',
    prep: '選對方偏好的香調，避免太濃的味型。',
  },
  {
    name: '手作體驗券（陶藝 / 甜點）',
    budget: '約 $1200–3000',
    why: '一起完成作品，比單純吃飯更有共同回憶。',
    prep: '預約週末時段，確認是否需自備衣物。',
  },
  {
    name: '相簿 + 洗照片組合',
    budget: '約 $400–1200',
    why: '把合照變成實體回憶，適合交往紀念日。',
    prep: '先整理 20–30 張照片，選統一色調排版。',
  },
  {
    name: '對方清單上的「一直想要」小物',
    budget: '依預算彈性',
    why: '精準打中需求，比驚喜盲盒更實用。',
    prep: '回想對方最近提過 3 次以上的東西，低調確認尺寸。',
  },
  {
    name: '驚喜野餐 / 外帶美食籃',
    budget: '約 $500–1500',
    why: '戶外或客廳野餐，輕鬆又有儀式感。',
    prep: '前一天準備食物與野餐墊，查好天氣備案。',
  },
  {
    name: '訂閱式鮮花 / 咖啡',
    budget: '約 $900–2000',
    why: '延續驚喜感，紀念日後的幾週也會想起你。',
    prep: '確認配送週期與對方收件地址。',
  },
];

export function mockGiftSuggestions(prefs: GiftPreferences, count = 4): GiftSuggestion[] {
  const color = prefs.favoriteColor.trim() || '暖色';
  const interests = prefs.interests.trim() || '一起放鬆、美食';
  const budget = prefs.budget.trim() || '中等';
  const dislikes = prefs.dislikes.trim().toLowerCase();

  const scored = GIFT_TEMPLATES.map((t, i) => {
    let score = i;
    if (dislikes && t.name.toLowerCase().includes(dislikes)) score -= 10;
    if (interests.includes('手作') && t.name.includes('手作')) score += 5;
    if (interests.includes('吃') && (t.name.includes('野餐') || t.name.includes('美食'))) score += 4;
    if (budget.includes('經濟') && t.budget.includes('400')) score += 3;
    return { t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, Math.min(count, scored.length));

  return picked.map(({ t }) => ({
    id: makeId(),
    name: t.name,
    budgetRange: t.budget.replace('依預算彈性', budget || '依預算彈性'),
    whyFit: `${t.why}（呼應興趣：${interests}；色系偏好：${color}）`,
    prepTip: t.prep,
  }));
}

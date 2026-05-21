import type { ImportantDateEvent } from './importantDateEvents';
import { formatYmdLabel } from './importantDateEvents';

export type AiBudgetChoice = 'low' | 'mid' | 'high' | 'custom';
export type AiStyleChoice = 'romantic' | 'warm' | 'fun' | 'surprise' | 'lowkey' | 'ritual';

export const AI_BUDGET_OPTIONS: { id: AiBudgetChoice; label: string; hint: string }[] = [
  { id: 'low', label: '低預算', hint: '用心但不破費' },
  { id: 'mid', label: '中預算', hint: '質感約會＋體驗' },
  { id: 'high', label: '高預算', hint: '儀式感與驚喜' },
  { id: 'custom', label: '自訂金額', hint: '自行填寫預算' },
];

export const AI_STYLE_OPTIONS: { id: AiStyleChoice; label: string; emoji: string }[] = [
  { id: 'romantic', label: '浪漫', emoji: '💕' },
  { id: 'warm', label: '溫馨', emoji: '🤗' },
  { id: 'fun', label: '有趣', emoji: '😄' },
  { id: 'surprise', label: '驚喜', emoji: '🎉' },
  { id: 'lowkey', label: '低調', emoji: '🌿' },
  { id: 'ritual', label: '儀式感', emoji: '✨' },
];

export const STATIC_GIFT_IDEAS = {
  low: {
    title: '低預算',
    emoji: '💝',
    items: ['手寫卡片', '對方喜歡的飲料甜點', '自製照片回憶卡', '一起散步或夜景'],
  },
  mid: {
    title: '中預算',
    emoji: '🎁',
    items: ['香氛', '飾品', '餐廳約會', '小旅行', '對方常用的小物升級'],
  },
  high: {
    title: '高預算',
    emoji: '💎',
    items: ['精品小物', '住宿旅行', '高級餐廳', '對方長期想買的東西'],
  },
  experience: {
    title: '體驗型',
    emoji: '🎬',
    items: ['電影', '手作課', '陶藝', '烘焙', '展覽', '一日小旅行'],
  },
} as const;

export type AiPromptInput = {
  event: ImportantDateEvent;
  budget: AiBudgetChoice;
  customBudget?: string;
  style: AiStyleChoice;
  partnerPrefs: string;
};

function budgetLine(budget: AiBudgetChoice, custom?: string): string {
  if (budget === 'custom' && custom?.trim()) return `自訂預算：${custom.trim()}`;
  const map: Record<AiBudgetChoice, string> = {
    low: '低預算（用心、不破費）',
    mid: '中預算（質感約會與體驗）',
    high: '高預算（儀式感與驚喜）',
    custom: '自訂預算（未填寫）',
  };
  return map[budget];
}

function styleLine(style: AiStyleChoice): string {
  const o = AI_STYLE_OPTIONS.find((s) => s.id === style);
  return o ? `${o.emoji} ${o.label}` : style;
}

function daysLine(event: ImportantDateEvent): string {
  if (event.isToday) return '就是今天';
  if (event.status === 'past') return `剛過 ${event.daysSince} 天（下次還有 ${event.daysUntil} 天）`;
  return `還有 ${event.daysUntil} 天`;
}

export function buildImportantDateAiPrompt(input: AiPromptInput): string {
  const { event, budget, customBudget, style, partnerPrefs } = input;
  const prefs = partnerPrefs.trim() || '（使用者尚未填寫，請依一般情侶互動給建議）';

  return `你是貼心的情侶生活顧問。請根據以下資訊規劃重要日子的驚喜安排。

【重要日子】
- 類型：${event.typeLabel}
- 名稱：${event.displayTitle}
- 日期：${formatYmdLabel(event.dateYmd)}（${event.dateYmd}）
- 距離今天：${daysLine(event)}

【規劃條件】
- 預算：${budgetLine(budget, customBudget)}
- 風格：${styleLine(style)}
- 對方喜好／限制：${prefs}

【輸出格式 — 極重要】
只回傳一個 JSON 物件，不要 Markdown、不要代碼區塊、不要任何 ### ## # --- ** 粗體或標題符號。
欄位如下（皆繁體中文純文字）：
{
  "title": "安排標題（一句話，15字內）",
  "dateIdeas": "約會安排（時間、地點類型、活動，2～4句）",
  "gifts": ["禮物建議1", "禮物建議2", "禮物建議3"],
  "timeline": [
    { "period": "時段名稱", "place": "地點類型", "activity": "活動內容" }
  ],
  "phrase": "可以對伴侶說的一句話（真誠、不尷尬）",
  "tips": ["注意事項或貼心提醒1", "注意事項2"],
  "budget": "預算粗估（符合使用者預算條件）"
}

規則：
- gifts 2～3 項；timeline 3～5 個時段；tips 2～4 則
- 不必虛構真實店名；語氣溫暖具體可執行
- 風格符合「${styleLine(style)}」`;
}

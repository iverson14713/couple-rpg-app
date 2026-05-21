import {
  COST_LABEL,
  DATE_FILTER_OPTIONS,
  DURATION_LABEL,
} from '../data/dateIdeasPool';
import type { DateCost, DateDuration, DateFilterKey, DateSuggestion } from '../storage/dateTypes';

export type DateAiBudgetChoice = 'low' | 'mid' | 'high' | 'custom';
export type DateAiTransportChoice = 'car' | 'transit' | 'scooter' | 'walk';
export type DateAiStyleChoice = 'romantic' | 'relax' | 'food' | 'photo' | 'surprise' | 'lowkey';

export const DATE_AI_BUDGET_OPTIONS: { id: DateAiBudgetChoice; label: string }[] = [
  { id: 'low', label: '省錢' },
  { id: 'mid', label: '中等' },
  { id: 'high', label: '高一點' },
  { id: 'custom', label: '自訂' },
];

export const DATE_AI_TRANSPORT_OPTIONS: { id: DateAiTransportChoice; label: string; emoji: string }[] = [
  { id: 'car', label: '開車', emoji: '🚗' },
  { id: 'transit', label: '大眾運輸', emoji: '🚇' },
  { id: 'scooter', label: '機車', emoji: '🛵' },
  { id: 'walk', label: '步行', emoji: '🚶' },
];

export const DATE_AI_STYLE_OPTIONS: { id: DateAiStyleChoice; label: string; emoji: string }[] = [
  { id: 'romantic', label: '浪漫', emoji: '💕' },
  { id: 'relax', label: '放鬆', emoji: '🧘' },
  { id: 'food', label: '美食', emoji: '🍽️' },
  { id: 'photo', label: '拍照', emoji: '📸' },
  { id: 'surprise', label: '驚喜', emoji: '🎉' },
  { id: 'lowkey', label: '低調', emoji: '🌿' },
];

export type DateItineraryPreview = {
  morning: string;
  noon: string;
  afternoon: string;
  evening: string;
  surprise: string;
};

export type DateItineraryAiInput = {
  suggestion: DateSuggestion;
  departure: string;
  budget: DateAiBudgetChoice;
  customBudget: string;
  transport: DateAiTransportChoice;
  style: DateAiStyleChoice;
  partnerPrefs: string;
};

export function tagLabelsForSuggestion(tags: DateFilterKey[]): string[] {
  return tags
    .map((k) => DATE_FILTER_OPTIONS.find((o) => o.key === k)?.label)
    .filter((x): x is string => Boolean(x));
}

export function costToDefaultBudget(cost: DateCost): DateAiBudgetChoice {
  if (cost === 'low') return 'low';
  if (cost === 'high') return 'high';
  return 'mid';
}

function budgetLine(budget: DateAiBudgetChoice, custom: string): string {
  if (budget === 'custom' && custom.trim()) return `自訂預算：${custom.trim()}`;
  const map: Record<DateAiBudgetChoice, string> = {
    low: '省錢（用心、不破費）',
    mid: '中等（質感與體驗平衡）',
    high: '高一點（可安排驚喜與儀式感）',
    custom: '自訂預算（未填寫）',
  };
  return map[budget];
}

function transportLine(t: DateAiTransportChoice): string {
  return DATE_AI_TRANSPORT_OPTIONS.find((o) => o.id === t)?.label ?? t;
}

function styleLine(s: DateAiStyleChoice): string {
  const o = DATE_AI_STYLE_OPTIONS.find((x) => x.id === s);
  return o ? `${o.emoji} ${o.label}` : s;
}

const PREVIEW_BY_ID: Record<string, DateItineraryPreview> = {
  'd-day-trip': {
    morning: '出發前先買飲料，慢慢搭車到附近小鎮',
    noon: '找一間在地小吃或老店，邊吃邊聊',
    afternoon: '老街散步、拍照、買小點心',
    evening: '選一間舒服的店吃晚餐，或買甜點回家',
    surprise: '途中偷偷準備一張小卡片',
  },
};

function previewByDuration(duration: DateDuration, title: string): DateItineraryPreview {
  if (duration === '1h') {
    return {
      morning: '—',
      noon: '—',
      afternoon: `聚焦「${title}」：預留 1 小時，輕鬆出發`,
      evening: '結束後買杯飲料或散步收尾',
      surprise: '離開前說一句今天的感謝',
    };
  }
  if (duration === 'half') {
    return {
      morning: '睡飽出門，先確認天氣與交通',
      noon: `中午安排與「${title}」相關的一餐或休息`,
      afternoon: '依主題慢慢玩，留時間拍照',
      evening: '傍晚找個舒服角落聊天收尾',
      surprise: '準備一個小點心或手寫小卡',
    };
  }
  return {
    morning: '出發前準備飲料與小驚喜，從交通最順的路線出發',
    noon: '安排一餐在地或喜歡的餐廳',
    afternoon: '依主題散步、體驗或拍照',
    evening: '晚餐或甜點，為今天畫句點',
    surprise: '途中準備一張小卡片或對方喜歡的小東西',
  };
}

export function getDateItineraryPreview(suggestion: DateSuggestion): DateItineraryPreview {
  return PREVIEW_BY_ID[suggestion.id] ?? previewByDuration(suggestion.duration, suggestion.title);
}

export function buildDateItineraryAiPrompt(input: DateItineraryAiInput): string {
  const { suggestion, departure, budget, customBudget, transport, style, partnerPrefs } = input;
  const tags = tagLabelsForSuggestion(suggestion.tags).join('、') || '（無）';
  const depart = departure.trim() || '（未填寫，請依台灣常見都會區假設並註明）';
  const prefs = partnerPrefs.trim() || '（未填寫，請依一般情侶互動給建議）';

  return `你是專業的情侶約會行程規劃師。請根據以下資訊，為我們規劃「整天」的約會行程（含交通與預算考量）。

【約會主題】
${suggestion.emoji} ${suggestion.title}

【主題標籤】
${tags}

【點子預算參考】${COST_LABEL[suggestion.cost]}（使用者選擇：${budgetLine(budget, customBudget)}）

【建議時長】${DURATION_LABEL[suggestion.duration]}

【點子描述】
${suggestion.description}

【適合情境】
${suggestion.scenario}

【出發地】
${depart}

【交通方式】
${transportLine(transport)}

【想要風格】
${styleLine(style)}

【伴侶喜好／限制】
${prefs}

請用繁體中文、條列清楚，並依序輸出以下 9 個區塊（每區塊都要有具體建議，可含地點類型範例，不必虛構真實店名）：

1. 上午行程
2. 中午安排
3. 下午行程
4. 晚餐／傍晚安排
5. 預算估算（分項粗估，總計區間）
6. 交通建議（含往返與景點間移動）
7. 驚喜小安排（1～2 個可執行的小驚喜）
8. 可以對伴侶說的一句話（真誠、不肉麻）
9. 注意事項（天氣、營業時間、交通時間、體力等）

請讓行程與「${suggestion.title}」主題一致，步調符合「${styleLine(style)}」風格，並考慮「${transportLine(transport)}」的交通型態。`;
}

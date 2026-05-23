import {
  COST_LABEL,
  DATE_FILTER_OPTIONS,
  DURATION_LABEL,
} from '../data/dateIdeasPool';
import { budgetAmountGuidance } from './dateItineraryBudget';
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
  const budgetGuide = budgetAmountGuidance(budget, customBudget);

  return `你是「會幫朋友安排約會」的企劃人，不是列點機器人。請寫出像真人規劃的完整約會流程：有轉場、有情緒、有「為什麼這樣排」。

【約會主題】${suggestion.emoji} ${suggestion.title}
【主題標籤】${tags}
【點子預算參考】${COST_LABEL[suggestion.cost]}（使用者選擇：${budgetLine(budget, customBudget)}）
【建議時長】${DURATION_LABEL[suggestion.duration]}
【點子描述】${suggestion.description}
【適合情境】${suggestion.scenario}
【出發地】${depart}
【交通方式】${transportLine(transport)}
【想要風格】${styleLine(style)}
【伴侶喜好／限制】${prefs}

【時間軸 — 極重要】
segments 只能使用以下 4 個 period，各出現「恰好一次」，順序固定，禁止重複、禁止三個「晚上」：
1. period: "下午"
2. period: "傍晚"
3. period: "晚餐"
4. period: "晚間收尾"
若總時長較短，可省略 1 個時段，但已寫的 period 仍不可重複。

【寫作風格】
- 不要像 GPT 條列；每段 narrative 2～4 句，有畫面與情緒
- headline 是精簡場景名（例：文青咖啡館、河濱散步）
- purpose 說明「為什麼安排在這個時段」
- transition 寫如何銜接到下一段（交通／氛圍轉換）
- conversationCue 給 1 句自然、不尷尬的聊天方向
- 不必虛構真實店名；用區域＋類型即可

【輸出格式】
只回傳一個 JSON 物件，禁止 Markdown。繁體中文：
{
  "title": "約會主題（一句話，有記憶點）",
  "mood": "整體氛圍一句話",
  "moodTags": ["溫柔","輕鬆"],
  "segments": [
    {
      "period": "下午",
      "place": "區域或地點類型",
      "headline": "場景簡稱",
      "narrative": "2～4句，描述氣氛與兩人可以做什麼",
      "purpose": "此段安排目的",
      "transition": "前往下一段的轉場感",
      "conversationCue": "可以聊的方向",
      "estimatedCost": "NT$ 350–500（兩人，該時段）"
    }
  ],
  "aiReminders": ["記得提前訂位","可準備小卡片"],
  "partnerLines": ["自然、不肉麻的一句話"],
  "rainPlan": "下雨時的完整備案（仍保有約會感）",
  "tiredPlan": "對方累了時的輕鬆收尾",
  "budgetTier": "$ 或 $$ 或 $$$",
  "estimatedTotal": "NT$ 2,200–2,800（兩人）",
  "budgetBreakdown": [
    { "label": "下午 · 咖啡", "amount": "NT$ 350–500" },
    { "label": "交通", "amount": "NT$ 120–200" },
    { "label": "晚餐", "amount": "NT$ 1,200–1,800" }
  ],
  "budgetNote": "以上為台灣都會區一般行情估算，不含住宿",
  "outfit": "穿搭建議（可選，一句）",
  "surprise": "一個具體小驚喜點子"
}

【預估花費 — 極重要】
${budgetGuide}
- 每一個 segment 都必須有 estimatedCost，格式「NT$ 數字–數字（兩人）」
- budgetBreakdown 至少 3 項（含交通），amount 必須含 NT$ 與數字
- estimatedTotal 必須是兩人總計的 NT$ 區間，不可只寫「中等預算」或只有 $ 符號
- 金額須符合台灣行情與使用者預算檔次，可加（兩人）註記

與「${suggestion.title}」主題一致；風格符合「${styleLine(style)}」；交通依「${transportLine(transport)}」安排轉場。`;
}

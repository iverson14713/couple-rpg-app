import type { DateAiBudgetChoice } from './dateItineraryAiPrompt';

export type DateBudgetLineItem = {
  label: string;
  amount: string;
};

/** 依使用者預算選項，給 AI 台幣估算參考（兩人） */
export function budgetAmountGuidance(budget: DateAiBudgetChoice, customBudget: string): string {
  if (budget === 'custom' && customBudget.trim()) {
    return `依使用者自訂預算「${customBudget.trim()}」拆分各項與總計，皆以新台幣 NT$ 表示（兩人）。`;
  }
  if (budget === 'low') {
    return '省錢：兩人總計約 NT$ 800–1,500。下午茶 NT$ 200–400、晚餐 NT$ 400–800、交通 NT$ 100–250。';
  }
  if (budget === 'high') {
    return '高一點：兩人總計約 NT$ 3,500–7,000。晚餐可 NT$ 1,500–3,500，其餘時段與交通依質感估算。';
  }
  return '中等：兩人總計約 NT$ 1,500–3,000。各時段與交通都要寫出具體 NT$ 區間。';
}

export function formatNtRange(min: number, max?: number): string {
  const a = Math.round(min).toLocaleString('zh-TW');
  if (max == null || max === min) return `NT$ ${a}`;
  const b = Math.round(max).toLocaleString('zh-TW');
  return `NT$ ${a}–${b}`;
}

/** 從文字抽出第一個像總計的金額（供舊資料 fallback） */
export function extractNtAmountFromText(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const total = t.match(/總計[：:\s]*((?:約\s*)?NT\$?\s*[\d,]+(?:\s*[–\-~～]\s*NT\$?\s*[\d,]+)?(?:\s*（[^）]+）)?)/i);
  if (total?.[1]) return total[1].replace(/\s+/g, ' ').trim();
  const any = t.match(/((?:約\s*)?NT\$?\s*[\d,]{3,}(?:\s*[–\-~～]\s*NT\$?\s*[\d,]+)?(?:\s*（兩人）)?)/i);
  if (any?.[1]) return any[1].replace(/\s+/g, ' ').trim();
  const yuan = t.match(/([\d,]+)\s*元(?:\s*[–\-~～]\s*[\d,]+\s*元)?/);
  if (yuan?.[1]) return `約 ${yuan[0]}`;
  return null;
}

export function hasConcreteNtAmount(text: string): boolean {
  return /NT\$|新台幣|[\d,]+\s*元/.test(text);
}

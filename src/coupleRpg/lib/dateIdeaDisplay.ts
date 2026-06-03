import type { DateIdeaTemplate, DateSuggestion } from '../storage/dateTypes';

/** 舊版 Pro 題庫內部標題，不應顯示在前台 */
const INTERNAL_PRO_TITLE_RE = /^進階約會靈感\s*\d+\s*[：:]\s*(.+)$/u;

/** 內部片段 → 可讀標題（相容已儲存的建議／歷史） */
const LEGACY_SEGMENT_TITLES: Record<string, string> = {
  雨天約會: '雨天室內小約會',
  低預算約會: '低預算散步約會',
  室內約會: '雨天室內小約會',
  戶外約會: '戶外散步小約會',
  紀念日約會: '紀念日小驚喜約會',
  驚喜約會: '驚喜小約會',
  療癒放鬆: '放鬆療癒半日行程',
  拍照打卡: '拍照打卡小約會',
  深度聊天: '深度聊天約會',
  週末半日: '週末半日浪漫之旅',
  晚餐後小約會: '晚餐後散步約會',
  居家約會: '居家電影小約會',
  節日約會: '節日儀式感約會',
};

/**
 * 前台約會建議大標題：過濾「進階約會靈感 N：…」類內部 placeholder。
 */
export function displayDateIdeaTitle(title: string, scenario?: string): string {
  const trimmed = title.trim();
  if (!trimmed) return scenario?.trim() || '約會靈感';

  const legacy = trimmed.match(INTERNAL_PRO_TITLE_RE);
  if (legacy) {
    const segment = legacy[1].trim();
    return LEGACY_SEGMENT_TITLES[segment] ?? segment;
  }

  if (trimmed.startsWith('進階約會靈感')) {
    return scenario?.trim() || '約會靈感';
  }

  return trimmed;
}

export function displayDateSuggestionTitle(suggestion: Pick<DateSuggestion, 'title' | 'scenario'>): string {
  return displayDateIdeaTitle(suggestion.title, suggestion.scenario);
}

export function displayDateIdeaTemplateTitle(idea: Pick<DateIdeaTemplate, 'title' | 'scenario'>): string {
  return displayDateIdeaTitle(idea.title, idea.scenario);
}

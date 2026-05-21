import { stripMarkdown } from './dateItineraryAiModel';

export type ImportantDateTimelineItem = {
  period: string;
  place: string;
  activity: string;
};

export type ImportantDatePlan = {
  title: string;
  dateIdeas: string;
  gifts: string[];
  timeline: ImportantDateTimelineItem[];
  phrase: string;
  tips: string[];
  budget: string;
};

function coerceString(v: unknown): string {
  return stripMarkdown(typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
}

function normalizeTimelineItem(raw: unknown): ImportantDateTimelineItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const period = coerceString(o.period ?? o.time ?? o.時段);
  const place = coerceString(o.place ?? o.location ?? o.地點);
  const activity = coerceString(o.activity ?? o.活動 ?? o.content ?? o.內容);
  if (!period && !place && !activity) return null;
  return {
    period: period || '時段',
    place: place || '—',
    activity: activity || '—',
  };
}

function normalizeStringList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map(coerceString).filter(Boolean);
  }
  const s = coerceString(v);
  if (!s) return [];
  return s
    .split(/\n+/)
    .map((x) => x.replace(/^[•\d.)、]+\s*/, '').trim())
    .filter(Boolean);
}

export function parseImportantDatePlan(answer: string, planField?: unknown): ImportantDatePlan | null {
  if (planField && typeof planField === 'object' && !Array.isArray(planField)) {
    const fromObj = normalizePlanObject(planField as Record<string, unknown>);
    if (fromObj) return fromObj;
  }

  const trimmed = answer.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object') {
      const fromJson = normalizePlanObject(parsed as Record<string, unknown>);
      if (fromJson) return fromJson;
    }
  } catch {
    // fall through
  }

  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
      const fromJson = normalizePlanObject(parsed);
      if (fromJson) return fromJson;
    } catch {
      // ignore
    }
  }

  return parsePlainImportantDate(stripMarkdown(trimmed));
}

function normalizePlanObject(obj: Record<string, unknown>): ImportantDatePlan | null {
  const title = coerceString(obj.title ?? obj.標題) || '重要日子安排';
  const dateIdeas = coerceString(
    obj.dateIdeas ?? obj.datePlan ?? obj.約會安排 ?? obj.dateSuggestion
  );
  const gifts = normalizeStringList(obj.gifts ?? obj.giftIdeas ?? obj.禮物建議 ?? obj.禮物);
  const phrase = coerceString(obj.phrase ?? obj.message ?? obj.對伴侶說的話 ?? obj.一句話);
  const tips = normalizeStringList(obj.tips ?? obj.notes ?? obj.注意事項 ?? obj.貼心提醒);
  const budget = coerceString(obj.budget ?? obj.預算);

  const rawTimeline = obj.timeline ?? obj.schedule ?? obj.flow ?? obj.當天流程 ?? obj.流程;
  const timeline = Array.isArray(rawTimeline)
    ? rawTimeline.map(normalizeTimelineItem).filter((x): x is ImportantDateTimelineItem => Boolean(x))
    : [];

  if (!dateIdeas && gifts.length === 0 && timeline.length === 0 && !phrase && tips.length === 0) {
    return null;
  }

  return {
    title,
    dateIdeas: dateIdeas || '依你們的節奏安排一場用心約會',
    gifts,
    timeline,
    phrase,
    tips,
    budget: budget || '',
  };
}

function parsePlainImportantDate(text: string): ImportantDatePlan | null {
  if (!text.trim()) return null;
  return {
    title: '重要日子安排',
    dateIdeas: text.slice(0, 400),
    gifts: [],
    timeline: [],
    phrase: '',
    tips: [],
    budget: '',
  };
}

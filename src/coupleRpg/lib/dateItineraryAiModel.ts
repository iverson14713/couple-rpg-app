/** Structured date itinerary from AI (JSON preferred). */
export type DateItinerarySegment = {
  period: string;
  place: string;
  activity: string;
};

export type DateItineraryPlan = {
  title: string;
  segments: DateItinerarySegment[];
  tips: string[];
  budget: string;
};

const PERIOD_ORDER = ['上午', '中午', '下午', '傍晚', '晚餐', '晚上', '夜間'];

/** Remove Markdown headings, bold, hr, bullets decoration. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function coerceString(v: unknown): string {
  if (typeof v === 'string') return stripMarkdown(v.trim());
  if (v == null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function normalizeSegment(raw: unknown): DateItinerarySegment | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const period = coerceString(o.period ?? o.time ?? o.slot ?? o.時段);
  const place = coerceString(o.place ?? o.location ?? o.地點);
  const activity = coerceString(o.activity ?? o.活動 ?? o.plan ?? o.content ?? o.內容);
  if (!period && !place && !activity) return null;
  return {
    period: period || '行程',
    place: place || '—',
    activity: activity || '—',
  };
}

function normalizeTips(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map(coerceString).filter(Boolean);
  }
  const s = coerceString(v);
  if (!s) return [];
  return s.split(/\n+/).map((x) => x.replace(/^[•\d.)、]+\s*/, '').trim()).filter(Boolean);
}

function sortSegments(segments: DateItinerarySegment[]): DateItinerarySegment[] {
  return [...segments].sort((a, b) => {
    const ai = PERIOD_ORDER.findIndex((p) => a.period.includes(p));
    const bi = PERIOD_ORDER.findIndex((p) => b.period.includes(p));
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

/** Parse API `itinerary` object or JSON / plain text `answer`. */
export function parseDateItineraryPlan(
  answer: string,
  itineraryField?: unknown
): DateItineraryPlan | null {
  if (itineraryField && typeof itineraryField === 'object' && !Array.isArray(itineraryField)) {
    const fromObj = normalizePlanObject(itineraryField as Record<string, unknown>);
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
    // not JSON — fall through
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

  return parsePlainTextItinerary(stripMarkdown(trimmed));
}

function normalizePlanObject(obj: Record<string, unknown>): DateItineraryPlan | null {
  const title = coerceString(obj.title ?? obj.tripTitle ?? obj.行程標題 ?? obj.標題);
  const budget = coerceString(obj.budget ?? obj.預算 ?? obj.budgetEstimate);

  let segments: DateItinerarySegment[] = [];
  const rawSeg =
    obj.segments ?? obj.schedule ?? obj.timeline ?? obj.時段 ?? obj.itinerary ?? obj.行程;
  if (Array.isArray(rawSeg)) {
    segments = rawSeg.map(normalizeSegment).filter((x): x is DateItinerarySegment => Boolean(x));
  }

  const tips = normalizeTips(obj.tips ?? obj.reminders ?? obj.貼心提醒 ?? obj.notes ?? obj.注意事項);

  if (!title && segments.length === 0 && !budget && tips.length === 0) return null;

  return {
    title: title || '今日約會行程',
    segments: sortSegments(segments),
    tips,
    budget: budget || '依實際消費調整',
  };
}

function parsePlainTextItinerary(text: string): DateItineraryPlan | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const segments: DateItinerarySegment[] = [];
  const tips: string[] = [];
  let title = '';
  let budget = '';

  const periodRe = /^(上午|中午|下午|傍晚|晚餐|晚上|夜間|早餐)/;

  for (const line of lines) {
    const periodMatch = line.match(/^(\d+[.)、\s]*)?(上午|中午|下午|傍晚|晚餐|晚上|夜間|早餐)[：:\s]*(.*)$/);
    if (periodMatch) {
      const period = periodMatch[2];
      const rest = periodMatch[3] || '';
      const [place, activity] = splitPlaceActivity(rest);
      segments.push({ period, place, activity });
      continue;
    }
    if (/^預算/.test(line)) {
      budget = line.replace(/^預算[：:\s]*/, '');
      continue;
    }
    if (/^(貼心提醒|注意事項|提醒)/.test(line)) {
      tips.push(line.replace(/^(貼心提醒|注意事項|提醒)[：:\s]*/, ''));
      continue;
    }
    if (!title && line.length < 40 && !periodRe.test(line)) {
      title = line;
    }
  }

  if (segments.length === 0 && lines.length > 0) {
    return {
      title: title || '今日約會行程',
      segments: [{ period: '行程', place: '—', activity: lines.join(' ') }],
      tips,
      budget: budget || '依實際消費調整',
    };
  }

  return {
    title: title || '今日約會行程',
    segments: sortSegments(segments),
    tips,
    budget: budget || '依實際消費調整',
  };
}

function splitPlaceActivity(rest: string): [string, string] {
  const t = rest.trim();
  if (!t) return ['—', '—'];
  const at = t.match(/^(.+?)[，,]\s*(.+)$/);
  if (at) return [at[1].trim(), at[2].trim()];
  return ['—', t];
}

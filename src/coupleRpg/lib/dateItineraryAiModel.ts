import {
  extractNtAmountFromText,
  formatNtRange,
  hasConcreteNtAmount,
  type DateBudgetLineItem,
} from './dateItineraryBudget';
import {
  canonicalDateItineraryPeriod,
  DATE_ITINERARY_TIMELINE_SLOTS,
  type DateItineraryTimelineLabel,
} from './dateItineraryPeriods';

export type DateBudgetTier = '$' | '$$' | '$$$';

export type { DateBudgetLineItem };

export type DateItinerarySegment = {
  period: string;
  place: string;
  headline: string;
  narrative: string;
  purpose: string;
  conversationCue?: string;
  transition?: string;
  /** 該時段兩人預估花費，例：NT$ 350–500 */
  estimatedCost?: string;
  /** Legacy flat activity text */
  activity?: string;
};

export type DateItineraryPlan = {
  title: string;
  mood: string;
  moodTags: string[];
  segments: DateItinerarySegment[];
  aiReminders: string[];
  partnerLines: string[];
  rainPlan: string;
  tiredPlan?: string;
  budgetTier: DateBudgetTier | string;
  /** 兩人總計，例：NT$ 2,200–2,800（兩人） */
  estimatedTotal: string;
  /** 分項金額 */
  budgetBreakdown: DateBudgetLineItem[];
  budgetNote: string;
  outfit?: string;
  surprise?: string;
  /** @deprecated use aiReminders */
  tips?: string[];
  /** @deprecated use budgetNote */
  budget?: string;
};

const TIMELINE_ORDER: DateItineraryTimelineLabel[] = DATE_ITINERARY_TIMELINE_SLOTS.map((s) => s.label);

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

function normalizeStringList(v: unknown, max = 6): string[] {
  if (Array.isArray(v)) {
    return v.map(coerceString).filter(Boolean).slice(0, max);
  }
  const s = coerceString(v);
  if (!s) return [];
  return s
    .split(/\n+/)
    .map((x) => x.replace(/^[•\d.)、]+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, max);
}

function normalizeBudgetTier(v: unknown): DateBudgetTier | string {
  const s = coerceString(v);
  if (s === '$' || s === '$$' || s === '$$$') return s;
  if (/省|低|便宜|小資/.test(s)) return '$';
  if (/高|奢|儀式|豪/.test(s)) return '$$$';
  if (s) return s;
  return '$$';
}

function normalizeSegment(raw: unknown): DateItinerarySegment | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const periodRaw = coerceString(o.period ?? o.time ?? o.slot ?? o.時段);
  const periodCanon = canonicalDateItineraryPeriod(periodRaw);
  const period = periodCanon ?? (periodRaw || '下午');

  const place = coerceString(o.place ?? o.location ?? o.地點 ?? o.venue);
  const headline = coerceString(
    o.headline ?? o.title ?? o.spot ?? o.標題 ?? (place && place !== '—' ? place : '')
  );
  const narrative = coerceString(
    o.narrative ??
      o.mood ??
      o.vibe ??
      o.description ??
      o.story ??
      o.氛圍描述 ??
      o.activity ??
      o.活動 ??
      o.content ??
      o.內容
  );
  const purpose = coerceString(o.purpose ?? o.why ?? o.goal ?? o.目的 ?? o.安排目的);
  const conversationCue = coerceString(o.conversationCue ?? o.conversation ?? o.talk ?? o.對話建議);
  const transition = coerceString(o.transition ?? o.next ?? o.轉場 ?? o.銜接);
  let estimatedCost = coerceString(
    o.estimatedCost ?? o.cost ?? o.costEstimate ?? o.花費 ?? o.預估花費 ?? o.amount
  );
  if (!estimatedCost && typeof o.amountMin === 'number') {
    estimatedCost = formatNtRange(
      Number(o.amountMin),
      typeof o.amountMax === 'number' ? Number(o.amountMax) : undefined
    );
  }
  if (estimatedCost && !/NT\$|元/.test(estimatedCost) && /^\d/.test(estimatedCost)) {
    estimatedCost = `NT$ ${estimatedCost}`;
  }

  const legacyActivity = coerceString(o.activity ?? o.活動);
  if (!narrative && legacyActivity) {
    return {
      period,
      place: place || '—',
      headline: headline || place || '約會景點',
      narrative: legacyActivity,
      purpose: purpose || '讓兩人自然進入這個時段的氛圍',
      conversationCue: conversationCue || undefined,
      transition: transition || undefined,
      estimatedCost: estimatedCost || undefined,
      activity: legacyActivity,
    };
  }

  if (!period && !place && !narrative && !headline) return null;

  return {
    period,
    place: place || '—',
    headline: headline || place || '約會景點',
    narrative: narrative || '在這裡放慢腳步，享受兩人的時光。',
    purpose: purpose || '延續約會節奏，讓氣氛自然升溫',
    conversationCue: conversationCue || undefined,
    transition: transition || undefined,
    estimatedCost: estimatedCost || undefined,
    activity: legacyActivity || undefined,
  };
}

function normalizeBudgetLineItem(raw: unknown): DateBudgetLineItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const label = coerceString(o.label ?? o.item ?? o.name ?? o.項目 ?? o.category);
  let amount = coerceString(o.amount ?? o.cost ?? o.price ?? o.金額 ?? o.estimate);
  if (!amount && typeof o.amountMin === 'number') {
    amount = formatNtRange(
      Number(o.amountMin),
      typeof o.amountMax === 'number' ? Number(o.amountMax) : undefined
    );
  }
  if (amount && !/NT\$|元/.test(amount) && /^\d/.test(amount)) {
    amount = `NT$ ${amount}`;
  }
  if (!label || !amount) return null;
  return { label, amount };
}

function normalizeBudgetBreakdown(v: unknown, segments: DateItinerarySegment[]): DateBudgetLineItem[] {
  const items: DateBudgetLineItem[] = [];
  if (Array.isArray(v)) {
    for (const raw of v) {
      const row = normalizeBudgetLineItem(raw);
      if (row) items.push(row);
    }
  }
  if (items.length > 0) return items;

  for (const seg of segments) {
    if (seg.estimatedCost) {
      items.push({
        label: `${seg.period} · ${seg.headline || seg.place}`,
        amount: seg.estimatedCost,
      });
    }
  }
  return items;
}

function resolveEstimatedTotal(
  raw: string,
  breakdown: DateBudgetLineItem[],
  budgetNote: string
): string {
  const fromField = coerceString(raw);
  if (fromField && hasConcreteNtAmount(fromField)) return fromField;
  const fromNote = extractNtAmountFromText(budgetNote);
  if (fromNote) return fromNote;
  if (breakdown.length > 0) {
    return '詳見下方分項（兩人）';
  }
  return '';
}

function mergeSegmentContent(a: DateItinerarySegment, b: DateItinerarySegment): DateItinerarySegment {
  const pickLonger = (x: string, y: string) => (y.length > x.length ? y : x);
  return {
    period: a.period,
    place: a.place !== '—' ? a.place : b.place,
    headline: pickLonger(a.headline, b.headline),
    narrative: pickLonger(a.narrative, b.narrative),
    purpose: pickLonger(a.purpose, b.purpose),
    conversationCue: a.conversationCue || b.conversationCue,
    transition: a.transition || b.transition,
  };
}

function dedupeTimelineSegments(segments: DateItinerarySegment[]): DateItinerarySegment[] {
  const byPeriod = new Map<DateItineraryTimelineLabel, DateItinerarySegment>();
  for (const seg of segments) {
    const canon = canonicalDateItineraryPeriod(seg.period) ?? '下午';
    const normalized = { ...seg, period: canon };
    const prev = byPeriod.get(canon);
    byPeriod.set(canon, prev ? mergeSegmentContent(prev, normalized) : normalized);
  }
  return TIMELINE_ORDER.map((label) => byPeriod.get(label)).filter((x): x is DateItinerarySegment =>
    Boolean(x)
  );
}

function sortSegments(segments: DateItinerarySegment[]): DateItinerarySegment[] {
  const deduped = dedupeTimelineSegments(segments);
  if (deduped.length > 0) return deduped;
  return [...segments].sort((a, b) => {
    const ai = TIMELINE_ORDER.findIndex((p) => a.period.includes(p));
    const bi = TIMELINE_ORDER.findIndex((p) => b.period.includes(p));
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

function normalizeTips(v: unknown): string[] {
  return normalizeStringList(v, 8);
}

/** Parse API `itinerary` object or JSON / plain text `answer`. */
export function parseDateItineraryPlan(
  answer: string,
  itineraryField?: unknown
): DateItineraryPlan | null {
  if (itineraryField && typeof itineraryField === 'object' && !Array.isArray(itineraryField)) {
    const fromObj = normalizePlanObject(itineraryField as Record<string, unknown>);
    if (fromObj) return hydrateDateItineraryPlan(fromObj);
  }

  const trimmed = answer.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object') {
      const fromJson = normalizePlanObject(parsed as Record<string, unknown>);
      if (fromJson) return hydrateDateItineraryPlan(fromJson);
    }
  } catch {
    /* not JSON */
  }

  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
      const fromJson = normalizePlanObject(parsed);
      if (fromJson) return hydrateDateItineraryPlan(fromJson);
    } catch {
      /* ignore */
    }
  }

  return parsePlainTextItinerary(stripMarkdown(trimmed));
}

function normalizePlanObject(obj: Record<string, unknown>): DateItineraryPlan | null {
  const title = coerceString(obj.title ?? obj.tripTitle ?? obj.theme ?? obj.約會主題 ?? obj.標題);
  const mood = coerceString(obj.mood ?? obj.atmosphere ?? obj.vibe ?? obj.約會氛圍 ?? obj.氛圍);
  const moodTags = normalizeStringList(obj.moodTags ?? obj.mood_tags ?? obj.氛圍標籤 ?? obj.tags, 4);

  let segments: DateItinerarySegment[] = [];
  const rawSeg =
    obj.segments ?? obj.schedule ?? obj.timeline ?? obj.時段 ?? obj.itinerary ?? obj.行程;
  if (Array.isArray(rawSeg)) {
    segments = rawSeg.map(normalizeSegment).filter((x): x is DateItinerarySegment => Boolean(x));
  }

  const aiReminders = normalizeTips(
    obj.aiReminders ?? obj.reminders ?? obj.小提醒 ?? obj.tips ?? obj.貼心提醒
  );
  const partnerLines = normalizeStringList(
    obj.partnerLines ?? obj.sayToPartner ?? obj.lines ?? obj.可以對伴侶說,
    4
  );
  const rainPlan = coerceString(
    obj.rainPlan ?? obj.rainyPlan ?? obj.backup ?? obj.雨天備案 ?? obj.備案模式
  );
  const tiredPlan = coerceString(obj.tiredPlan ?? obj.tiredBackup ?? obj.累了備案);
  const budgetTier = normalizeBudgetTier(obj.budgetTier ?? obj.budget_level);
  let budgetNote = coerceString(
    obj.budgetNote ?? obj.budgetDetail ?? obj.預算說明 ?? obj.budgetEstimate
  );
  const legacyBudget = coerceString(obj.budget ?? obj.預算);
  if (!budgetNote && legacyBudget) budgetNote = legacyBudget;

  const sortedSegments = sortSegments(segments);
  const budgetBreakdown = normalizeBudgetBreakdown(
    obj.budgetBreakdown ?? obj.budgetItems ?? obj.costBreakdown ?? obj.花費明細,
    sortedSegments
  );
  let estimatedTotal = resolveEstimatedTotal(
    coerceString(obj.estimatedTotal ?? obj.totalCost ?? obj.總計 ?? obj.預估總額),
    budgetBreakdown,
    budgetNote
  );
  if (!estimatedTotal && !hasConcreteNtAmount(budgetNote)) {
    budgetNote =
      budgetNote ||
      '各項費用依實際店家的與交通方式調整；建議重新產生以取得新台幣估算。';
  }

  const outfit = coerceString(obj.outfit ?? obj.穿搭 ?? obj.穿搭建議);
  const surprise = coerceString(obj.surprise ?? obj.小驚喜);

  if (!title && sortedSegments.length === 0 && !mood && aiReminders.length === 0) return null;

  const legacyTips = normalizeTips(obj.tips);
  const mergedReminders = aiReminders.length > 0 ? aiReminders : legacyTips;

  return hydrateDateItineraryPlan({
    title: title || '今日約會企劃',
    mood: mood || (moodTags.length ? moodTags.join(' · ') : '溫柔而有儀式感'),
    moodTags: moodTags.length ? moodTags : mood ? [mood] : ['溫柔'],
    segments: sortedSegments,
    aiReminders: mergedReminders,
    partnerLines,
    rainPlan: rainPlan || tiredPlan || '改為室內咖啡或電影，保留聊天與陪伴的品質。',
    tiredPlan: tiredPlan || undefined,
    budgetTier,
    estimatedTotal,
    budgetBreakdown,
    budgetNote: budgetNote || estimatedTotal || '依實際選擇的餐廳與交通調整',
    outfit: outfit || undefined,
    surprise: surprise || undefined,
    tips: mergedReminders,
    budget: budgetNote,
  });
}

/** 補齊舊紀錄缺少的預算欄位 */
export function hydrateDateItineraryPlan(plan: DateItineraryPlan): DateItineraryPlan {
  const segments = plan.segments ?? [];
  const budgetBreakdown =
    plan.budgetBreakdown?.length > 0
      ? plan.budgetBreakdown
      : normalizeBudgetBreakdown([], segments);
  const budgetNote = plan.budgetNote || plan.budget || '';
  const estimatedTotal =
    plan.estimatedTotal ||
    extractNtAmountFromText(budgetNote) ||
    (budgetBreakdown.length > 0 ? '詳見下方分項（兩人）' : '');
  return {
    ...plan,
    budgetBreakdown,
    estimatedTotal,
    budgetNote: budgetNote || estimatedTotal,
    budget: plan.budget ?? budgetNote,
  };
}

function parsePlainTextItinerary(text: string): DateItineraryPlan | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const segments: DateItinerarySegment[] = [];
  const tips: string[] = [];
  let title = '';
  let budget = '';

  const periodRe = /^(下午|傍晚|晚餐|晚間|晚上|夜間|上午|中午)/;

  for (const line of lines) {
    const periodMatch = line.match(
      /^(\d+[.)、\s]*)?(下午|傍晚|晚餐|晚間收尾|晚間|晚上|夜間|上午|中午)[：:|｜\s]*(.*)$/
    );
    if (periodMatch) {
      const period = periodMatch[2];
      const rest = periodMatch[3] || '';
      const [headline, narrative] = splitHeadlineNarrative(rest);
      segments.push({
        period,
        place: headline,
        headline,
        narrative: narrative || rest,
        purpose: '讓約會節奏自然推進',
      });
      continue;
    }
    if (/^預算/.test(line)) {
      budget = line.replace(/^預算[：:\s]*/, '');
      continue;
    }
    if (/^(貼心提醒|注意事項|提醒|AI)/.test(line)) {
      tips.push(line.replace(/^(貼心提醒|注意事項|提醒|AI 小提醒)[：:\s]*/, ''));
      continue;
    }
    if (!title && line.length < 40 && !periodRe.test(line)) {
      title = line;
    }
  }

  if (segments.length === 0 && lines.length > 0) {
    return hydrateDateItineraryPlan({
      title: title || '今日約會企劃',
      mood: '輕鬆甜蜜',
      moodTags: ['輕鬆'],
      segments: [
        {
          period: '下午',
          place: '—',
          headline: '約會行程',
          narrative: lines.join(' '),
          purpose: '享受兩人時光',
        },
      ],
      aiReminders: tips,
      partnerLines: [],
      rainPlan: '雨天可改室內行程',
      budgetTier: '$$',
      estimatedTotal: '',
      budgetBreakdown: [],
      budgetNote: budget || '依實際消費調整',
      tips,
      budget: budget || '依實際消費調整',
    });
  }

  return normalizePlanObject({
    title: title || '今日約會企劃',
    segments,
    tips,
    budget,
  });
}

function splitHeadlineNarrative(rest: string): [string, string] {
  const t = rest.trim();
  if (!t) return ['—', '—'];
  const pipe = t.match(/^(.+?)[｜|](.+)$/);
  if (pipe) return [pipe[1].trim(), pipe[2].trim()];
  const comma = t.match(/^(.+?)[，,]\s*(.+)$/);
  if (comma) return [comma[1].trim(), comma[2].trim()];
  return [t, ''];
}

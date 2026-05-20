import { makeId } from '../lib/id';
import { todayKey } from '../lib/dates';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import type {
  ActiveAnniversaryReminder,
  AnniversaryData,
  AnniversaryEvent,
  AnniversaryEventType,
  AnniversaryPlan,
  GiftPreferences,
  GiftSuggestion,
  UpcomingEvent,
} from './anniversaryTypes';
import { DEFAULT_ANNIVERSARY_DATA } from './anniversaryTypes';
import { typeMeta } from '../data/anniversaryMeta';

export function loadAnniversaries(): AnniversaryData {
  const raw = loadJson(LQ_KEYS.anniversaries, DEFAULT_ANNIVERSARY_DATA());
  return {
    ...DEFAULT_ANNIVERSARY_DATA(),
    ...raw,
    events: raw.events ?? [],
    plans: raw.plans ?? {},
    giftPreferences: { ...DEFAULT_ANNIVERSARY_DATA().giftPreferences, ...raw.giftPreferences },
    lastGiftSuggestions: raw.lastGiftSuggestions ?? [],
    reminderAck: raw.reminderAck ?? {},
  };
}

export function saveAnniversaries(data: AnniversaryData): void {
  saveJson(LQ_KEYS.anniversaries, data);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseParts(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m, d };
}

export function occurrenceYear(event: AnniversaryEvent, occurrence: Date): string {
  return String(occurrence.getFullYear());
}

export function getNextOccurrence(event: AnniversaryEvent, from = new Date()): Date {
  const { y, m, d } = parseParts(event.date);
  const base = startOfDay(from);

  if (!event.repeatYearly) {
    const one = startOfDay(new Date(y, m - 1, d));
    return one >= base ? one : one;
  }

  let year = base.getFullYear();
  let candidate = startOfDay(new Date(year, m - 1, d));
  if (candidate < base) {
    candidate = startOfDay(new Date(year + 1, m - 1, d));
  }
  return candidate;
}

export function daysUntil(date: Date, from = new Date()): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(date).getTime();
  return Math.round((b - a) / 86400000);
}

export function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getUpcomingEvents(events: AnniversaryEvent[], limit = 10, from = new Date()): UpcomingEvent[] {
  const list: UpcomingEvent[] = events.map((event) => {
    const occ = getNextOccurrence(event, from);
    const meta = typeMeta(event.type);
    return {
      event,
      occurrenceDate: dateKeyFromDate(occ),
      daysUntil: daysUntil(occ, from),
      typeLabel: meta.label,
      emoji: meta.emoji,
    };
  });

  return list
    .filter((u) => u.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

export function getNextImportant(events: AnniversaryEvent[], from = new Date()): UpcomingEvent | null {
  return getUpcomingEvents(events, 1, from)[0] ?? null;
}

function reminderKey(eventId: string, year: string, offset: 7 | 3 | 0): string {
  return `${eventId}:${year}:${offset}`;
}

export function getActiveReminders(data: AnniversaryData, from = new Date()): ActiveAnniversaryReminder[] {
  const today = todayKey();
  const out: ActiveAnniversaryReminder[] = [];

  for (const u of getUpcomingEvents(data.events, 50, from)) {
    if (u.daysUntil > 7) continue;
    const year = occurrenceYear(u.event, new Date(u.occurrenceDate));
    const offsets: (7 | 3 | 0)[] = [7, 3, 0];

    for (const offset of offsets) {
      if (u.daysUntil !== offset) continue;
      const key = reminderKey(u.event.id, year, offset);
      if (data.reminderAck[key] === today) continue;

      const when =
        offset === 0 ? '就是今天' : offset === 3 ? '還有 3 天' : '還有 7 天';

      out.push({
        id: key,
        event: u.event,
        occurrenceDate: u.occurrenceDate,
        daysUntil: u.daysUntil,
        offset,
        message: `${when}：${u.event.name}`,
        emoji: u.emoji,
      });
    }
  }

  return out.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function acknowledgeReminder(data: AnniversaryData, reminderId: string): AnniversaryData {
  return {
    ...data,
    reminderAck: { ...data.reminderAck, [reminderId]: todayKey() },
  };
}

export function addAnniversaryEvent(
  data: AnniversaryData,
  input: {
    name: string;
    date: string;
    type: AnniversaryEventType;
    note: string;
    repeatYearly: boolean;
  }
): AnniversaryData {
  const event: AnniversaryEvent = {
    id: makeId(),
    name: input.name.trim(),
    date: input.date,
    type: input.type,
    note: input.note.trim(),
    repeatYearly: input.repeatYearly,
    celebratedYears: [],
    planRewardedYears: [],
  };
  return { ...data, events: [...data.events, event] };
}

export function updateAnniversaryEvent(
  data: AnniversaryData,
  id: string,
  input: Partial<Pick<AnniversaryEvent, 'name' | 'date' | 'type' | 'note' | 'repeatYearly'>>
): AnniversaryData {
  return {
    ...data,
    events: data.events.map((e) => (e.id === id ? { ...e, ...input, name: input.name?.trim() ?? e.name, note: input.note?.trim() ?? e.note } : e)),
  };
}

export function removeAnniversaryEvent(data: AnniversaryData, id: string): AnniversaryData {
  const { [id]: _removed, ...plans } = data.plans;
  return {
    ...data,
    events: data.events.filter((e) => e.id !== id),
    plans,
  };
}

export function savePlan(data: AnniversaryData, eventId: string, plan: AnniversaryPlan): AnniversaryData {
  return { ...data, plans: { ...data.plans, [eventId]: plan } };
}

export function markPlanRewarded(data: AnniversaryData, eventId: string, year: string): AnniversaryData {
  return {
    ...data,
    events: data.events.map((e) =>
      e.id === eventId && !e.planRewardedYears.includes(year)
        ? { ...e, planRewardedYears: [...e.planRewardedYears, year] }
        : e
    ),
  };
}

export function markCelebrated(data: AnniversaryData, eventId: string, year: string): AnniversaryData {
  return {
    ...data,
    events: data.events.map((e) =>
      e.id === eventId && !e.celebratedYears.includes(year)
        ? { ...e, celebratedYears: [...e.celebratedYears, year] }
        : e
    ),
  };
}

export function canRewardPlan(event: AnniversaryEvent, year: string): boolean {
  return !event.planRewardedYears.includes(year);
}

export function canRewardCelebrate(event: AnniversaryEvent, year: string): boolean {
  return !event.celebratedYears.includes(year);
}

export function updateGiftPreferences(data: AnniversaryData, prefs: GiftPreferences): AnniversaryData {
  return { ...data, giftPreferences: prefs };
}

export function saveGiftSuggestions(data: AnniversaryData, suggestions: GiftSuggestion[]): AnniversaryData {
  return { ...data, lastGiftSuggestions: suggestions };
}

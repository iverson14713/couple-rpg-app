import { todayKey } from '../lib/dates';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import {
  DEFAULT_EVENT_SETTINGS,
  type ImportantDateEventSettings,
  type ImportantDateRemindersData,
  type ReminderOffsetDays,
} from './importantDateReminderTypes';

export function defaultImportantDateReminders(): ImportantDateRemindersData {
  return { version: 1, byEventId: {} };
}

export function loadImportantDateReminders(): ImportantDateRemindersData {
  try {
    const raw = loadJson<ImportantDateRemindersData | null>(LQ_KEYS.importantDateReminders, null);
    if (!raw || raw.version !== 1) return defaultImportantDateReminders();
    const byEventId: ImportantDateRemindersData['byEventId'] = {};
    if (raw.byEventId && typeof raw.byEventId === 'object') {
      for (const [id, settings] of Object.entries(raw.byEventId)) {
        if (typeof id === 'string' && id.length > 0) {
          byEventId[id] = sanitizeEventSettings(settings);
        }
      }
    }
    const dismissedAck =
      raw.dismissedAck && typeof raw.dismissedAck === 'object' ? { ...raw.dismissedAck } : {};
    return { version: 1, byEventId, dismissedAck };
  } catch (e) {
    console.error('[important-date-reminders] load failed, using defaults:', e);
    return defaultImportantDateReminders();
  }
}

export function saveImportantDateReminders(data: ImportantDateRemindersData): void {
  saveJson(LQ_KEYS.importantDateReminders, data);
}

function sanitizeEventSettings(raw: unknown): ImportantDateEventSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_EVENT_SETTINGS };
  }
  const r = raw as Partial<ImportantDateEventSettings>;
  const offsets = Array.isArray(r.offsets)
    ? r.offsets.filter((o): o is ReminderOffsetDays => typeof o === 'number')
    : DEFAULT_EVENT_SETTINGS.offsets;
  return {
    offsets: offsets.length ? offsets : DEFAULT_EVENT_SETTINGS.offsets,
    giftPrepared: Boolean(r.giftPrepared),
    activityPlanned: Boolean(r.activityPlanned),
    partnerPrefs: typeof r.partnerPrefs === 'string' ? r.partnerPrefs : '',
  };
}

export function getEventSettings(
  data: ImportantDateRemindersData | null | undefined,
  eventId: string
): ImportantDateEventSettings {
  if (!data?.byEventId) return { ...DEFAULT_EVENT_SETTINGS };
  return sanitizeEventSettings(data.byEventId[eventId]);
}

export function updateEventSettings(
  data: ImportantDateRemindersData,
  eventId: string,
  patch: Partial<ImportantDateEventSettings>
): ImportantDateRemindersData {
  const cur = getEventSettings(data, eventId);
  return {
    ...data,
    byEventId: {
      ...data.byEventId,
      [eventId]: { ...cur, ...patch },
    },
  };
}

/** 切換單一 offset（純函數，供 draft UI 使用） */
export function toggleOffsetsInList(
  offsets: ReminderOffsetDays[],
  offset: ReminderOffsetDays
): ReminderOffsetDays[] {
  const set = new Set(offsets);
  if (set.has(offset)) set.delete(offset);
  else set.add(offset);
  const next = [...set].sort((a, b) => a - b) as ReminderOffsetDays[];
  return next.length ? next : [7];
}

export function toggleReminderOffset(
  data: ImportantDateRemindersData,
  eventId: string,
  offset: ReminderOffsetDays
): ImportantDateRemindersData {
  const cur = getEventSettings(data, eventId);
  return updateEventSettings(data, eventId, {
    offsets: toggleOffsetsInList(cur.offsets, offset),
  });
}

export function formatEnabledOffsetsLabel(offsets: ReminderOffsetDays[]): string {
  if (offsets.length === 0) return '未設定';
  return offsets
    .map((o) => (o === 0 ? '當天' : `前 ${o} 天`))
    .join('、');
}

export function acknowledgeImportantDateReminder(
  data: ImportantDateRemindersData,
  reminderId: string,
  day: string = todayKey()
): ImportantDateRemindersData {
  return {
    ...data,
    dismissedAck: { ...data.dismissedAck, [reminderId]: day },
  };
}

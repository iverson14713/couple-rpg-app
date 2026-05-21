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
  const raw = loadJson<ImportantDateRemindersData | null>(LQ_KEYS.importantDateReminders, null);
  if (!raw || raw.version !== 1) return defaultImportantDateReminders();
  return {
    version: 1,
    byEventId: raw.byEventId ?? {},
  };
}

export function saveImportantDateReminders(data: ImportantDateRemindersData): void {
  saveJson(LQ_KEYS.importantDateReminders, data);
}

export function getEventSettings(
  data: ImportantDateRemindersData,
  eventId: string
): ImportantDateEventSettings {
  return data.byEventId[eventId] ?? { ...DEFAULT_EVENT_SETTINGS };
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

export function toggleReminderOffset(
  data: ImportantDateRemindersData,
  eventId: string,
  offset: ReminderOffsetDays
): ImportantDateRemindersData {
  const cur = getEventSettings(data, eventId);
  const set = new Set(cur.offsets);
  if (set.has(offset)) set.delete(offset);
  else set.add(offset);
  const offsets = [...set].sort((a, b) => a - b) as ReminderOffsetDays[];
  return updateEventSettings(data, eventId, { offsets: offsets.length ? offsets : [7] });
}

export function formatEnabledOffsetsLabel(offsets: ReminderOffsetDays[]): string {
  if (offsets.length === 0) return '未設定';
  return offsets
    .map((o) => (o === 0 ? '當天' : `前${o}天`))
    .join('、');
}

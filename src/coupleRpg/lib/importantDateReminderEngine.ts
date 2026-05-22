import { todayKey } from './dates';
import { buildImportantDateEvents, type ImportantDateEvent } from './importantDateEvents';
import type { CoupleExtendedProfile } from '../storage/coupleExtendedTypes';
import {
  getEventSettings,
  type ImportantDateRemindersData,
} from '../storage/importantDateRemindersStore';
import type { ReminderOffsetDays } from '../storage/importantDateReminderTypes';

export type ImportantDateScheduledReminder = {
  /** `${eventId}:${occurrenceYmd}:${offset}` */
  id: string;
  event: ImportantDateEvent;
  offset: ReminderOffsetDays;
  /** 前 7 天 / 當天 */
  reasonLabel: string;
  occurrenceYmd: string;
  daysUntilEvent: number;
  /** 0 = 今天應顯示提醒 */
  daysUntilAlert: number;
};

export function reminderOffsetReasonLabel(offset: ReminderOffsetDays): string {
  return offset === 0 ? '當天' : `前 ${offset} 天`;
}

export function makeImportantDateReminderId(
  eventId: string,
  occurrenceYmd: string,
  offset: ReminderOffsetDays
): string {
  return `${eventId}:${occurrenceYmd}:${offset}`;
}

function addDaysToDateKey(base: string, days: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function isDismissedToday(data: ImportantDateRemindersData, reminderId: string, day: string): boolean {
  return data.dismissedAck?.[reminderId] === day;
}

/** 依 offsets 排出本週期的所有提醒排程（含今天與未來） */
export function buildScheduledRemindersForEvent(
  event: ImportantDateEvent,
  offsets: ReminderOffsetDays[],
  from: Date = new Date()
): ImportantDateScheduledReminder[] {
  const day = todayKey(from);
  const occurrenceYmd = addDaysToDateKey(day, event.daysUntil);
  const uniqueOffsets = [...new Set(offsets)].sort((a, b) => b - a) as ReminderOffsetDays[];
  const out: ImportantDateScheduledReminder[] = [];

  for (const offset of uniqueOffsets) {
    if (event.daysUntil < offset) continue;
    const daysUntilAlert = event.daysUntil - offset;
    out.push({
      id: makeImportantDateReminderId(event.id, occurrenceYmd, offset),
      event,
      offset,
      reasonLabel: reminderOffsetReasonLabel(offset),
      occurrenceYmd,
      daysUntilEvent: event.daysUntil,
      daysUntilAlert,
    });
  }

  return out.sort((a, b) => a.daysUntilAlert - b.daysUntilAlert);
}

export type ImportantDateReminderBuckets = {
  today: ImportantDateScheduledReminder[];
  future: ImportantDateScheduledReminder[];
};

export function computeImportantDateReminderBuckets(
  profile: CoupleExtendedProfile,
  reminders: ImportantDateRemindersData,
  from: Date = new Date()
): ImportantDateReminderBuckets {
  const day = todayKey(from);
  const events = buildImportantDateEvents(profile, from);
  const today: ImportantDateScheduledReminder[] = [];
  const future: ImportantDateScheduledReminder[] = [];

  for (const event of events) {
    if (event.status === 'past') continue;
    const settings = getEventSettings(reminders, event.id);
    if (settings.offsets.length === 0) continue;

    for (const row of buildScheduledRemindersForEvent(event, settings.offsets, from)) {
      if (row.daysUntilAlert === 0) {
        if (!isDismissedToday(reminders, row.id, day)) today.push(row);
      } else if (row.daysUntilAlert > 0) {
        future.push(row);
      }
    }
  }

  today.sort((a, b) => a.daysUntilEvent - b.daysUntilEvent);
  future.sort((a, b) => a.daysUntilAlert - b.daysUntilAlert || a.daysUntilEvent - b.daysUntilEvent);

  return { today, future };
}

/** @deprecated 首頁橫幅改用 computeImportantDateReminderBuckets().today */
export function getTodayImportantDateReminders(
  profile: CoupleExtendedProfile,
  reminders: ImportantDateRemindersData,
  from?: Date
): ImportantDateScheduledReminder[] {
  return computeImportantDateReminderBuckets(profile, reminders, from).today;
}

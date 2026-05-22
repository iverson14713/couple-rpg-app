import type { CoupleExtendedProfile } from '../storage/coupleExtendedTypes';
import { formatEnabledOffsetsLabel, getEventSettings, type ImportantDateRemindersData } from '../storage/importantDateRemindersStore';
import { buildImportantDateEvents, type ImportantDateEvent } from './importantDateEvents';
import { hasHomeImportantDatesConfigured, type UpcomingImportant } from './importantDates';

/** 首頁大型提醒卡：下一個最近的重要日子（今天優先，其次即將到來） */
export function getNextHomeImportantDateEvent(
  profile: CoupleExtendedProfile,
  from: Date = new Date()
): ImportantDateEvent | null {
  if (!hasHomeImportantDatesConfigured(profile)) return null;
  const events = buildImportantDateEvents(profile, from);
  if (events.length === 0) return null;
  return events.find((e) => e.isToday) ?? events.find((e) => e.status !== 'past') ?? events[0];
}

/** 首頁收合摘要附加提醒設定（不影響 getUpcomingImportantDates） */
export function appendReminderToSummary(
  summary: string,
  previewItem: UpcomingImportant | undefined,
  reminders: ImportantDateRemindersData
): string {
  if (!previewItem) return summary;
  const settings = getEventSettings(reminders, previewItem.id);
  if (settings.offsets.length === 0) return summary;
  const hint = formatEnabledOffsetsLabel(settings.offsets);
  return `${summary} · 提醒：${hint}`;
}

/** 14 天內最重要 1 筆首頁小提醒 */
export function getPrimaryHomeDateNudge(
  profile: CoupleExtendedProfile,
  reminders: ImportantDateRemindersData,
  from: Date = new Date()
): string | null {
  const events = buildImportantDateEvents(profile, from);
  const candidates = events.filter((e) => e.isToday || (e.status === 'upcoming' && e.daysUntil <= 14));
  if (candidates.length === 0) return null;

  const pick = pickNudgeEvent(candidates);
  if (!pick) return null;

  if (pick.isToday) {
    return `今天是${pick.displayTitle}，記得準備驚喜 🎁`;
  }
  return `快到${pick.displayTitle}了，記得準備驚喜 🎁`;
}

function pickNudgeEvent(events: ImportantDateEvent[]): ImportantDateEvent | null {
  const today = events.find((e) => e.isToday);
  if (today) return today;
  const upcoming = events.filter((e) => e.status === 'upcoming').sort((a, b) => a.daysUntil - b.daysUntil);
  return upcoming[0] ?? null;
}

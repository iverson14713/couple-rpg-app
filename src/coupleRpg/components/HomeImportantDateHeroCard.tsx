import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { getNextHomeImportantDateEvent } from '../lib/importantDateHomeReminder';
import { hasHomeImportantDatesConfigured } from '../lib/importantDates';
import type { ImportantDateScheduledReminder } from '../lib/importantDateReminderEngine';
import { lq } from '../theme';

/** 首頁：重要日子橫向小提醒（無設定時不佔位） */
export function HomeImportantDateHeroCard() {
  const { navigateTo } = useCoupleRpgNav();
  const { coupleExtended, todayImportantDateReminders } = useLoveQuest();

  const hasConfigured = useMemo(
    () => hasHomeImportantDatesConfigured(coupleExtended),
    [coupleExtended]
  );
  const nextEvent = useMemo(
    () => getNextHomeImportantDateEvent(coupleExtended),
    [coupleExtended]
  );
  const primaryToday = todayImportantDateReminders[0] ?? null;

  if (!hasConfigured) return null;

  const goReminders = () => navigateTo('importantDates');

  const label = primaryToday
    ? formatTodayStrip(primaryToday)
    : nextEvent
      ? formatUpcomingStrip(nextEvent)
      : null;

  if (!label) return null;

  return (
    <button
      type="button"
      onClick={goReminders}
      className={`mb-2 flex min-h-[40px] w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition active:scale-[0.99] active:opacity-95 ${lq.cardSoft} ring-1 ring-rose-100/80`}
      aria-label="查看重要日子"
    >
      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-stone-800">{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-rose-400" aria-hidden />
    </button>
  );
}

function formatTodayStrip(reminder: ImportantDateScheduledReminder): string {
  const { event } = reminder;
  const when = event.isToday ? '今天' : `${event.daysUntil} 天後`;
  return `${event.icon} ${event.displayTitle}・${when}`;
}

function formatUpcomingStrip(
  event: NonNullable<ReturnType<typeof getNextHomeImportantDateEvent>>
): string {
  const when = event.isToday ? '今天' : `${event.daysUntil} 天後`;
  return `${event.icon} ${event.displayTitle}・${when}`;
}

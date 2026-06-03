import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatYmdChinese, type ImportantDateEvent } from '../lib/importantDateEvents';
import { getNextHomeImportantDateEvent } from '../lib/importantDateHomeReminder';
import { hasHomeImportantDatesConfigured } from '../lib/importantDates';
import type { ImportantDateScheduledReminder } from '../lib/importantDateReminderEngine';
import { lq } from '../theme';

/** 首頁：重要日子中型情感卡（無設定或無近期提醒時不佔位） */
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

  const event = primaryToday?.event ?? nextEvent;
  if (!event) return null;

  const goReminders = () => navigateTo('importantDates');

  return (
    <button
      type="button"
      onClick={goReminders}
      className={`mb-2 flex min-h-[5.5rem] max-h-[6.25rem] w-full items-stretch gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100/90 via-pink-50 to-white px-3.5 py-3 text-left shadow-sm ring-1 ring-rose-200/70 transition active:scale-[0.99] active:opacity-95`}
      aria-label={`查看${event.displayTitle}提醒`}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <p className={`truncate text-[15px] font-extrabold leading-tight text-rose-950`}>
          <span aria-hidden>{event.icon}</span> {event.displayTitle}
        </p>
        <p className="truncate text-[13px] font-semibold text-rose-800/90">
          {formatDateCountdownLine(event, primaryToday)}
        </p>
        <p className={`line-clamp-1 text-[11px] font-medium ${lq.textSecondary}`}>
          {nudgeLine(event, primaryToday)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center justify-center border-l border-rose-200/50 pl-3 pr-0.5">
        <CountdownBadge event={event} primaryToday={primaryToday} />
        <ChevronRight className="mt-0.5 h-4 w-4 text-rose-400/90" aria-hidden />
      </div>
    </button>
  );
}

function CountdownBadge({
  event,
  primaryToday,
}: {
  event: ImportantDateEvent;
  primaryToday: ImportantDateScheduledReminder | null;
}) {
  if (event.isToday) {
    return (
      <div className="text-center leading-none">
        <span className="block text-[20px] font-black text-rose-600">今天</span>
      </div>
    );
  }
  const days = primaryToday?.daysUntilEvent ?? event.daysUntil;
  return (
    <div className="text-center leading-none tabular-nums">
      <span className="block text-[26px] font-black text-rose-600">{days}</span>
      <span className="mt-0.5 block text-[10px] font-bold tracking-wide text-rose-500">天後</span>
    </div>
  );
}

function formatDateCountdownLine(
  event: ImportantDateEvent,
  primaryToday: ImportantDateScheduledReminder | null
): string {
  const datePart = formatYmdChinese(event.dateYmd);
  if (event.isToday) return `${datePart}・就是今天`;
  const days = primaryToday ? primaryToday.daysUntilEvent : event.daysUntil;
  return `${datePart}・還有 ${days} 天`;
}

function nudgeLine(
  event: ImportantDateEvent,
  primaryToday: ImportantDateScheduledReminder | null
): string {
  if (event.isToday) return '今天留一點時間給彼此吧';
  const days = primaryToday ? primaryToday.daysUntilEvent : event.daysUntil;
  if (days <= 3) return '提前準備一點小驚喜吧';
  if (days <= 14) return '還來得及規劃小小的儀式感';
  return '先記在心上，慢慢準備';
}

import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import type { ImportantDateEvent } from '../lib/importantDateEvents';
import { getNextHomeImportantDateEvent } from '../lib/importantDateHomeReminder';
import { hasHomeImportantDatesConfigured } from '../lib/importantDates';
import type { ImportantDateScheduledReminder } from '../lib/importantDateReminderEngine';
import { HomeDecorIllustration } from './ui/HomeDecorIllustration';

/** 首頁：重要日子（設計稿獨立白卡） */
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
      className="lq-home-anniversary lq-home-elev lq-home-section-in relative isolate flex w-full items-center gap-3 overflow-hidden rounded-[22px] px-3.5 py-3.5 text-left transition active:scale-[0.995]"
      aria-label={`查看${event.displayTitle}提醒`}
    >
      <HomeDecorIllustration id="calendar" role="anniversary" />

      <div className="relative z-10 min-w-0 flex-1 py-0.5">
        <p className="truncate text-[16px] font-extrabold leading-tight text-rose-950">
          {event.displayTitle}
        </p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-rose-600/70">
          {formatDateCountdownLine(event, primaryToday)}
        </p>
        {!event.isToday ? (
          <p className="mt-1 truncate text-[10px] font-normal text-rose-400/80">
            提前準備一點小驚喜吧！
          </p>
        ) : null}
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-1 pl-1">
        <CountdownBadge event={event} primaryToday={primaryToday} />
        <ChevronRight className="h-4 w-4 text-rose-300" aria-hidden />
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
      <div className="px-1 text-right leading-none">
        <span className="block text-[22px] font-black text-rose-500">今天</span>
      </div>
    );
  }
  const days = primaryToday?.daysUntilEvent ?? event.daysUntil;
  return (
    <div className="px-1 text-right leading-none tabular-nums">
      <span className="block text-[11px] font-bold text-rose-400">還有</span>
      <span className="block text-[26px] font-black leading-none text-rose-500">{days}</span>
      <span className="block text-[11px] font-bold text-rose-400">天</span>
    </div>
  );
}

function formatDateCountdownLine(
  event: ImportantDateEvent,
  primaryToday: ImportantDateScheduledReminder | null
): string {
  const datePart = formatHomeDateLabel(event.dateYmd);
  if (event.isToday) return datePart;
  const days = primaryToday ? primaryToday.daysUntilEvent : event.daysUntil;
  return `${datePart} · ${days} 天後`;
}

function formatHomeDateLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const labels = ['日', '一', '二', '三', '四', '五', '六'] as const;
  const w = labels[new Date(y, m - 1, d).getDay()] ?? '—';
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}.${mm}.${dd}（週${w}）`;
}

/** Showcase 相容 */
export function HomeImportantDateInset() {
  return <HomeImportantDateHeroCard />;
}

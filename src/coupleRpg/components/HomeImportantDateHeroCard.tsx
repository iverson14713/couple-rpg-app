import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatYmdChinese } from '../lib/importantDateEvents';
import { getNextHomeImportantDateEvent } from '../lib/importantDateHomeReminder';
import { hasHomeImportantDatesConfigured } from '../lib/importantDates';
import type { ImportantDateScheduledReminder } from '../lib/importantDateReminderEngine';
import { lq } from '../theme';

export function HomeImportantDateHeroCard() {
  const { navigateTo } = useCoupleRpgNav();
  const {
    coupleExtended,
    todayImportantDateReminders,
    dismissImportantDateReminder,
  } = useLoveQuest();

  const hasConfigured = useMemo(
    () => hasHomeImportantDatesConfigured(coupleExtended),
    [coupleExtended]
  );
  const nextEvent = useMemo(
    () => getNextHomeImportantDateEvent(coupleExtended),
    [coupleExtended]
  );
  const primaryToday = todayImportantDateReminders[0] ?? null;

  const goReminders = () => navigateTo('importantDates');
  const goAddDates = () =>
    navigateTo('profile', { profileSection: 'settings', scrollToElementId: 'lq-couple-profile' });

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={hasConfigured ? goReminders : goAddDates}
        className={`group relative w-full overflow-hidden p-5 text-left transition active:scale-[0.99] active:opacity-95 ${lq.cardHero}`}
        aria-label={hasConfigured ? '查看重要日子提醒' : '新增重要日子'}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-rose-200/25 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-4 h-28 w-28 rounded-full bg-pink-200/20 blur-2xl"
          aria-hidden
        />

        {hasConfigured && primaryToday ? (
          <TodayReminderHero reminder={primaryToday} />
        ) : hasConfigured && nextEvent ? (
          <ConfiguredHero event={nextEvent} />
        ) : (
          <EmptyHero />
        )}

        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-300/80 transition group-active:translate-x-0.5"
          aria-hidden
        >
          <ChevronRight className="h-6 w-6" strokeWidth={2.25} />
        </span>
      </button>

      {todayImportantDateReminders.slice(primaryToday ? 1 : 0).map((r) => (
        <TodayReminderStrip
          key={r.id}
          reminder={r}
          onDismiss={() => dismissImportantDateReminder(r.id)}
        />
      ))}
    </section>
  );
}

function TodayReminderHero({ reminder }: { reminder: ImportantDateScheduledReminder }) {
  const { event } = reminder;
  const dateText = formatYmdChinese(event.dateYmd);

  return (
    <div className="relative pr-8">
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">今天該提醒</p>
      <div className="mt-3 flex items-center gap-3.5">
        <span className={`h-[4.25rem] w-[4.25rem] text-[2.75rem] leading-none ${lq.iconChip}`}>
          {event.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[22px] font-extrabold leading-tight ${lq.text}`}>
            {event.displayTitle}
          </p>
          <p className={`mt-1 text-[13px] font-semibold ${lq.textSecondary}`}>
            {dateText}
            <span className="mx-1.5 text-stone-300">·</span>
            提醒：{reminder.reasonLabel}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {event.isToday ? (
            <p className="text-[2rem] font-black leading-none tracking-tight text-rose-600">今天</p>
          ) : (
            <>
              <p className="text-[2.75rem] font-black tabular-nums leading-none text-rose-600">
                {event.daysUntil}
              </p>
              <p className="mt-0.5 text-[15px] font-extrabold text-rose-400">天後</p>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 text-[12px] font-medium text-stone-500">
        打開 App 時提醒 · 正式推播通知將於後續版本加入
      </p>
    </div>
  );
}

function TodayReminderStrip({
  reminder,
  onDismiss,
}: {
  reminder: ImportantDateScheduledReminder;
  onDismiss: () => void;
}) {
  const { event } = reminder;
  return (
    <p className="mt-2 flex items-center gap-2 rounded-2xl bg-amber-50/90 px-3.5 py-2.5 text-[12px] text-amber-950 ring-1 ring-amber-200/50">
      <span className="min-w-0 flex-1 truncate">
        {event.icon} {event.displayTitle} · 提醒：{reminder.reasonLabel}
        {event.isToday ? ' · 就是今天' : ` · 還有 ${event.daysUntil} 天`}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 font-bold text-amber-800 active:opacity-70"
      >
        知道了
      </button>
    </p>
  );
}

function ConfiguredHero({
  event,
}: {
  event: NonNullable<ReturnType<typeof getNextHomeImportantDateEvent>>;
}) {
  const dateText = formatYmdChinese(event.dateYmd);

  return (
    <div className="relative pr-8">
      <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500/90">下一個重要日子</p>

      <div className="mt-3 flex items-center gap-3.5">
        <span className={`h-[4.25rem] w-[4.25rem] text-[2.75rem] leading-none ${lq.iconChip}`}>
          {event.icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-[22px] font-extrabold leading-tight ${lq.text}`}>{event.displayTitle}</p>
          <p className={`mt-1 text-[13px] font-semibold ${lq.textSecondary}`}>
            {event.typeLabel}
            <span className="mx-1.5 text-stone-300">·</span>
            {dateText}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {event.isToday ? (
            <p className="text-[2rem] font-black leading-none tracking-tight text-rose-600">今天</p>
          ) : (
            <>
              <p className="text-[2.75rem] font-black tabular-nums leading-none text-rose-600">{event.daysUntil}</p>
              <p className="mt-0.5 text-[15px] font-extrabold text-rose-400">天後</p>
            </>
          )}
        </div>
      </div>

      {event.isToday ? (
        <p className="mt-3 text-[13px] font-semibold text-rose-600/90">今天是值得慶祝的一天，記得準備小驚喜 💕</p>
      ) : (
        <p className="mt-3 text-[12px] font-medium text-stone-500">點擊查看提醒設定 · 打開 App 時提醒</p>
      )}
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="relative pr-8">
      <span className="text-[2.5rem] leading-none" aria-hidden>
        ❤️
      </span>
      <p className={`mt-2 text-[20px] font-extrabold leading-snug ${lq.text}`}>還沒設定重要日子 ❤️</p>
      <p className="mt-1.5 max-w-[280px] text-[14px] font-medium leading-snug text-stone-500">
        新增後可在打開 App 時提醒你們的重要紀念日
      </p>
      <span className="mt-4 inline-flex items-center gap-1 rounded-xl bg-rose-500 px-4 py-2.5 text-[14px] font-bold text-white shadow-sm shadow-rose-300/40">
        ＋ 新增重要日子
      </span>
    </div>
  );
}

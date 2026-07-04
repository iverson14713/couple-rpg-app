import { useCallback, useMemo, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { EmptyState } from './EmptyState';
import { ImportantDateAiSheet } from './ImportantDateAiSheet';
import { ImportantDateEventCard } from './ImportantDateEventCard';
import { RecentImportantDateAiCard } from './RecentImportantDateAiCard';
import {
  savedEventToImportantDateEvent,
  type SavedImportantDateAi,
} from '../storage/importantDateAiCache';
import { buildImportantDateEvents, type ImportantDateEvent } from '../lib/importantDateEvents';
import {
  importantDateHeroMood,
  importantDateHeroSubline,
} from '../lib/importantDateHeroMood';
import { importantDateTheme } from '../lib/importantDateThemes';
import {
  getEventSettings,
  toggleOffsetsInList,
  updateEventSettings,
} from '../storage/importantDateRemindersStore';
import type { ReminderOffsetDays } from '../storage/importantDateReminderTypes';
import { ImportantDateReminderList } from './ImportantDateReminderList';
import { ImportantDatePushSettings } from './ImportantDatePushSettings';
import { ImportantDateDebugNotificationButton } from './ImportantDateDebugNotificationButton';
import {
  AI_IMPORTANT_DATE_PRO_LOCK,
  AI_IMPORTANT_DATE_SUBTITLE,
  AI_IMPORTANT_DATE_TITLE,
} from '../lib/aiQuotaMessages';
import { useAiUsage } from '../hooks/useAiUsage';
import { useProFeature } from '../hooks/useProFeature';
import { useUserPlan } from '../context/UserPlanContext';
import { AiUsageQuotaLabel } from './AiUsageQuotaLabel';
import { ProBadgeIfNeeded } from './ProBadge';
import { IMPORTANT_DATE_REMINDERS_ANCHOR_ID } from '../lib/settingsNav';
import { lq } from '../theme';

type Props = {
  showBack?: boolean;
  compactHero?: boolean;
  onBack?: () => void;
};

function copyOffsets(offsets: ReminderOffsetDays[]): ReminderOffsetDays[] {
  return [...offsets];
}

export function ImportantDateRemindersSection({ showBack, compactHero, onBack }: Props) {
  const { navigateTo } = useCoupleRpgNav();
  const {
    coupleExtended,
    importantDateReminders,
    patchImportantDateReminder,
    rescheduleImportantDatePush,
    todayImportantDateReminders,
    futureImportantDateReminders,
    dismissImportantDateReminder,
  } = useLoveQuest();
  const datesPro = useProFeature('important_dates_unlimited');
  const aiPro = useProFeature('ai_in_app');
  const aiUsage = useAiUsage();
  const { isPro, openUpgradeModal } = useUserPlan();
  const eventsListRef = useRef<HTMLDivElement>(null);

  const events = useMemo(() => {
    try {
      return buildImportantDateEvents(coupleExtended);
    } catch (e) {
      console.error('[important-dates] build events failed:', e);
      return [];
    }
  }, [coupleExtended]);

  const nextEvent = useMemo(() => {
    return (
      events.find((e) => e.isToday || e.status === 'upcoming') ??
      events.find((e) => e.status === 'past') ??
      events[0] ??
      null
    );
  }, [events]);

  const upcomingPreview = useMemo(() => {
    return events.filter((e) => e.isToday || e.status === 'upcoming').slice(0, 3);
  }, [events]);

  const settingsByEventId = useMemo(() => {
    const map: Record<string, ReturnType<typeof getEventSettings>> = {};
    for (const ev of events) {
      map[ev.id] = getEventSettings(importantDateReminders, ev.id);
    }
    return map;
  }, [events, importantDateReminders]);

  const [reminderEditId, setReminderEditId] = useState<string | null>(null);
  const [offsetDrafts, setOffsetDrafts] = useState<Record<string, ReminderOffsetDays[]>>({});
  const [aiEvent, setAiEvent] = useState<ImportantDateEvent | null>(null);
  const [savedImportantView, setSavedImportantView] = useState<SavedImportantDateAi | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [futureRemindersExpanded, setFutureRemindersExpanded] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }, []);

  const openEdit = useCallback(
    (eventId: string) => {
      const saved = getEventSettings(importantDateReminders, eventId);
      setOffsetDrafts((prev) => ({ ...prev, [eventId]: copyOffsets(saved.offsets) }));
      setReminderEditId(eventId);
    },
    [importantDateReminders]
  );

  const closeEdit = useCallback(() => {
    setReminderEditId(null);
  }, []);

  const toggleDraftOffset = useCallback((eventId: string, offset: ReminderOffsetDays) => {
    setOffsetDrafts((prev) => {
      const cur = copyOffsets(
        prev[eventId] ?? getEventSettings(importantDateReminders, eventId).offsets
      );
      return { ...prev, [eventId]: toggleOffsetsInList(cur, offset) };
    });
  }, [importantDateReminders]);

  const toggleGift = useCallback(
    (eventId: string) => {
      patchImportantDateReminder((d) => {
        const s = getEventSettings(d, eventId);
        return updateEventSettings(d, eventId, { giftPrepared: !s.giftPrepared });
      });
    },
    [patchImportantDateReminder]
  );

  const toggleActivity = useCallback(
    (eventId: string) => {
      patchImportantDateReminder((d) => {
        const s = getEventSettings(d, eventId);
        return updateEventSettings(d, eventId, { activityPlanned: !s.activityPlanned });
      });
    },
    [patchImportantDateReminder]
  );

  const openAi = useCallback(
    (eventId: string) => {
      if (!isPro) {
        openUpgradeModal(AI_IMPORTANT_DATE_PRO_LOCK);
        return;
      }
      const ev = events.find((e) => e.id === eventId);
      if (ev) setAiEvent(ev);
    },
    [events, isPro, openUpgradeModal]
  );

  const saveOffsets = useCallback(
    (eventId: string) => {
      const draft = offsetDrafts[eventId];
      if (!draft) {
        closeEdit();
        return;
      }
      patchImportantDateReminder((data) => updateEventSettings(data, eventId, { offsets: copyOffsets(draft) }));
      setReminderEditId(null);
      flashSaved();
    },
    [offsetDrafts, patchImportantDateReminder, closeEdit, flashSaved]
  );

  const scrollToAllEvents = useCallback(() => {
    setEventsExpanded(true);
    window.setTimeout(() => {
      eventsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  const aiButtonLabel = !isPro
    ? 'Pro 解鎖'
    : !aiUsage.canUseAi
      ? 'AI 額度已用完'
      : 'AI 驚喜';

  const openAiForNext = useCallback(() => {
    if (!nextEvent) return;
    openAi(nextEvent.id);
  }, [nextEvent, openAi]);

  return (
    <section id={IMPORTANT_DATE_REMINDERS_ANCHOR_ID} className={compactHero ? '' : 'mb-4'}>
      {showBack ? (
        <button
          type="button"
          onClick={() => (onBack ? onBack() : navigateTo('home'))}
          className="mb-2 flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {onBack ? '返回設定' : '返回'}
        </button>
      ) : null}

      {/* Hero */}
      {!compactHero && nextEvent ? (
        <NextImportantDateHero event={nextEvent} datesProBadge={datesPro.showProBadge} />
      ) : null}

      {!compactHero && !nextEvent ? (
        <header className="mb-3 rounded-[24px] bg-gradient-to-br from-rose-100/90 via-pink-50 to-violet-50 px-4 py-5 text-center shadow-sm ring-1 ring-rose-100/80">
          <p className="text-[13px] font-bold text-rose-500">❤️ 下一個重要日子</p>
          <p className={`mt-2 text-[15px] font-extrabold ${lq.text}`}>還沒有設定重要日子</p>
          <p className="mt-1 text-[12px] font-semibold text-stone-500">先填寫生日與紀念日，開始期待吧</p>
        </header>
      ) : null}

      {compactHero ? (
        <div className="mb-3 flex items-center gap-2 px-0.5">
          <span className="text-xl" aria-hidden>
            ❤️
          </span>
          <div>
            <h2 className={`flex flex-wrap items-center gap-1.5 ${lq.sectionTitleSm}`}>
              重要日子
              <ProBadgeIfNeeded show={datesPro.showProBadge} feature="important_dates_unlimited" size="sm" />
            </h2>
            <p className={`text-[12px] ${lq.textSecondary}`}>期待下一個特別的日子</p>
          </div>
        </div>
      ) : null}

      {/* AI CTA */}
      <section className="mb-3 overflow-hidden rounded-[22px] bg-gradient-to-br from-violet-50 via-rose-50/80 to-amber-50/60 p-4 shadow-sm ring-1 ring-violet-100/70">
        <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-extrabold text-stone-900">
          ✨ {AI_IMPORTANT_DATE_TITLE}
          <ProBadgeIfNeeded show={!isPro} feature="ai_in_app" size="sm" />
        </p>
        <p className="mt-1 text-[12px] font-semibold leading-relaxed text-stone-600">
          {AI_IMPORTANT_DATE_SUBTITLE}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {nextEvent ? (
            <button
              type="button"
              onClick={openAiForNext}
              className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]"
            >
              ✨ AI 幫我安排驚喜
            </button>
          ) : null}
          {!isPro ? (
            <button
              type="button"
              onClick={() => openUpgradeModal(AI_IMPORTANT_DATE_PRO_LOCK)}
              className="text-[12px] font-bold text-violet-700 active:opacity-70"
            >
              升級 Pro 解鎖 →
            </button>
          ) : (
            <AiUsageQuotaLabel variant="badge" />
          )}
        </div>
      </section>

      {showBack ? (
        <RecentImportantDateAiCard onView={setSavedImportantView} className="mb-3" />
      ) : null}

      <ImportantDatePushSettings onPermissionGranted={() => void rescheduleImportantDatePush()} />
      <ImportantDateDebugNotificationButton />

      {savedFlash ? (
        <p className="mb-2 rounded-xl bg-emerald-50 px-3 py-2 text-center text-[12px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
          提醒設定已儲存 · 已重新排程本機推播
        </p>
      ) : null}

      {/* Today */}
      {events.length > 0 ? (
        <div className="mb-3">
          {todayImportantDateReminders.length > 0 ? (
            <div className="rounded-[20px] bg-white/85 p-3 shadow-sm ring-1 ring-rose-100/70">
              <h3 className="mb-2 text-[13px] font-extrabold text-stone-800">今日提醒</h3>
              <ImportantDateReminderList
                items={todayImportantDateReminders}
                variant="today"
                onDismiss={dismissImportantDateReminder}
              />
            </div>
          ) : (
            <p className="px-1 py-1 text-center text-[12px] font-semibold text-stone-400">
              今天沒有需要提醒的事情 ❤️
            </p>
          )}
        </div>
      ) : null}

      {/* Upcoming preview — only when list is long; otherwise full cards below suffice */}
      {events.length > 3 && upcomingPreview.length > 0 && !eventsExpanded ? (
        <section className="mb-4">
          <h3 className="mb-2 px-0.5 text-[14px] font-extrabold text-stone-800">📅 即將到來</h3>
          <ul className="space-y-2">
            {upcomingPreview.map((ev) => {
              const theme = importantDateTheme(ev.kind, ev.name);
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={scrollToAllEvents}
                    className={`flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left shadow-sm active:scale-[0.99] ${theme.card}`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${theme.iconBg}`}>
                      {ev.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-extrabold text-stone-900">{ev.name}</p>
                      <p className={`text-[11px] font-semibold ${theme.muted}`}>{ev.dateLabel}</p>
                    </div>
                    <p className={`shrink-0 text-[15px] font-black ${theme.accent}`}>
                      {ev.isToday ? '今天' : `${ev.daysUntil} 天`}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={scrollToAllEvents}
            className="mt-2 w-full py-2 text-center text-[12px] font-bold text-rose-600 active:opacity-70"
          >
            查看全部
          </button>
        </section>
      ) : null}

      {/* Future push reminders — show 3 */}
      {events.length > 0 && futureImportantDateReminders.length > 0 ? (
        <div className="mb-4 rounded-[20px] bg-white/70 p-3 shadow-sm ring-1 ring-stone-100/80">
          <h3 className="mb-2 text-[12px] font-bold text-stone-500">推播提醒預覽</h3>
          <ImportantDateReminderList
            items={
              futureRemindersExpanded
                ? futureImportantDateReminders
                : futureImportantDateReminders.slice(0, 3)
            }
            variant="future"
          />
          {futureImportantDateReminders.length > 3 ? (
            <button
              type="button"
              onClick={() => setFutureRemindersExpanded((v) => !v)}
              className="mt-2 w-full py-2 text-center text-[12px] font-bold text-rose-600 active:opacity-70"
            >
              {futureRemindersExpanded
                ? '收合'
                : `查看全部（${futureImportantDateReminders.length}）`}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Full event list */}
      <div ref={eventsListRef}>
        {events.length === 0 ? (
          <EmptyState
            emoji="📅"
            title="還沒有重要日子"
            hint="請先在情侶資料填寫另一半生日與紀念日"
            className="rounded-[22px] bg-white/80 ring-1 ring-rose-100/70"
            action={
              showBack ? (
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('profile', {
                      profileSection: 'settings',
                      scrollToElementId: 'lq-couple-profile',
                    })
                  }
                  className="mt-3 rounded-xl bg-rose-500 px-4 py-2.5 text-[13px] font-bold text-white active:opacity-90"
                >
                  前往情侶資料新增
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between px-0.5">
              <h3 className="text-[14px] font-extrabold text-stone-800">重要日子</h3>
              {showBack ? (
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('profile', {
                      profileSection: 'settings',
                      scrollToElementId: 'lq-couple-profile',
                    })
                  }
                  className="text-[11px] font-bold text-rose-600 active:opacity-70"
                >
                  編輯資料
                </button>
              ) : null}
            </div>
            {events.length <= 3 || eventsExpanded ? (
              <>
                <ul className="space-y-2.5">
                  {events.map((ev) => {
                    const settings =
                      settingsByEventId[ev.id] ?? getEventSettings(importantDateReminders, ev.id);
                    const isEditing = reminderEditId === ev.id;
                    const draftOffsets =
                      offsetDrafts[ev.id] ??
                      (isEditing ? copyOffsets(settings.offsets) : settings.offsets);

                    return (
                      <ImportantDateEventCard
                        key={ev.id}
                        event={ev}
                        savedOffsets={settings.offsets}
                        giftPrepared={settings.giftPrepared}
                        activityPlanned={settings.activityPlanned}
                        isEditing={isEditing}
                        draftOffsets={draftOffsets}
                        onOpenEdit={openEdit}
                        onCloseEdit={closeEdit}
                        onToggleDraftOffset={toggleDraftOffset}
                        onSaveOffsets={saveOffsets}
                        onToggleGift={toggleGift}
                        onToggleActivity={toggleActivity}
                        onOpenAi={openAi}
                        aiDisabled={isPro && !aiUsage.canUseAi}
                        showAiProBadge={!isPro || aiPro.showProBadge}
                        aiButtonLabel={aiButtonLabel}
                      />
                    );
                  })}
                </ul>
                {events.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setEventsExpanded(false)}
                    className="mt-2 flex w-full items-center justify-center gap-1 py-2.5 text-[12px] font-bold text-rose-600 active:opacity-70"
                  >
                    收合列表
                  </button>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>

      {aiEvent ? (
        <ImportantDateAiSheet
          event={aiEvent}
          initialPrefs={getEventSettings(importantDateReminders, aiEvent.id).partnerPrefs}
          onClose={() => setAiEvent(null)}
          onSavePrefs={(prefs) => {
            patchImportantDateReminder((d) => updateEventSettings(d, aiEvent.id, { partnerPrefs: prefs }));
          }}
        />
      ) : null}

      {savedImportantView ? (
        <ImportantDateAiSheet
          event={savedEventToImportantDateEvent(savedImportantView.event)}
          initialPrefs={savedImportantView.settings.partnerPrefs}
          savedRecord={savedImportantView}
          onClose={() => setSavedImportantView(null)}
          onSavePrefs={() => {}}
        />
      ) : null}
    </section>
  );
}

function NextImportantDateHero({
  event,
  datesProBadge,
}: {
  event: ImportantDateEvent;
  datesProBadge: boolean;
}) {
  const mood = importantDateHeroMood(event);
  const subline = importantDateHeroSubline(event);

  return (
    <header className="lq-important-date-hero relative mb-4 overflow-hidden rounded-[28px] px-5 pb-5 pt-4 text-center shadow-[0_16px_36px_-18px_rgba(244,114,182,0.45)]">
      <div className="lq-important-date-hero__glass" aria-hidden />
      <div className="relative z-10">
        <p className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-rose-700/90">
          ❤️ 下一個重要日子
          <ProBadgeIfNeeded show={datesProBadge} feature="important_dates_unlimited" size="sm" />
        </p>
        <p className="mt-3 text-[18px] font-extrabold text-rose-950">
          {event.icon} {event.name}
        </p>

        {event.isToday ? (
          <p className="mt-3 text-[42px] font-black leading-none tracking-tight text-rose-600">今天</p>
        ) : event.status === 'past' ? (
          <p className="mt-3 text-[15px] font-bold text-rose-700/80">已過 {event.daysSince} 天</p>
        ) : (
          <>
            <p className="mt-2 text-[12px] font-bold text-rose-500/90">還有</p>
            <p className="text-[64px] font-black leading-none tracking-tight text-rose-600">
              {event.daysUntil}
            </p>
            <p className="mt-1 text-[13px] font-bold text-rose-500/90">天</p>
          </>
        )}

        <p className="mt-3 text-[13px] font-bold text-rose-800/85">{event.dateLabel}</p>
        <p className="mt-1 text-[12px] font-semibold text-rose-700/75">{subline}</p>
        <p className="mt-3 text-[12px] font-semibold leading-relaxed text-rose-600/90">{mood}</p>
      </div>
    </header>
  );
}

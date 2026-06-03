import { useCallback, useMemo, useState } from 'react';
import { Bell, ChevronLeft } from 'lucide-react';
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

  const events = useMemo(() => {
    try {
      return buildImportantDateEvents(coupleExtended);
    } catch (e) {
      console.error('[important-dates] build events failed:', e);
      return [];
    }
  }, [coupleExtended]);

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

  const aiButtonLabel = !isPro
    ? 'Pro 解鎖'
    : !aiUsage.canUseAi
      ? 'AI 額度已用完'
      : 'AI 行程';

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

      {showBack ? (
        <RecentImportantDateAiCard onView={setSavedImportantView} className="mb-3" />
      ) : null}

      {!compactHero ? (
        <header className={`mb-3 p-3.5 ${lq.card}`}>
          <span className="text-3xl" aria-hidden>
            🔔
          </span>
          <h1 className={`mt-1 flex flex-wrap items-center gap-2 ${lq.pageTitle}`}>
            重要日子提醒
            <ProBadgeIfNeeded show={datesPro.showProBadge} feature="important_dates_unlimited" />
          </h1>
          <p className={`mt-0.5 text-[13px] ${lq.textSecondary}`}>
            記住生日與紀念日 · iPhone 本機推播提醒
          </p>
          <div className="mt-2">
            <AiUsageQuotaLabel variant="badge" />
          </div>
          {showBack ? (
            <button
              type="button"
              onClick={() =>
                navigateTo('profile', {
                  profileSection: 'settings',
                  scrollToElementId: 'lq-couple-profile',
                })
              }
              className="mt-3 text-[12px] font-bold text-rose-600 active:opacity-70"
            >
              ＋ 新增 / 編輯重要日子
            </button>
          ) : null}
        </header>
      ) : null}

      <section className={`mb-3 p-3.5 ${lq.cardSoft}`}>
        <p className="flex flex-wrap items-center gap-1.5 text-[14px] font-extrabold text-stone-900">
          ✨ {AI_IMPORTANT_DATE_TITLE}
          <ProBadgeIfNeeded show={!isPro} feature="ai_in_app" size="sm" />
        </p>
        <p className={`mt-1 text-[12px] leading-relaxed ${lq.textSecondary}`}>
          {AI_IMPORTANT_DATE_SUBTITLE}
        </p>
        {!isPro ? (
          <button
            type="button"
            onClick={() => openUpgradeModal(AI_IMPORTANT_DATE_PRO_LOCK)}
            className="mt-2.5 text-[12px] font-bold text-violet-700 underline-offset-2 active:opacity-70"
          >
            升級 Pro 解鎖 →
          </button>
        ) : null}
      </section>

      {!compactHero ? null : (
        <div className={`mb-3 flex items-center gap-2 px-0.5`}>
          <Bell className="h-5 w-5 text-rose-500" aria-hidden />
          <div>
            <h2 className={`flex flex-wrap items-center gap-1.5 ${lq.sectionTitleSm}`}>
              重要日子提醒
              <ProBadgeIfNeeded show={datesPro.showProBadge} feature="important_dates_unlimited" size="sm" />
            </h2>
            <p className={`text-[12px] ${lq.textSecondary}`}>iPhone 本機推播 · 沒開 App 也會提醒</p>
          </div>
        </div>
      )}

      <ImportantDatePushSettings onPermissionGranted={() => void rescheduleImportantDatePush()} />
      <ImportantDateDebugNotificationButton />

      {savedFlash ? (
        <p className="mb-2 rounded-xl bg-emerald-50 px-3 py-2 text-center text-[12px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
          提醒設定已儲存 · 已重新排程本機推播
        </p>
      ) : null}

      {events.length > 0 ? (
        <div className="mb-4 space-y-3">
          <div className={`p-3 ${lq.cardSoft}`}>
            <h3 className={`mb-2 text-[13px] font-bold ${lq.text}`}>今日提醒</h3>
            {todayImportantDateReminders.length > 0 ? (
              <ImportantDateReminderList
                items={todayImportantDateReminders}
                variant="today"
                onDismiss={dismissImportantDateReminder}
              />
            ) : (
              <p className={`text-[12px] ${lq.textSecondary}`}>今天沒有待處理提醒</p>
            )}
          </div>
          <div className={`p-3 ${lq.cardSoft}`}>
            <h3 className={`mb-2 text-[13px] font-bold ${lq.text}`}>未來提醒</h3>
            {futureImportantDateReminders.length === 0 ? (
              <p className={`text-[12px] ${lq.textSecondary}`}>目前沒有未來提醒</p>
            ) : (
              <>
                <ImportantDateReminderList
                  items={
                    futureRemindersExpanded
                      ? futureImportantDateReminders
                      : futureImportantDateReminders.slice(0, 1)
                  }
                  variant="future"
                />
                {futureImportantDateReminders.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setFutureRemindersExpanded((v) => !v)}
                    className="mt-2.5 w-full rounded-xl border border-rose-200/55 bg-white/80 py-2.5 text-center text-[12px] font-bold text-rose-700 active:opacity-80"
                  >
                    {futureRemindersExpanded
                      ? '收合提醒'
                      : `查看全部提醒（共 ${futureImportantDateReminders.length} 筆）`}
                  </button>
                ) : null}
              </>
            )}
          </div>
          <p className="text-center text-[10px] leading-relaxed text-stone-400">
            請開啟推播權限；修改提醒天數後會自動重新排程
          </p>
        </div>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          emoji="📅"
          title="還沒有重要日子"
          hint="請先在情侶資料填寫另一半生日與紀念日"
          className={lq.card}
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
        <ul className="space-y-2.5">
          {events.map((ev) => {
            const settings = settingsByEventId[ev.id] ?? getEventSettings(importantDateReminders, ev.id);
            const isEditing = reminderEditId === ev.id;
            const draftOffsets =
              offsetDrafts[ev.id] ?? (isEditing ? copyOffsets(settings.offsets) : settings.offsets);

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
      )}

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

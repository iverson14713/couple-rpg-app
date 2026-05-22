import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Bell, ChevronLeft } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { EmptyState } from './EmptyState';
import { ImportantDateAiSheet } from './ImportantDateAiSheet';
import { RecentImportantDateAiCard } from './RecentImportantDateAiCard';
import {
  savedEventToImportantDateEvent,
  type SavedImportantDateAi,
} from '../storage/importantDateAiCache';
import {
  buildImportantDateEvents,
  statusLabel,
  type ImportantDateEvent,
} from '../lib/importantDateEvents';
import {
  formatEnabledOffsetsLabel,
  getEventSettings,
  toggleReminderOffset,
  updateEventSettings,
} from '../storage/importantDateRemindersStore';
import { REMINDER_OFFSET_OPTIONS, type ReminderOffsetDays } from '../storage/importantDateReminderTypes';
import { ImportantDateReminderList } from './ImportantDateReminderList';
import { useAiUsage } from '../hooks/useAiUsage';
import { useProFeature } from '../hooks/useProFeature';
import { AiUsageQuotaLabel } from './AiUsageQuotaLabel';
import { ProBadgeIfNeeded } from './ProBadge';
import { lq } from '../theme';

export const IMPORTANT_DATE_REMINDERS_ANCHOR_ID = 'lq-important-date-reminders';

type Props = {
  showBack?: boolean;
  compactHero?: boolean;
};

export function ImportantDateRemindersSection({ showBack, compactHero }: Props) {
  const { navigateTo } = useCoupleRpgNav();
  const {
    coupleExtended,
    importantDateReminders,
    patchImportantDateReminder,
    todayImportantDateReminders,
    futureImportantDateReminders,
    dismissImportantDateReminder,
  } = useLoveQuest();
  const datesPro = useProFeature('important_dates_unlimited');
  const aiPro = useProFeature('ai_in_app');
  const aiUsage = useAiUsage();

  const events = useMemo(() => {
    try {
      return buildImportantDateEvents(coupleExtended);
    } catch (e) {
      console.error('[important-dates] build events failed:', e);
      return [];
    }
  }, [coupleExtended]);
  const [reminderEditId, setReminderEditId] = useState<string | null>(null);
  const [aiEvent, setAiEvent] = useState<ImportantDateEvent | null>(null);
  const [savedImportantView, setSavedImportantView] = useState<SavedImportantDateAi | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }, []);

  const onToggleOffset = useCallback(
    (eventId: string, offset: ReminderOffsetDays) => {
      patchImportantDateReminder((data) => toggleReminderOffset(data, eventId, offset));
      flashSaved();
    },
    [patchImportantDateReminder, flashSaved]
  );

  const onSaveOffsets = useCallback(
    (eventId: string) => {
      setReminderEditId(null);
      flashSaved();
    },
    [flashSaved]
  );

  return (
    <section id={IMPORTANT_DATE_REMINDERS_ANCHOR_ID} className={compactHero ? '' : 'mb-4'}>
      {showBack ? (
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="mb-2 flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          返回
        </button>
      ) : null}

      {showBack ? (
        <RecentImportantDateAiCard
          onView={setSavedImportantView}
          className="mb-3"
        />
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
            記住生日與紀念日 · 打開 App 時提醒
          </p>
          <div className="mt-2">
            <AiUsageQuotaLabel variant="badge" />
          </div>
        </header>
      ) : (
        <div className={`mb-3 flex items-center gap-2 px-0.5`}>
          <Bell className="h-5 w-5 text-rose-500" aria-hidden />
          <div>
            <h2 className={`flex flex-wrap items-center gap-1.5 ${lq.sectionTitleSm}`}>
              重要日子提醒
              <ProBadgeIfNeeded show={datesPro.showProBadge} feature="important_dates_unlimited" size="sm" />
            </h2>
            <p className={`text-[12px] ${lq.textSecondary}`}>打開 App 時提醒 · 推播將於後續加入</p>
          </div>
        </div>
      )}

      {savedFlash ? (
        <p className="mb-2 rounded-xl bg-emerald-50 px-3 py-2 text-center text-[12px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
          提醒設定已儲存 · 打開 App 時會依設定顯示提醒
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
            {futureImportantDateReminders.length > 0 ? (
              <ImportantDateReminderList items={futureImportantDateReminders} variant="future" />
            ) : (
              <p className={`text-[12px] ${lq.textSecondary}`}>
                尚未排程未來提醒，請在下方為各日子設定提前天數
              </p>
            )}
          </div>
          <p className="text-center text-[10px] leading-relaxed text-stone-400">
            正式推播通知將於後續版本加入 · 目前僅在 App 內提醒
          </p>
        </div>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          emoji="📅"
          title="還沒有重要日子"
          hint="請先在情侶資料填寫另一半生日與紀念日"
          className={lq.card}
        />
      ) : (
        <ul className="space-y-2.5">
          {events.map((ev) => {
            const settings = getEventSettings(importantDateReminders, ev.id);
            const editing = reminderEditId === ev.id;
            return (
              <li key={ev.id} className={`p-3 ${lq.card}`}>
                <div className="flex gap-2.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50/80 text-2xl">
                    {ev.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className={`text-[15px] font-bold ${lq.text}`}>{ev.name}</p>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className={`text-[12px] ${lq.textSecondary}`}>
                      📆 {ev.dateLabel} · {ev.isToday ? '就是今天' : ev.status === 'past' ? `已過 ${ev.daysSince} 天` : `還有 ${ev.daysUntil} 天`}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-500">
                      提醒：{formatEnabledOffsetsLabel(settings.offsets)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <TogglePill
                        active={settings.giftPrepared}
                        onClick={() => {
                          patchImportantDateReminder((d) =>
                            updateEventSettings(d, ev.id, { giftPrepared: !settings.giftPrepared })
                          );
                        }}
                      >
                        🎁 {settings.giftPrepared ? '已準備禮物' : '標記禮物'}
                      </TogglePill>
                      <TogglePill
                        active={settings.activityPlanned}
                        onClick={() => {
                          patchImportantDateReminder((d) =>
                            updateEventSettings(d, ev.id, { activityPlanned: !settings.activityPlanned })
                          );
                        }}
                      >
                        📅 {settings.activityPlanned ? '已安排活動' : '標記活動'}
                      </TogglePill>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderEditId(editing ? null : ev.id)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-[12px] font-bold active:scale-[0.98] ${
                      editing
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    🔔 設定提醒
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiEvent(ev)}
                    disabled={!aiUsage.canUseAi}
                    className={`flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl px-3 py-2 text-[12px] font-bold text-white active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${lq.btnPrimary}`}
                  >
                    ✨ {!aiUsage.canUseAi ? 'AI 次數已用完' : 'AI 安排'}
                    <ProBadgeIfNeeded show={aiPro.showProBadge} feature="ai_in_app" size="sm" />
                  </button>
                </div>

                {editing ? (
                  <div className="mt-2.5 rounded-xl border border-rose-100 bg-rose-50/40 p-2.5">
                    <p className="mb-2 text-[11px] font-bold text-rose-800">選擇提醒時間</p>
                    <div className="flex flex-wrap gap-1.5">
                      {REMINDER_OFFSET_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => onToggleOffset(ev.id, o.value)}
                          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                            settings.offsets.includes(o.value)
                              ? 'bg-rose-500 text-white'
                              : 'bg-white text-stone-600 ring-1 ring-stone-200'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSaveOffsets(ev.id)}
                      className={`mt-2 w-full rounded-lg py-2 text-[12px] font-bold ${lq.btnSecondary}`}
                    >
                      儲存提醒設定
                    </button>
                  </div>
                ) : null}
              </li>
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

function StatusBadge({ status }: { status: ImportantDateEvent['status'] }) {
  const cls =
    status === 'today'
      ? 'bg-rose-100 text-rose-800'
      : status === 'past'
        ? 'bg-stone-100 text-stone-600'
        : 'bg-amber-50 text-amber-800';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{statusLabel(status)}</span>;
}

function TogglePill({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-1 text-[10px] font-bold ring-1 active:scale-[0.98] ${
        active ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-stone-50 text-stone-600 ring-stone-200'
      }`}
    >
      {children}
    </button>
  );
}

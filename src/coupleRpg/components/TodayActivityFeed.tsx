import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useUserPlan } from '../context/UserPlanContext';
import { todayKey } from '../lib/dates';
import {
  getRecentActivityLogsByDay,
  getTodayActivityLogs,
  subscribeActivityLogUpdated,
} from '../services/activityLogService';
import type { ActivityLogItem, ActivityTargetType } from '../storage/activityLogTypes';
import {
  getTodayPartnerMessage,
  shuffleTodayMessage,
  type DailyMessageRecord,
} from '../storage/dailyMessageStore';
import { lq } from '../theme';

const HOME_PREVIEW_MAX = 6;
const ALL_MODAL_DAYS = 7;

const TARGET_ICONS: Record<ActivityTargetType, string> = {
  chore: '🧹',
  dinner: '🍽️',
  reward_card: '🎁',
  couple_profile: '💑',
  important_date: '📅',
  date_idea: '💕',
  love_task: '💗',
  mini_game: '🎮',
  pro_plan: '✨',
};

function activityLogIcon(item: Pick<ActivityLogItem, 'targetType' | 'actionType'>): string {
  return TARGET_ICONS[item.targetType] ?? '📝';
}

function formatDateLabel(dateKey: string): string {
  const today = todayKey();
  if (dateKey === today) return '今天';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === todayKey(yesterday)) return '昨天';

  const [y, m, d] = dateKey.split('-').map(Number);
  if (y && m && d) return `${m} 月 ${d} 日`;
  return dateKey;
}

/** 開啟 modal 時鎖定背景捲動，關閉後還原位置 */
function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
    };

    style.overflow = 'hidden';
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.left = '0';
    style.right = '0';
    style.width = '100%';

    return () => {
      style.overflow = prev.overflow;
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

export function TodayActivityFeed() {
  const { pullActivityLogsFromCloud } = useLoveQuest();
  const { isPro } = useUserPlan();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tick, setTick] = useState(0);
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState<DailyMessageRecord>(() => getTodayPartnerMessage());

  useBodyScrollLock(showAll);

  useEffect(() => {
    return subscribeActivityLogUpdated(() => setTick((t) => t + 1));
  }, []);

  useEffect(() => {
    void pullActivityLogsFromCloud();
  }, [pullActivityLogsFromCloud]);

  useEffect(() => {
    void isPro;
    setTick((t) => t + 1);
  }, [isPro]);

  const todayLogs = useMemo(() => {
    void tick;
    return getTodayActivityLogs();
  }, [tick]);

  const preview = todayLogs.slice(0, HOME_PREVIEW_MAX);
  const hasMore = todayLogs.length > HOME_PREVIEW_MAX;

  const summary =
    todayLogs.length > 0
      ? `今天有 ${todayLogs.length} 筆更新`
      : '今天還沒有新動態';

  const recentByDay = useMemo(() => {
    if (!showAll) return [];
    void tick;
    return getRecentActivityLogsByDay(ALL_MODAL_DAYS);
  }, [showAll, tick]);

  const onShuffleQuote = useCallback(() => {
    setQuote(shuffleTodayMessage());
  }, []);

  return (
    <>
      <div className="border-t border-stone-200/40 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-rose-50/90 to-white px-3 py-2.5 text-left shadow-sm ring-1 ring-rose-100/80 transition active:scale-[0.99]"
          aria-expanded={expanded}
        >
          <span className="text-[13px] font-bold text-stone-800">今日動態</span>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-stone-500">
            {summary}
            {expanded ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-rose-400" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-rose-400" aria-hidden />
            )}
          </span>
        </button>

        {expanded ? (
          <div className={`mt-2 space-y-1.5 px-1 py-1 ${lq.cardSoft}`}>
            {todayLogs.length === 0 ? (
              <p className="px-2 py-3 text-center text-[12px] text-stone-500">今天還沒有新動態，去完成一項甜蜜任務吧</p>
            ) : (
              <ul className="space-y-0.5">
                {preview.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl px-2.5 py-2 text-[13px] leading-snug text-stone-700"
                  >
                    {item.message}
                  </li>
                ))}
              </ul>
            )}

            {hasMore ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mx-auto block w-full py-2 text-center text-[12px] font-bold text-rose-600 active:opacity-70"
              >
                查看全部
              </button>
            ) : null}

            <div className="border-t border-stone-100 px-2 pt-1 pb-1">
              <button
                type="button"
                onClick={() => setShowQuote((v) => !v)}
                className="text-[11px] font-semibold text-stone-500 underline-offset-2 hover:text-rose-600 hover:underline"
              >
                💬 今日一句話
              </button>
              {showQuote ? (
                <div className="mt-1.5 rounded-xl bg-stone-50/90 px-2.5 py-2">
                  <p className="text-[13px] italic leading-relaxed text-stone-600">「{quote.text}」</p>
                  <button
                    type="button"
                    onClick={onShuffleQuote}
                    className="mt-1.5 text-[11px] font-semibold text-rose-600"
                  >
                    換一句
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {showAll ? (
        <ActivityLogModal days={recentByDay} onClose={() => setShowAll(false)} />
      ) : null}
    </>
  );
}

function ActivityLogModal({
  days,
  onClose,
}: {
  days: { dateKey: string; items: ActivityLogItem[] }[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(255,245,248,0.65)] backdrop-blur-[6px]"
        aria-label="關閉最近動態"
        onClick={onClose}
      />

      <div
        className="relative flex max-h-[70vh] w-[calc(100%-32px)] max-w-[420px] flex-col overflow-hidden rounded-[24px] border border-[rgba(255,120,160,0.12)] bg-[rgba(255,255,255,0.96)] shadow-[0_12px_40px_rgba(255,120,160,0.14),0_4px_20px_rgba(0,0,0,0.06)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-log-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100/90 px-4 py-3">
          <h2 id="activity-log-title" className={`text-[15px] font-bold ${lq.text}`}>
            最近動態
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50/90 text-stone-400 ring-1 ring-rose-100/70 transition active:scale-95 active:bg-rose-100/80"
            aria-label="關閉"
          >
            <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 max-h-[calc(70vh-3.25rem)] overflow-y-auto overscroll-contain px-4 py-3">
          {days.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-stone-500">最近 7 天沒有動態紀錄</p>
          ) : (
            <div className="space-y-5 pb-1">
              {days.map((group) => (
                <section key={group.dateKey}>
                  <p className="mb-2 text-[12px] font-semibold text-stone-500">
                    {formatDateLabel(group.dateKey)}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex gap-2.5 rounded-2xl border border-stone-100/90 bg-white px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-[15px] leading-none"
                          aria-hidden
                        >
                          {activityLogIcon(item)}
                        </span>
                        <p className="min-w-0 flex-1 pt-0.5 text-[13px] leading-snug text-stone-700">
                          {item.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

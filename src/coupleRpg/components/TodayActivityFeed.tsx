import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useUserPlan } from '../context/UserPlanContext';
import {
  getRecentActivityLogsByDay,
  getTodayActivityLogs,
  subscribeActivityLogUpdated,
} from '../services/activityLogService';
import {
  getTodayPartnerMessage,
  shuffleTodayMessage,
  type DailyMessageRecord,
} from '../storage/dailyMessageStore';
import { lq } from '../theme';

const HOME_PREVIEW_MAX = 6;
const ALL_MODAL_DAYS = 7;

export function TodayActivityFeed() {
  const { pullActivityLogsFromCloud } = useLoveQuest();
  const { isPro } = useUserPlan();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tick, setTick] = useState(0);
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState<DailyMessageRecord>(() => getTodayPartnerMessage());

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
          <div className="mt-2 space-y-1.5 rounded-2xl bg-white/80 px-1 py-1 ring-1 ring-stone-100/90">
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
  days: { dateKey: string; items: { id: string; actorName: string; message: string; createdAt: string }[] }[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-900/40 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-log-title"
      onClick={onClose}
    >
      <div
        className="max-h-[min(85vh,32rem)] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <h2 id="activity-log-title" className={`text-[16px] font-bold ${lq.text}`}>
            最近動態
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600"
            aria-label="關閉"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'min(70vh, 26rem)' }}>
          {days.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-stone-500">最近 7 天沒有動態紀錄</p>
          ) : (
            <div className="space-y-4">
              {days.map((group) => (
                <section key={group.dateKey}>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
                    {group.dateKey}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl bg-rose-50/40 px-3 py-2 text-[13px] leading-snug text-stone-700"
                      >
                        {item.message}
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

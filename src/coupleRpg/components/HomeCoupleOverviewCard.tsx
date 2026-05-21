import { useMemo } from 'react';
import { TodayActivityFeed } from './TodayActivityFeed';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useUserPlan } from '../context/UserPlanContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatHomeCoupleHeaderLine } from '../lib/importantDates';
import { getPrimaryHomeDateNudge } from '../lib/importantDateHomeReminder';
import { getUpcomingImportantDates } from '../lib/importantDates';
import { getTogetherDaysInfo } from '../lib/relationshipDays';
import { todayKey } from '../lib/dates';
import { lq } from '../theme';

const MAX_DATE_ROWS = 2;

export function HomeCoupleOverviewCard() {
  const { navigateTo } = useCoupleRpgNav();
  const { isPro, openUpgradeModal } = useUserPlan();
  const {
    rpgView,
    todayCoinEarned,
    coupleExtended,
    couple,
    importantDateReminders,
    activeAnniversaryReminders,
    dismissAnniversaryReminder,
    todayDinner,
    draftPick,
    houseworkHomeStatus,
    taskProgress,
    datePlanner,
  } = useLoveQuest();

  const importantPreview = useMemo(() => getUpcomingImportantDates(coupleExtended), [coupleExtended]);
  const togetherDays = useMemo(
    () => getTogetherDaysInfo(coupleExtended.relationshipStart),
    [coupleExtended.relationshipStart]
  );
  const coupleHeaderLine = useMemo(() => formatHomeCoupleHeaderLine(coupleExtended), [coupleExtended]);
  const homeDateNudge = useMemo(
    () => getPrimaryHomeDateNudge(coupleExtended, importantDateReminders),
    [coupleExtended, importantDateReminders]
  );

  const goCoupleProfile = () =>
    navigateTo('profile', { profileSection: 'settings', scrollToElementId: 'lq-couple-profile' });
  const goReminders = () => navigateTo('importantDates');

  const dinnerLabel = todayDinner?.label ?? draftPick;
  const { done, total } = taskProgress;

  const todayLine = useMemo(() => {
    const parts: string[] = [];
    if (dinnerLabel) parts.push(`晚餐 ${dinnerLabel}`);
    if (houseworkHomeStatus.summaryPart) parts.push(houseworkHomeStatus.summaryPart);
    if (total > 0) parts.push(`任務 ${done}/${total}`);
    if (datePlanner.current && !datePlanner.current.completed) parts.push('約會提案中');
    return parts.length ? parts.join(' · ') : '今天一起創造小驚喜吧';
  }, [dinnerLabel, houseworkHomeStatus.summaryPart, total, done, datePlanner.current]);

  const dateRows = useMemo(() => {
    const rows: { key: string; icon: string; title: string; suffix: string; highlight?: boolean }[] = [];
    const showTogether =
      togetherDays.kind === 'active' || togetherDays.kind === 'future' || togetherDays.kind === 'invalid';

    if (showTogether) {
      rows.push({
        key: 'together',
        icon: '💕',
        title:
          togetherDays.kind === 'active'
            ? '在一起'
            : togetherDays.kind === 'future'
              ? '在一起紀念日'
              : '在一起',
        suffix:
          togetherDays.kind === 'active'
            ? `第 ${togetherDays.days} 天`
            : togetherDays.kind === 'future'
              ? '尚未開始'
              : '請檢查日期',
        highlight: togetherDays.kind === 'active',
      });
    }

    const slots = Math.max(0, MAX_DATE_ROWS - (showTogether ? 1 : 0));
    for (const it of importantPreview.items.slice(0, slots)) {
      rows.push({
        key: it.id,
        icon: it.icon,
        title: it.displayTitle,
        suffix: it.isToday ? '今天' : `${it.daysUntil} 天後`,
        highlight: it.isToday,
      });
    }
    return rows;
  }, [togetherDays, importantPreview.items]);

  const hiddenDateCount = Math.max(
    0,
    importantPreview.totalCount - dateRows.filter((r) => r.key !== 'together').length
  );

  return (
    <section className="mb-4 overflow-hidden rounded-3xl bg-gradient-to-b from-white via-rose-50/40 to-stone-50/80 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] ring-1 ring-stone-200/50">
      {/* 頂部：情侶 + Pro 小入口 */}
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex -space-x-1.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100/90 text-xl ring-2 ring-white">
                {couple.emojiA}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100/90 text-xl ring-2 ring-white">
                {couple.emojiB}
              </span>
            </span>
            <div className="min-w-0">
              <p className={`truncate text-[17px] font-extrabold leading-tight ${lq.text}`}>
                {coupleHeaderLine}
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-stone-500">{todayKey()}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-full bg-stone-100/90 px-2 py-0.5 text-[10px] font-bold text-stone-600">
              Lv.{rpgView.level}
            </span>
            <button
              type="button"
              onClick={() => (isPro ? navigateTo('upgrade') : openUpgradeModal())}
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide active:opacity-80 ${
                isPro
                  ? 'bg-violet-100 text-violet-800'
                  : 'bg-gradient-to-r from-violet-500 to-rose-500 text-white shadow-sm'
              }`}
            >
              {isPro ? '✨ Pro' : 'PRO'}
            </button>
          </div>
        </div>

        {/* 數值列：無獨立白卡 */}
        <div className="mt-3.5 grid grid-cols-4 divide-x divide-stone-200/60 rounded-2xl bg-stone-50/70 py-2.5">
          <StatCell emoji="❤️" value={String(rpgView.heartPoints)} label="愛心" />
          <StatCell emoji="🤝" value={`${rpgView.compatibility}%`} label="默契" />
          <StatCell emoji="✨" value={`Lv.${rpgView.level}`} label="等級" />
          <StatCell emoji="🪙" value={`+${todayCoinEarned}`} label="今日" />
        </div>

        <p className="mt-2.5 truncate text-[12px] font-medium text-stone-500">{todayLine}</p>
      </div>

      {/* 重要日子 + 提醒（內嵌，非獨立 banner） */}
      {(dateRows.length > 0 || homeDateNudge) && (
        <div className="border-t border-stone-200/40 px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">重要日子</p>
            <button
              type="button"
              onClick={goReminders}
              className="text-[11px] font-semibold text-rose-500 active:opacity-70"
            >
              提醒中心
            </button>
          </div>
          {dateRows.length > 0 ? (
            <ul className="space-y-1">
              {dateRows.map((row) => (
                <li key={row.key} className="flex items-center gap-2 py-0.5">
                  <span className="w-5 text-center text-sm" aria-hidden>
                    {row.icon}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${
                      row.highlight ? 'text-rose-600' : lq.text
                    }`}
                  >
                    {row.title}
                  </span>
                  <span className="shrink-0 text-[12px] text-stone-500">{row.suffix}</span>
                </li>
              ))}
            </ul>
          ) : (
            <button
              type="button"
              onClick={goCoupleProfile}
              className="text-[12px] font-semibold text-stone-500 underline-offset-2 hover:underline"
            >
              設定紀念日與生日 →
            </button>
          )}
          {hiddenDateCount > 0 ? (
            <button
              type="button"
              onClick={goCoupleProfile}
              className="mt-1 text-[11px] font-semibold text-stone-400 active:text-rose-500"
            >
              還有 {hiddenDateCount} 項 →
            </button>
          ) : null}
          {homeDateNudge ? (
            <p className="mt-2 text-[12px] leading-snug text-amber-800/90">
              <span className="font-semibold">提醒</span> · {homeDateNudge.replace(/🎁\s*/, '')}
              <button type="button" onClick={goReminders} className="ml-1 font-bold text-amber-900 underline-offset-2">
                查看
              </button>
            </p>
          ) : null}
          {activeAnniversaryReminders.slice(0, 1).map((r) => (
            <p key={r.id} className="mt-1.5 flex items-center gap-2 text-[12px] text-stone-600">
              <span className="truncate">
                {r.emoji} {r.message}
              </span>
              <button
                type="button"
                onClick={() => dismissAnniversaryReminder(r.id)}
                className="shrink-0 font-bold text-stone-500"
              >
                知道了
              </button>
            </p>
          ))}
        </div>
      )}

      <TodayActivityFeed />
    </section>
  );
}

function StatCell({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-1">
      <span className="text-sm leading-none" aria-hidden>
        {emoji}
      </span>
      <span className={`mt-0.5 text-[15px] font-extrabold tabular-nums leading-none ${lq.text}`}>{value}</span>
      <span className="mt-0.5 text-[9px] font-medium text-stone-500">{label}</span>
    </div>
  );
}

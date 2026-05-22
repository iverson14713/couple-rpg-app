import { useMemo } from 'react';
import { TodayActivityFeed } from './TodayActivityFeed';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useUserPlan } from '../context/UserPlanContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatHomeCoupleHeaderLine } from '../lib/importantDates';
import { todayKey } from '../lib/dates';
import { lq } from '../theme';

export function HomeCoupleOverviewCard() {
  const { navigateTo } = useCoupleRpgNav();
  const { isPro, openUpgradeModal } = useUserPlan();
  const {
    rpgView,
    todayCoinEarned,
    coupleExtended,
    couple,
    todayDinner,
    draftPick,
    dinnerHomeStatus,
    houseworkHomeStatus,
    taskProgress,
    datePlanner,
  } = useLoveQuest();

  const coupleHeaderLine = useMemo(() => formatHomeCoupleHeaderLine(coupleExtended), [coupleExtended]);

  const dinnerLabel = todayDinner?.label ?? draftPick;
  const { done, total } = taskProgress;

  const todayLine = useMemo(() => {
    const parts: string[] = [];
    if (todayDinner?.label && dinnerHomeStatus.summaryPart) {
      parts.push(dinnerHomeStatus.summaryPart);
    } else if (dinnerLabel) {
      parts.push(`晚餐 ${dinnerLabel}`);
    }
    if (houseworkHomeStatus.summaryPart) parts.push(houseworkHomeStatus.summaryPart);
    if (total > 0) parts.push(`任務 ${done}/${total}`);
    if (datePlanner.current && !datePlanner.current.completed) parts.push('約會提案中');
    return parts.length ? parts.join(' · ') : '今天一起創造小驚喜吧';
  }, [dinnerLabel, dinnerHomeStatus.summaryPart, houseworkHomeStatus.summaryPart, todayDinner?.label, total, done, datePlanner.current]);

  return (
    <section className={`mb-4 overflow-hidden ${lq.cardElevated}`}>
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
        <div className="mt-3.5 grid grid-cols-4 divide-x divide-rose-100/50 rounded-2xl bg-rose-50/35 py-2.5 ring-1 ring-rose-100/40 backdrop-blur-sm">
          <StatCell emoji="❤️" value={String(rpgView.heartPoints)} label="愛心" />
          <StatCell emoji="🤝" value={`${rpgView.compatibility}%`} label="默契" />
          <StatCell emoji="✨" value={`Lv.${rpgView.level}`} label="等級" />
          <StatCell emoji="🪙" value={`+${todayCoinEarned}`} label="今日" />
        </div>

        <p className={`mt-2.5 truncate text-[12px] font-medium ${lq.textSecondary}`}>{todayLine}</p>
      </div>

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

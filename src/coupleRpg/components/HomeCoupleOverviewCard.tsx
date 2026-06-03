import { useMemo } from 'react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useUserPlan } from '../context/UserPlanContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatHomeCoupleHeaderLine } from '../lib/importantDates';
import { lq } from '../theme';

/** 首頁：緊湊情侶狀態列 */
export function HomeCoupleOverviewCard() {
  const { navigateTo } = useCoupleRpgNav();
  const { isPro, openUpgradeModal } = useUserPlan();
  const { rpgView, todayCoinEarned, coupleExtended } = useLoveQuest();

  const coupleHeaderLine = useMemo(() => formatHomeCoupleHeaderLine(coupleExtended), [coupleExtended]);

  const statsLine = `愛心 ${rpgView.heartPoints}・默契 ${rpgView.compatibility}%・今日 +${todayCoinEarned}`;

  return (
    <section className={`px-3.5 py-2.5 ${lq.cardElevated}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[15px] font-extrabold leading-tight ${lq.text}`}>
            {coupleHeaderLine}
            <span className="ml-1.5 font-bold text-violet-700">Lv.{rpgView.level}</span>
          </p>
          <p className={`mt-0.5 truncate text-[12px] font-semibold tabular-nums ${lq.textSecondary}`}>
            {statsLine}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (isPro ? navigateTo('upgrade') : openUpgradeModal())}
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide active:opacity-80 ${
            isPro
              ? 'bg-violet-100 text-violet-800'
              : 'bg-gradient-to-r from-violet-500 to-rose-500 text-white shadow-sm'
          }`}
        >
          {isPro ? '✨ Pro' : 'PRO'}
        </button>
      </div>
    </section>
  );
}

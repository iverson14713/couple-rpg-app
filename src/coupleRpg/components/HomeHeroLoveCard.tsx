import { useMemo } from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useUserPlan } from '../context/UserPlanContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatHomeCoupleHeaderLine } from '../lib/importantDates';
import { WEEKLY_RECAP_UNLOCK_HINT } from '../lib/coupleWeeklyRecap';
import { useToast } from '../../context/ToastContext';
import { SoftIconBadge } from './ui/SoftIconBadge';

/** 首頁 Hero：品牌主視覺（僅 UI） */
export function HomeHeroLoveCard() {
  const auth = useSupabaseAuth();
  const { navigateTo } = useCoupleRpgNav();
  const { showToast } = useToast();
  const { isPro, openUpgradeModal } = useUserPlan();
  const {
    rpgView,
    todayCoinEarned,
    coupleExtended,
    displayNames,
    loveFlameView,
    coupleExpView,
    weeklyChallengeView,
    coupleWeeklyRecapView,
    growthWalletReady,
  } = useLoveQuest();

  const coupleHeaderLine = useMemo(() => formatHomeCoupleHeaderLine(coupleExtended), [coupleExtended]);
  const { currentStreak } = loveFlameView;
  const {
    level,
    title,
    expInLevel,
    expNeeded,
    expToNext,
    progressPct,
    nextLevel,
    nextTitle,
  } = coupleExpView;

  const expLine =
    expNeeded > 0 ? `${expInLevel} / ${expNeeded} EXP` : `${coupleExpView.totalExp} EXP`;
  const gapLine =
    nextLevel != null && nextTitle != null
      ? `距 Lv.${nextLevel} 還差 ${expToNext}`
      : null;
  const weeklyHint = weeklyChallengeView.homeHintLine?.trim();
  const recapHint = coupleWeeklyRecapView.homeHintLine?.trim();

  const onRecapEntry = () => {
    if (!coupleWeeklyRecapView.unlocked) {
      showToast(WEEKLY_RECAP_UNLOCK_HINT, 'info', { position: 'top' });
      return;
    }
    navigateTo('rewards');
  };

  const onProBadge = () => (isPro ? navigateTo('upgrade') : openUpgradeModal());

  return (
    <section
      className="lq-home-hero lq-home-elev lq-home-section-in relative isolate overflow-hidden rounded-[28px] px-4 py-4 ring-1 ring-white/80"
      aria-label="戀愛狀態"
    >
      <div className="lq-home-hero-sparkles" aria-hidden>
        <span className="lq-home-hero-spark lq-home-hero-spark--1" />
        <span className="lq-home-hero-spark lq-home-hero-spark--2" />
        <span className="lq-home-hero-spark lq-home-hero-spark--3" />
      </div>

      <div className="relative z-10 max-w-[56%]">
        {auth.user ? (
          <p className="truncate text-[11px] font-medium text-white/85">{displayNames.me}</p>
        ) : null}

        <h2 className="lq-hero-title mt-1 truncate text-[clamp(1.55rem,7vw,2rem)] font-extrabold leading-[1.05] tracking-tight text-white">
          {coupleHeaderLine}
        </h2>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="lq-glass-pill text-[12px] font-bold">
            {growthWalletReady ? `Lv.${level} ${title}` : '同步中…'}
          </span>
          <span className="lq-glass-pill inline-flex items-center gap-1 pr-2.5 text-[11px] font-bold">
            <SoftIconBadge variant="flame" size="xs" className="lq-hero-flame-pulse !shadow-none" />
            火苗 {currentStreak} 天
          </span>
        </div>

        <p className="lq-hero-exp-label mt-3 tabular-nums">{expLine}</p>
        <div className="lq-hero-exp-track">
          <div className="lq-hero-exp-fill transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>

        <p className="lq-hero-stats mt-2.5">
          愛心 {rpgView.heartPoints}
          <span className="lq-hero-stats-sep">·</span>
          默契 {rpgView.compatibility}%
          <span className="lq-hero-stats-sep">·</span>
          今日 {growthWalletReady ? `+${todayCoinEarned}` : '同步中…'}
        </p>

        {gapLine ? (
          <p className="lq-hero-hint mt-1.5 truncate">{gapLine}</p>
        ) : null}
        {weeklyHint ? (
          <p className="lq-hero-hint truncate">{weeklyHint}</p>
        ) : null}
        {recapHint ? (
          <button
            type="button"
            onClick={onRecapEntry}
            className="lq-hero-hint block max-w-full truncate text-left active:opacity-80"
          >
            {recapHint}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onProBadge}
        className={`absolute right-4 top-4 z-20 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm transition active:scale-[0.97] ${
          isPro
            ? 'bg-white/95 text-violet-700 ring-1 ring-white/80'
            : 'bg-violet-900/75 text-white backdrop-blur-sm ring-1 ring-white/20'
        }`}
      >
        {isPro ? '✨ Pro' : 'PRO'}
      </button>
    </section>
  );
}

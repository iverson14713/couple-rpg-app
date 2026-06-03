import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { WEEKLY_RECAP_UNLOCK_HINT } from '../lib/coupleWeeklyRecap';
import { useToast } from '../../context/ToastContext';
import { lq } from '../theme';

/** 首頁：愛情火苗 + 情侶等級合併（緊湊） */
export function HomeTodayGrowthCard() {
  const { navigateTo } = useCoupleRpgNav();
  const { showToast } = useToast();
  const { loveFlameView, coupleExpView, weeklyChallengeView, coupleWeeklyRecapView } =
    useLoveQuest();
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
    expNeeded > 0 ? `${expInLevel} / ${expNeeded} EXP` : `${coupleExpView.totalExp} EXP · 滿等`;
  const gapLine =
    nextLevel != null && nextTitle != null
      ? `距離 Lv.${nextLevel} 還差 ${expToNext} EXP`
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

  return (
    <section
      className={`px-3 py-2 ${lq.cardElevated}`}
      aria-label="今日成長"
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">今日成長</p>
      <p className={`mt-0.5 truncate text-[13px] font-extrabold leading-snug ${lq.text}`}>
        <span>🔥 火苗 {currentStreak} 天</span>
        <span className="mx-1 font-medium text-stone-300" aria-hidden>
          ·
        </span>
        <span>
          ✨ Lv.{level} {title}
        </span>
      </p>
      <p className="mt-0.5 text-[12px] font-bold tabular-nums text-violet-700">{expLine}</p>
      {gapLine ? (
        <p className={`mt-0.5 truncate text-[11px] font-medium ${lq.textSecondary}`}>{gapLine}</p>
      ) : null}
      <div className={`mt-1 h-1 overflow-hidden rounded-full ${lq.progressTrack}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-rose-400 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      {weeklyHint ? (
        <p className="mt-1 truncate text-[10px] font-medium text-stone-500">{weeklyHint}</p>
      ) : null}
      {recapHint ? (
        <button
          type="button"
          onClick={onRecapEntry}
          className={`mt-0.5 block max-w-full truncate text-left text-[10px] font-semibold ${
            coupleWeeklyRecapView.unlocked ? 'text-violet-700' : 'text-stone-500'
          } active:opacity-70`}
        >
          {recapHint}
        </button>
      ) : null}
    </section>
  );
}

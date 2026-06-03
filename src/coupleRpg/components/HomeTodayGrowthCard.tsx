import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

/** 首頁：愛情火苗 + 情侶等級合併（緊湊） */
export function HomeTodayGrowthCard() {
  const { loveFlameView, coupleExpView } = useLoveQuest();
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

  return (
    <section
      className={`flex min-h-[7.5rem] max-h-[8.75rem] flex-col justify-center px-3.5 py-2.5 ${lq.cardElevated}`}
      aria-label="今日成長"
    >
      <p className={`text-[11px] font-bold uppercase tracking-wide text-stone-500`}>今日成長</p>
      <p className={`mt-1 truncate text-[14px] font-extrabold leading-snug ${lq.text}`}>
        <span>🔥 火苗 {currentStreak} 天</span>
        <span className="mx-1.5 font-medium text-stone-300" aria-hidden>
          ·
        </span>
        <span>
          ✨ Lv.{level} {title}
        </span>
      </p>
      <p className="mt-0.5 text-[13px] font-bold tabular-nums text-violet-700">{expLine}</p>
      {gapLine ? (
        <p className={`mt-0.5 truncate text-[11px] font-semibold ${lq.textSecondary}`}>{gapLine}</p>
      ) : null}
      <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${lq.progressTrack}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-rose-400 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </section>
  );
}

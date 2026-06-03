import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

export function HomeLevelCard() {
  const { coupleExpView, weeklyChallengeView, coupleWeeklyRecapView } = useLoveQuest();
  const {
    level,
    title,
    totalExp,
    expInLevel,
    expNeeded,
    expToNext,
    progressPct,
    nextLevel,
    nextTitle,
    nextUnlockText,
  } = coupleExpView;

  const progressLabel =
    nextLevel != null && nextTitle != null
      ? `${expInLevel} / ${expNeeded} EXP`
      : `${totalExp} EXP · 滿等`;

  const gapLabel =
    nextLevel != null && nextTitle != null
      ? `距離 Lv.${nextLevel} ${nextTitle}還差 ${expToNext} EXP`
      : '你們已達傳說情侶';

  return (
    <section className={`relative overflow-hidden p-4 ${lq.cardElevated}`}>
      <span className="absolute -right-2 -top-2 text-5xl opacity-[0.06]" aria-hidden>
        ✨
      </span>
      <div className="relative">
        <p className={lq.label}>情侶等級</p>
        <h3 className={`mt-0.5 text-[18px] font-extrabold leading-snug ${lq.text}`}>
          Lv.{level} {title}
        </h3>
        <p className={`mt-1 text-[14px] font-bold text-violet-700`}>{progressLabel}</p>
        <p className={`mt-0.5 text-[12px] font-semibold ${lq.textSecondary}`}>{gapLabel}</p>

        <div className={`mt-2.5 h-2 overflow-hidden rounded-full ${lq.progressTrack}`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r from-violet-400 to-rose-400 transition-all duration-500`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className={`mt-2 text-[11px] leading-snug ${lq.textMuted}`}>
          完成今日戀愛任務、小遊戲與互動可以累積 EXP。
        </p>
        <p className={`mt-1 text-[11px] font-semibold text-violet-800/90`}>{nextUnlockText}</p>
        {coupleWeeklyRecapView.levelCardLine ? (
          <p className={`mt-0.5 text-[11px] font-semibold text-violet-800/90`}>
            {coupleWeeklyRecapView.levelCardLine}
          </p>
        ) : null}
        {weeklyChallengeView.unlocked && !weeklyChallengeView.claimed ? (
          <p className={`mt-0.5 text-[11px] font-semibold text-rose-700/90`}>
            {weeklyChallengeView.homeHintLine}
          </p>
        ) : null}
      </div>
    </section>
  );
}

import { useState } from 'react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { WEEKLY_CHALLENGE_UNLOCK_HINT } from '../data/weeklyChallenges';
import { lq } from '../theme';

export function WeeklyChallengeCard() {
  const { weeklyChallengeView, claimWeeklyChallengeReward } = useLoveQuest();
  const [claiming, setClaiming] = useState(false);
  const [lockHint, setLockHint] = useState(false);

  const {
    unlocked,
    challenge,
    progress,
    target,
    status,
    claimed,
  } = weeklyChallengeView;

  const onPrimary = async () => {
    if (!unlocked) {
      setLockHint(true);
      return;
    }
    if (status !== 'claimable' || claiming) return;
    setClaiming(true);
    try {
      await claimWeeklyChallengeReward();
    } finally {
      setClaiming(false);
    }
  };

  const buttonLabel =
    !unlocked
      ? 'Lv.4 解鎖'
      : status === 'claimed'
        ? '本週已完成'
        : status === 'claimable'
          ? '領取獎勵'
          : '繼續努力';

  const buttonDisabled =
    !unlocked || status === 'claimed' || status === 'in_progress' || claiming;

  return (
    <section className={`p-3.5 ${lq.cardElevated}`} aria-label="本週情侶挑戰">
      <p className={lq.label}>本週情侶挑戰</p>
      <p className={`mt-0.5 text-[13px] ${lq.textSecondary}`}>
        完成一個每週目標，累積 LoveCoin 與 EXP。
      </p>

      <div className={`mt-2.5 rounded-xl px-3 py-2.5 ${lq.cardSoft}`}>
        <p className={`text-[15px] font-extrabold ${lq.text}`}>
          {challenge.emoji} {challenge.title}
        </p>
        <p className={`mt-0.5 text-[13px] font-semibold ${lq.textSecondary}`}>
          {challenge.description}
        </p>
        <p className="mt-2 text-[13px] font-bold tabular-nums text-violet-800">
          進度：{progress} / {target}
        </p>
        <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${lq.progressTrack}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-rose-400 transition-all"
            style={{ width: `${target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0}%` }}
          />
        </div>
        <p className={`mt-2 text-[12px] font-semibold ${lq.textSecondary}`}>
          獎勵：LoveCoin +{challenge.loveCoins}・EXP +{challenge.exp}
          {claimed ? ' · 已領取' : ''}
        </p>
      </div>

      {lockHint && !unlocked ? (
        <p className="mt-2 text-[12px] font-semibold text-amber-800">{WEEKLY_CHALLENGE_UNLOCK_HINT}</p>
      ) : null}

      <button
        type="button"
        disabled={buttonDisabled}
        onClick={() => void onPrimary()}
        className={`mt-3 w-full ${
          status === 'claimable' && unlocked ? lq.btnPrimary : lq.btnSecondary
        } !min-h-10 disabled:cursor-not-allowed disabled:opacity-55`}
      >
        {claiming ? '領取中…' : buttonLabel}
      </button>
    </section>
  );
}

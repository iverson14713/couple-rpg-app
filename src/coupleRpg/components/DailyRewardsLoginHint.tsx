import { useLoveQuest } from '../context/LoveQuestContext';
import { DAILY_REWARDS_LOGIN_HINT } from '../lib/dailyRewardsCopy';

/** 未登入時顯示：完成互動不會寫入獎勵帳本 */
export function DailyRewardsLoginHint({ className = '' }: { className?: string }) {
  const { canEarnDailyRewards } = useLoveQuest();
  if (canEarnDailyRewards) return null;

  return (
    <p
      className={`rounded-xl bg-amber-50/90 px-3 py-2.5 text-[12px] font-semibold leading-snug text-amber-950 ring-1 ring-amber-200/80 ${className}`}
      role="status"
    >
      {DAILY_REWARDS_LOGIN_HINT}
    </p>
  );
}

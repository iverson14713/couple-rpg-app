import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

const MODE_HINTS = '骰子・真心話・默契・情話・挑戰';

/** 首頁：情侶小遊戲中型重點卡（僅 UI，導向 miniGames 分頁） */
export function HomeMiniGamesFeaturedCard() {
  const { navigateTo } = useCoupleRpgNav();
  const { rpgView } = useLoveQuest();
  const { miniGamesRewardsToday, miniGamesRewardCap } = rpgView;

  return (
    <section
      className={`relative min-h-[6.75rem] overflow-hidden px-3.5 py-3 ${lq.cardElevated}`}
      aria-label="情侶小遊戲"
    >
      <span
        className="pointer-events-none absolute -right-1 -top-1 text-4xl opacity-[0.07]"
        aria-hidden
      >
        🎲
      </span>

      <div className="relative">
        <h3 className={`text-[16px] font-extrabold leading-snug ${lq.text}`}>🎲 情侶小遊戲</h3>
        <p className={`mt-0.5 text-[12px] leading-snug ${lq.textSecondary}`}>
          骰子、真心話、默契問答，今天一起玩一下
        </p>
        <p className="mt-1.5 text-[11px] font-semibold tracking-wide text-rose-600/85">
          {MODE_HINTS}
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <p className="text-[12px] font-bold text-stone-600">
            今日獎勵{' '}
            <span className="tabular-nums text-stone-800">
              {miniGamesRewardsToday}/{miniGamesRewardCap}
            </span>
          </p>
          <button
            type="button"
            onClick={() => navigateTo('miniGames')}
            className={`shrink-0 ${lq.btnPrimary} !min-h-10 !px-4 !text-[13px]`}
          >
            🎲 開始玩
          </button>
        </div>
      </div>
    </section>
  );
}

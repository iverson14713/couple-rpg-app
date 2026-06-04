import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
/** 首頁：情侶小遊戲活動 Banner（僅 UI） */
export function HomeMiniGamesFeaturedCard() {
  const { navigateTo } = useCoupleRpgNav();
  const { rpgView } = useLoveQuest();
  const { miniGamesRewardsToday, miniGamesRewardCap } = rpgView;

  return (
    <section
      className="lq-home-banner lq-home-elev lq-home-section-in relative isolate min-h-[6.5rem] overflow-hidden rounded-[24px] px-4 py-4 ring-1 ring-white/50"
      aria-label="情侶小遊戲"
    >
      <div className="lq-home-banner-dice" aria-hidden>
        <span className="lq-home-banner-dice__lg">🎲</span>
        <span className="lq-home-banner-dice__sm">🎲</span>
      </div>

      <div className="relative z-10 flex max-w-[48%] flex-col">
        <h3 className="text-[clamp(1.2rem,5vw,1.35rem)] font-extrabold leading-[1.1] text-white">
          情侶小遊戲
        </h3>
        <p className="lq-banner-tagline mt-1 text-[10px] leading-snug">
          真心話 · 默契挑戰 · 情話骰子
        </p>
        <p className="lq-banner-reward mt-1 text-[9px]">
          今日獎勵 {miniGamesRewardsToday}/{miniGamesRewardCap}
        </p>
        <button
          type="button"
          onClick={() => navigateTo('miniGames')}
          className="lq-ios-cta mt-3 w-fit min-w-[6.5rem] px-5 py-2.5 text-[13px] font-bold text-violet-600 transition active:scale-[0.97]"
        >
          立即開始
        </button>
      </div>
    </section>
  );
}

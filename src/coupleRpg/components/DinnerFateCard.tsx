import { Sparkles, UtensilsCrossed } from 'lucide-react';
import { lq } from '../theme';

export type DinnerFatePhase = 'idle' | 'shuffling' | 'revealed' | 'saved';

type Props = {
  phase: DinnerFatePhase;
  displayTitle: string;
  displaySubtitle: string;
  displayEmoji: string | null;
};

export function DinnerFateCard({ phase, displayTitle, displaySubtitle, displayEmoji }: Props) {
  const isShuffling = phase === 'shuffling';
  const showFoodEmoji = Boolean(displayEmoji) && (phase === 'revealed' || phase === 'saved');

  return (
    <div
      className={`dinner-fate-scene mx-auto w-full max-w-[300px] ${isShuffling ? 'dinner-fate-scene--glow' : ''}`}
      aria-live="polite"
      aria-busy={isShuffling}
    >
      <div
        className={`dinner-fate-flip-inner ${isShuffling ? 'dinner-fate-flip-inner--back' : 'dinner-fate-flip-inner--front'}`}
      >
        {/* 背面 — 抽籤中 */}
        <div className="dinner-fate-face dinner-fate-face--back" aria-hidden={!isShuffling}>
          <div className="dinner-fate-back-pattern" />
          <Sparkles className="relative z-[1] h-7 w-7 text-rose-300/90" strokeWidth={1.5} aria-hidden />
          <p className={`relative z-[1] mt-3 text-center text-[18px] font-bold tracking-tight ${lq.text}`}>
            今晚命運卡
          </p>
          <p className={`relative z-[1] mt-2 max-w-[220px] px-2 text-center text-[13px] font-medium leading-snug ${lq.textSecondary}`}>
            {displaySubtitle}
          </p>
          {isShuffling ? (
            <div className="relative z-[1] mt-3 flex justify-center gap-1" aria-hidden>
              <span className="dinner-fate-dot" />
              <span className="dinner-fate-dot dinner-fate-dot--delay-1" />
              <span className="dinner-fate-dot dinner-fate-dot--delay-2" />
            </div>
          ) : null}
        </div>

        {/* 正面 — idle / 結果 / 已儲存 */}
        <div className="dinner-fate-face dinner-fate-face--front" aria-hidden={isShuffling}>
          <div className="dinner-fate-back-pattern" />
          {showFoodEmoji ? (
            <span className="relative z-[1] text-4xl leading-none" aria-hidden>
              {displayEmoji}
            </span>
          ) : (
            <UtensilsCrossed
              className="relative z-[1] h-8 w-8 text-rose-400/90"
              strokeWidth={1.75}
              aria-hidden
            />
          )}
          <p
            className={`relative z-[1] mt-3 line-clamp-2 max-w-full px-2 text-center text-[26px] font-bold leading-[1.2] ${lq.text}`}
          >
            {displayTitle}
          </p>
          <p
            className={`relative z-[1] mt-2 max-w-full px-3 text-center text-[14px] font-medium leading-[1.4] ${lq.textSecondary}`}
          >
            {displaySubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

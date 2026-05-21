import { UtensilsCrossed } from 'lucide-react';
import { foodEmojiForLabel } from '../lib/dinnerFoodEmoji';
import { lq } from '../theme';

export type DinnerFateCardMode = 'idle' | 'rolling' | 'picked' | 'saved';

type Props = {
  mode: DinnerFateCardMode;
  displayName: string;
  displaySubtitle: string;
};

export function DinnerFateCard({ mode, displayName, displaySubtitle }: Props) {
  const isRolling = mode === 'rolling';
  const showFoodEmoji = mode === 'picked' || mode === 'saved';
  const emoji = showFoodEmoji ? foodEmojiForLabel(displayName) : null;

  return (
    <div
      className={`dinner-fate-scene mx-auto w-full max-w-[300px] ${isRolling ? 'dinner-fate-scene--glow' : ''}`}
      aria-live="polite"
      aria-busy={isRolling}
    >
      <div className={`dinner-fate-shuffle-wrap ${isRolling ? 'dinner-fate-shuffle-wrap--active' : ''}`}>
        <div className="dinner-fate-panel">
          <div className="dinner-fate-back-pattern" aria-hidden />

          {showFoodEmoji ? (
            <span className="relative z-[1] text-4xl leading-none" aria-hidden>
              {emoji}
            </span>
          ) : (
            <UtensilsCrossed
              className={`relative z-[1] h-8 w-8 text-rose-400/90 ${isRolling ? 'motion-safe:animate-pulse' : ''}`}
              strokeWidth={1.75}
              aria-hidden
            />
          )}

          <p
            className={`relative z-[1] mt-3 line-clamp-2 max-w-full px-2 text-center text-[26px] font-bold leading-[1.2] ${lq.text}`}
          >
            {displayName}
          </p>

          <p className={`relative z-[1] mt-2 max-w-full px-3 text-center text-[14px] font-medium leading-[1.4] ${lq.textSecondary}`}>
            {displaySubtitle}
          </p>

          {isRolling ? (
            <div className="relative z-[1] mt-3 flex justify-center gap-1" aria-hidden>
              <span className="dinner-fate-dot" />
              <span className="dinner-fate-dot dinner-fate-dot--delay-1" />
              <span className="dinner-fate-dot dinner-fate-dot--delay-2" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

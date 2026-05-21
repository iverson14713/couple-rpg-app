import { UtensilsCrossed } from 'lucide-react';
import { foodEmojiForLabel } from '../lib/dinnerFoodEmoji';

export type DinnerFateCardPhase = 'shuffling' | 'flipped';

type Props = {
  phase: DinnerFateCardPhase;
  label: string;
  savedOnly?: boolean;
};

export function DinnerFateCard({ phase, label, savedOnly }: Props) {
  const emoji = foodEmojiForLabel(label);
  const isShuffling = phase === 'shuffling';
  const isFlipped = phase === 'flipped';

  return (
    <div
      className={`dinner-fate-scene mx-auto w-full max-w-[280px] ${isShuffling ? 'dinner-fate-scene--glow' : ''}`}
      aria-live="polite"
      aria-busy={isShuffling}
    >
      <div className={`dinner-fate-shuffle-wrap ${isShuffling ? 'dinner-fate-shuffle-wrap--active' : ''}`}>
        <div className={`dinner-fate-inner ${isFlipped ? 'dinner-fate-inner--flipped' : ''}`}>
          <div className="dinner-fate-face dinner-fate-face--back">
            <div className="dinner-fate-back-pattern" aria-hidden />
            <UtensilsCrossed className="relative z-[1] h-7 w-7 text-rose-300/90" strokeWidth={1.75} aria-hidden />
            <p className="relative z-[1] mt-2 text-[11px] font-semibold tracking-wide text-rose-400/90">今晚的命運卡</p>
            <p className="relative z-[1] mt-3 px-2 text-[13px] font-medium leading-snug text-stone-600">
              正在替你們挑選今晚的答案...
            </p>
            {isShuffling ? (
              <div className="relative z-[1] mt-4 flex justify-center gap-1" aria-hidden>
                <span className="dinner-fate-dot" />
                <span className="dinner-fate-dot dinner-fate-dot--delay-1" />
                <span className="dinner-fate-dot dinner-fate-dot--delay-2" />
              </div>
            ) : null}
          </div>

          <div className="dinner-fate-face dinner-fate-face--front">
            <span className="text-4xl leading-none" aria-hidden>
              {emoji}
            </span>
            <p className="mt-2 text-center text-[22px] font-bold leading-tight text-[#2B2B2B]">{label}</p>
            <p className="mt-2 text-center text-[14px] font-semibold text-rose-500">今晚就決定吃這個！</p>
            {savedOnly ? (
              <p className="mt-1 text-center text-[12px] text-stone-500">已儲存今日結果</p>
            ) : (
              <p className="mt-1 text-center text-[12px] text-stone-500">抽籤結果 · 記得儲存</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

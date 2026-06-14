import { UtensilsCrossed } from 'lucide-react';
import { lq } from '../theme';

export type DinnerFatePhase = 'idle' | 'flipping' | 'revealed' | 'saved';

export type DinnerFateReveal = {
  label: string;
  emoji: string;
  fateIndex: number;
  quip: string;
};

type Props = {
  phase: DinnerFatePhase;
  isFlipping: boolean;
  showResultOnBack: boolean;
  emojiPop: boolean;
  reveal: DinnerFateReveal | null;
};

function FateResultContent({
  reveal,
  emojiPop,
  saved,
}: {
  reveal: DinnerFateReveal;
  emojiPop: boolean;
  saved?: boolean;
}) {
  return (
    <>
      <span
        className={`relative z-[1] text-[56px] leading-none ${emojiPop ? 'dinner-fate-emoji--pop' : ''}`}
        aria-hidden
      >
        {reveal.emoji}
      </span>
      <p className={`relative z-[1] mt-3 max-w-full px-2 text-center text-[22px] font-bold leading-tight ${lq.text}`}>
        今晚吃：
        <span className="block text-[26px] text-rose-600">{reveal.label}</span>
      </p>
      <p className={`relative z-[1] mt-2 text-[13px] font-semibold text-amber-600/90`}>
        ⭐ 命運指數 {reveal.fateIndex}%
      </p>
      {saved ? (
        <p className={`relative z-[1] mt-2 text-[13px] font-medium ${lq.textSecondary}`}>已儲存今日結果</p>
      ) : (
        <p className={`relative z-[1] mt-2 max-w-[240px] px-2 text-center text-[13px] italic leading-snug text-stone-500`}>
          「{reveal.quip}」
        </p>
      )}
    </>
  );
}

function FateIdleContent() {
  return (
    <>
      <UtensilsCrossed className="relative z-[1] h-9 w-9 text-rose-400/90" strokeWidth={1.75} aria-hidden />
      <p className={`relative z-[1] mt-3 text-center text-[18px] font-bold tracking-tight ${lq.text}`}>今晚命運卡</p>
      <p className={`relative z-[1] mt-2 max-w-[220px] px-2 text-center text-[13px] font-medium leading-snug ${lq.textSecondary}`}>
        讓命運幫你們決定今晚吃什麼
      </p>
    </>
  );
}

function FateBlankBack() {
  return (
    <div className="relative z-[1] flex flex-col items-center gap-2">
      <div className="h-10 w-10 rounded-full border-2 border-dashed border-rose-200/70 bg-white/40" aria-hidden />
      <p className={`text-[12px] font-medium tracking-wide text-rose-300/90`}>命運翻牌中…</p>
    </div>
  );
}

export function DinnerFateCard({ phase, isFlipping, showResultOnBack, emojiPop, reveal }: Props) {
  const showResultFront = (phase === 'revealed' || phase === 'saved') && reveal && !isFlipping;
  const flipClass = isFlipping
    ? 'dinner-fate-flip-inner--animating'
    : showResultFront
      ? 'dinner-fate-flip-inner--front'
      : 'dinner-fate-flip-inner--front';

  return (
    <div className="dinner-fate-scene mx-auto w-full max-w-[300px]" aria-live="polite" aria-busy={isFlipping}>
      <div className={`dinner-fate-flip-inner ${flipClass}`}>
        <div className="dinner-fate-face dinner-fate-face--front" aria-hidden={isFlipping && showResultOnBack}>
          <div className="dinner-fate-back-pattern" />
          {showResultFront ? (
            <FateResultContent reveal={reveal!} emojiPop={emojiPop} saved={phase === 'saved'} />
          ) : (
            <FateIdleContent />
          )}
        </div>

        <div className="dinner-fate-face dinner-fate-face--back" aria-hidden={!isFlipping}>
          <div className="dinner-fate-back-pattern" />
          {showResultOnBack && reveal ? (
            <FateResultContent reveal={reveal} emojiPop={false} />
          ) : (
            <FateBlankBack />
          )}
        </div>
      </div>
    </div>
  );
}

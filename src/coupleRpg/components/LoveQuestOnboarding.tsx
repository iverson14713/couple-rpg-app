import { useCallback, useState } from 'react';
import { ONBOARDING_SLIDES, type OnboardingSlide } from '../data/onboardingSlides';
import { lq } from '../theme';

type Props = {
  onComplete: () => void;
};

export function LoveQuestOnboarding({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const total = ONBOARDING_SLIDES.length;
  const slide = ONBOARDING_SLIDES[index]!;
  const isLast = index === total - 1;
  const isFirst = index === 0;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      if (clamped === index) return;
      setSlideDir(clamped > index ? 1 : -1);
      setIndex(clamped);
    },
    [index, total]
  );

  const handlePrimary = () => {
    if (isLast) onComplete();
    else goTo(index + 1);
  };

  const primaryLabel = isFirst ? '開始體驗' : isLast ? '開始使用 LoveQuest' : '下一步';
  const slideAnimClass =
    slideDir === 1 ? 'lq-onboarding-slide-forward' : 'lq-onboarding-slide-back';

  return (
    <div
      className="lq-onboarding-screen flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="LoveQuest 新手導覽"
    >
      <div className="lq-onboarding-glow lq-onboarding-glow--tl" aria-hidden />
      <div className="lq-onboarding-glow lq-onboarding-glow--br" aria-hidden />

      <header className="relative z-10 flex shrink-0 items-center justify-center px-5 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="text-[12px] font-bold tracking-wide text-rose-400/90">LoveQuest</span>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col px-5">
        <div
          key={slide.id}
          className={`mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col justify-center py-2 ${slideAnimClass}`}
        >
          <OnboardingSlideView slide={slide} />
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-rose-200/50 bg-white/88 px-5 pt-4 shadow-[0_-8px_32px_-12px_rgba(244,114,182,0.18)] backdrop-blur-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={isFirst}
            className={`min-h-[44px] flex-1 rounded-2xl py-3 text-[15px] font-bold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-0 ${lq.btnSecondary}`}
            aria-hidden={isFirst}
            tabIndex={isFirst ? -1 : 0}
          >
            上一步
          </button>
          <button
            type="button"
            onClick={handlePrimary}
            className={`min-h-[44px] flex-[1.35] rounded-2xl py-3 text-[15px] font-bold text-white shadow-md shadow-rose-300/35 transition active:scale-[0.98] ${lq.btnPrimary}`}
          >
            {primaryLabel}
          </button>
        </div>

        <div className="mb-3 flex justify-center gap-2">
          {ONBOARDING_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`第 ${i + 1} 頁`}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === index ? 'w-6 bg-rose-500' : 'w-2 bg-rose-200/90'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="mx-auto block min-h-[36px] rounded-full px-4 py-1.5 text-[13px] font-semibold text-stone-500 transition active:scale-[0.98] active:opacity-70"
        >
          略過
        </button>
      </footer>
    </div>
  );
}

function OnboardingSlideView({ slide }: { slide: OnboardingSlide }) {
  return (
    <div className="lq-onboarding-glass-card mx-auto flex w-full max-w-sm flex-col items-center px-5 py-7 sm:py-8">
      <div
        className={`mb-5 flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-[1.35rem] text-[3.5rem] leading-none ${lq.iconChip}`}
      >
        <span aria-hidden>{slide.emoji}</span>
      </div>

      <h1 className={`text-center text-[28px] font-extrabold leading-[1.15] tracking-tight ${lq.text}`}>
        {slide.title}
      </h1>

      {slide.subtitle ? (
        <p className={`mt-2.5 text-center text-[15px] font-semibold leading-snug ${lq.textSecondary}`}>
          {slide.subtitle}
        </p>
      ) : null}

      <ul className={`mt-5 w-full space-y-2 ${slide.subtitle ? '' : 'mt-6'}`}>
        {slide.bullets.map((line) => (
          <li
            key={line}
            className="flex items-center justify-center gap-2 text-center text-[14px] font-medium leading-snug text-[#5c4d55]"
          >
            <span className="text-rose-400" aria-hidden>
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {slide.footnote ? (
        <p className={`mt-5 text-center text-[12px] leading-relaxed ${lq.textSecondary}`}>
          {slide.footnote}
        </p>
      ) : null}
      {slide.footnoteMuted ? (
        <p className={`mt-1 text-center text-[11px] leading-relaxed ${lq.textHint}`}>
          {slide.footnoteMuted}
        </p>
      ) : null}
    </div>
  );
}

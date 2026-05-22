import { useCallback, useRef, useState } from 'react';
import { ONBOARDING_SLIDES, type OnboardingSlide } from '../data/onboardingSlides';
import { lq } from '../theme';

type Props = {
  onComplete: () => void;
};

export function LoveQuestOnboarding({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const total = ONBOARDING_SLIDES.length;
  const isLast = index === total - 1;
  const isFirst = index === 0;

  const scrollToIndex = useCallback((next: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(total - 1, next));
    const w = el.clientWidth;
    el.scrollTo({ left: clamped * w, behavior: 'smooth' });
    setIndex(clamped);
  }, [total]);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth <= 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((prev) => (prev === i ? prev : i));
  }, []);

  const handlePrimary = () => {
    if (isLast) onComplete();
    else scrollToIndex(index + 1);
  };

  const primaryLabel = isFirst ? '開始體驗' : isLast ? '開始使用 LoveQuest' : '下一步';

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-gradient-to-b from-rose-50/98 via-[#fef8fa] to-pink-50/95"
      role="dialog"
      aria-modal="true"
      aria-label="LoveQuest 新手導覽"
    >
      <div
        className="pointer-events-none absolute -right-12 top-8 h-48 w-48 rounded-full bg-rose-200/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-8 bottom-24 h-40 w-40 rounded-full bg-pink-200/25 blur-3xl"
        aria-hidden
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <span className="text-[11px] font-semibold text-stone-400">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-stone-500 transition active:scale-[0.98] active:opacity-70"
        >
          略過
        </button>
      </header>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="relative z-10 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <div
            key={slide.id}
            className="flex w-full shrink-0 snap-center flex-col px-6 pb-4 pt-2"
          >
            <OnboardingSlideView slide={slide} />
          </div>
        ))}
      </div>

      <footer className="relative z-10 shrink-0 border-t border-rose-100/60 bg-white/50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md">
        <div className="mb-4 flex justify-center gap-2">
          {ONBOARDING_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`第 ${i + 1} 頁`}
              onClick={() => scrollToIndex(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === index ? 'w-6 bg-rose-500' : 'w-2 bg-rose-200'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {!isFirst ? (
            <button
              type="button"
              onClick={() => scrollToIndex(index - 1)}
              className={`flex-1 rounded-2xl py-3.5 text-[15px] font-bold transition active:scale-[0.98] ${lq.btnSecondary}`}
            >
              上一步
            </button>
          ) : (
            <div className="flex-1" aria-hidden />
          )}
          <button
            type="button"
            onClick={handlePrimary}
            className={`rounded-2xl py-3.5 text-[15px] font-bold text-white shadow-md shadow-rose-300/35 transition active:scale-[0.98] ${
              isFirst ? 'flex-[1.4]' : 'flex-1'
            } ${lq.btnPrimary}`}
          >
            {primaryLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}

function OnboardingSlideView({ slide }: { slide: OnboardingSlide }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <div
        className={`mx-auto mb-6 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-3xl text-[3.25rem] leading-none ${lq.iconChip}`}
      >
        <span aria-hidden>{slide.emoji}</span>
      </div>

      <h1 className={`text-center text-[26px] font-extrabold leading-tight tracking-tight ${lq.text}`}>
        {slide.title}
      </h1>

      {slide.subtitle ? (
        <p className={`mt-3 text-center text-[15px] font-medium leading-snug ${lq.textSecondary}`}>
          {slide.subtitle}
        </p>
      ) : null}

      <ul className={`mt-6 space-y-2.5 ${slide.subtitle ? '' : 'mt-8'}`}>
        {slide.bullets.map((line) => (
          <li
            key={line}
            className={`flex items-start gap-2.5 rounded-xl border border-rose-100/50 bg-white/65 px-3.5 py-2.5 text-[14px] font-medium leading-snug text-[#4a3c44] shadow-sm ring-1 ring-white/50 backdrop-blur-sm`}
          >
            <span className="mt-0.5 text-rose-400" aria-hidden>
              •
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
        <p className={`mt-1.5 text-center text-[11px] leading-relaxed ${lq.textHint}`}>
          {slide.footnoteMuted}
        </p>
      ) : null}
    </div>
  );
}

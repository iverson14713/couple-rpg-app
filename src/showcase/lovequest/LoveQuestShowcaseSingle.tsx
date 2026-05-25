import { useEffect, useMemo, useState } from 'react';
import { getShowcaseSlideById, LOVEQUEST_SHOWCASE_SLIDES } from './slides';
import { LoveQuestShowcaseSlideCanvas } from './LoveQuestShowcaseSlide';
import { ShowcaseFitScale } from './ShowcaseFitScale';
import { parseShowcaseParams } from './parseParams';
type Props = {
  slideId: string;
};

export function LoveQuestShowcaseSingle({ slideId }: Props) {
  const slide = getShowcaseSlideById(slideId);
  const params = useMemo(() => parseShowcaseParams(), []);
  const [index, setIndex] = useState(() =>
    Math.max(0, LOVEQUEST_SHOWCASE_SLIDES.findIndex((s) => s.id === slideId))
  );
  const current = LOVEQUEST_SHOWCASE_SLIDES[index] ?? slide;

  useEffect(() => {
    document.documentElement.classList.add('lq-showcase-screenshot-active');
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.classList.remove('lq-showcase-screenshot-active');
      document.body.style.overflow = '';
    };
  }, []);

  if (!current) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fceef6] p-6 text-center">
        <p className="text-sm font-bold text-rose-700">找不到展示頁：{slideId}</p>
      </main>
    );
  }

  const view = params.view;

  return (
    <div className="lq-showcase-fullscreen fixed inset-0 z-[400] flex flex-col overflow-hidden bg-[#f5f0f3]">
      <div className="min-h-0 flex-1 overflow-hidden">
        <ShowcaseFitScale>
          <LoveQuestShowcaseSlideCanvas slide={current} view={view} />
        </ShowcaseFitScale>
      </div>

      {!params.screenshotMode ? (
        <nav className="flex shrink-0 flex-wrap justify-center gap-2 border-t border-rose-100/60 bg-white/92 px-3 py-3 backdrop-blur-md">
          {LOVEQUEST_SHOWCASE_SLIDES.map((s, i) => (
            <a
              key={s.id}
              href={s.path}
              className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                s.id === current.id ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-800'
              }`}
            >
              {s.marketingTitle}
            </a>
          ))}
        </nav>
      ) : (
        <nav className="flex shrink-0 justify-center gap-2 bg-white/80 py-2 backdrop-blur-sm">
          {LOVEQUEST_SHOWCASE_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-rose-500' : 'w-2 bg-rose-200'
              }`}
              aria-label={s.marketingTitle}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

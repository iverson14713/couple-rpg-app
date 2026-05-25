import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Camera, ExternalLink } from 'lucide-react';
import { ensureAppStoreFontsReady } from '../../components/appStore/fonts';
import { goHome } from '../../legalNavigate';
import { LoveQuestShowcaseSlideCanvas } from './LoveQuestShowcaseSlide';
import { ShowcaseFitScale } from './ShowcaseFitScale';
import { APP_STORE_SCREEN } from './constants';
import { buildShowcaseUrl, parseShowcaseParams } from './parseParams';
import { LOVEQUEST_SHOWCASE_SLIDES } from './slides';

const PREVIEW_SCALE = 0.2;

export function LoveQuestShowcaseHub() {
  const params = useMemo(() => parseShowcaseParams(), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  const screenshotMode = params.screenshotMode;
  const slide = LOVEQUEST_SHOWCASE_SLIDES[activeIndex]!;
  const { w, h } = APP_STORE_SCREEN;

  useEffect(() => {
    let cancelled = false;
    void ensureAppStoreFontsReady().then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('lq-showcase-hub-active');
    return () => document.documentElement.classList.remove('lq-showcase-hub-active');
  }, []);

  const goSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(LOVEQUEST_SHOWCASE_SLIDES.length - 1, index));
    setActiveIndex(clamped);
  };

  if (screenshotMode) {
    return (
      <LoveQuestShowcaseFullscreen slideIndex={activeIndex} onIndexChange={setActiveIndex} />
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5f0f3] pb-20">
      <header className="sticky top-0 z-50 border-b border-rose-100/80 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={goHome}
            className="inline-flex items-center gap-1 rounded-full border border-rose-100 px-3 py-2 text-sm font-semibold text-[#5c4d55]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            返回 App
          </button>
          <p className="text-sm font-extrabold text-rose-700">LoveQuest 上架截圖</p>
          <a
            href="/app-store-screenshot/lovequest"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-4 py-2 text-sm font-bold text-white"
          >
            <Camera className="h-4 w-4" aria-hidden />
            原生截圖
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="rounded-2xl border border-rose-200/80 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm font-bold text-rose-900">匯出 PNG（瀏覽器原生截圖）</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6b5a64]">
            請勿使用 html2canvas。每張固定{' '}
            <strong className="text-[#3a2e34]">
              {w} × {h}
            </strong>{' '}
            的專用頁面即為最終畫面。
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[12px] leading-relaxed text-[#6b5a64]">
            <li>
              執行 <code className="rounded bg-rose-50 px-1">npm run dev:client</code>
            </li>
            <li>
              執行 <code className="rounded bg-rose-50 px-1">npm run screenshot:lovequest</code>（Playwright）
            </li>
            <li>
              或開啟下方連結，Chrome DevTools 設 viewport {w}×{h} 後截圖
            </li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            {LOVEQUEST_SHOWCASE_SLIDES.map((s, i) => (
              <a
                key={s.id}
                href={`/app-store-screenshot/lovequest/${i + 1}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800"
              >
                {i + 1}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-[13px] leading-relaxed text-[#8a7a84]">
          下方為縮小預覽（僅供瀏覽）。正式匯出請用上方原生截圖頁。
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {LOVEQUEST_SHOWCASE_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goSlide(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                i === activeIndex
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-300/40'
                  : 'bg-white text-[#6b5a64] ring-1 ring-rose-100'
              }`}
            >
              {i + 1}. {s.marketingTitle}
            </button>
          ))}
        </div>
      </div>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-4">
        <header className="mb-3 flex w-full flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-[#3a2e34]">
            {activeIndex + 1}. {slide.marketingTitle}
          </p>
          <a
            href={`/app-store-screenshot/lovequest/${activeIndex + 1}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800"
          >
            開啟原生截圖頁 ↗
          </a>
        </header>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-0 shadow-xl">
          <div
            className="overflow-hidden"
            style={{ width: w * PREVIEW_SCALE, height: h * PREVIEW_SCALE }}
          >
            <div
              style={{
                width: w,
                height: h,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: 'top left',
              }}
            >
              {fontsReady ? <LoveQuestShowcaseSlideCanvas slide={slide} /> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

type FullscreenProps = {
  slideIndex: number;
  onIndexChange: (i: number) => void;
};

function LoveQuestShowcaseFullscreen({ slideIndex, onIndexChange }: FullscreenProps) {
  const slide = LOVEQUEST_SHOWCASE_SLIDES[slideIndex]!;

  useEffect(() => {
    document.documentElement.classList.add('lq-showcase-screenshot-active');
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.classList.remove('lq-showcase-screenshot-active');
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="lq-showcase-fullscreen fixed inset-0 z-[400] flex flex-col overflow-hidden bg-[#f5f0f3]">
      <div className="min-h-0 flex-1 overflow-hidden">
        <ShowcaseFitScale>
          <LoveQuestShowcaseSlideCanvas slide={slide} />
        </ShowcaseFitScale>
      </div>

      <nav
        className="flex shrink-0 items-center justify-center gap-3 border-t border-rose-100/60 bg-white px-4 py-3"
        aria-label="切換展示頁"
      >
        {LOVEQUEST_SHOWCASE_SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onIndexChange(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === slideIndex ? 'w-7 bg-rose-500' : 'w-2.5 bg-rose-200'
            }`}
            aria-label={s.marketingTitle}
            aria-current={i === slideIndex}
          />
        ))}
      </nav>
    </div>
  );
}

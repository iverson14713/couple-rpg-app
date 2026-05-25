import { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChevronLeft, Download, Smartphone } from 'lucide-react';
import { ensureAppStoreFontsReady } from '../../components/appStore/fonts';
import { goHome } from '../../legalNavigate';
import { LoveQuestShowcaseSlideCanvas } from './LoveQuestShowcaseSlide';
import { ShowcaseFitScale } from './ShowcaseFitScale';
import { APP_STORE_SCREEN } from './constants';
import { exportLoveQuestShowcase } from './exportShowcase';
import { buildShowcaseUrl, parseShowcaseParams } from './parseParams';
import { LOVEQUEST_SHOWCASE_SLIDES } from './slides';

const PREVIEW_SCALE = 0.2;
const SHOWCASE_PREVIEW_VIEWPORT_ID = 'lq-showcase-preview-viewport';

async function waitForPaint(): Promise<void> {
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  });
}

export function LoveQuestShowcaseHub() {
  const params = useMemo(() => parseShowcaseParams(), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
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

  const exportSlideAt = useCallback(async (index: number) => {
    const s = LOVEQUEST_SHOWCASE_SLIDES[index];
    if (!s) return;

    flushSync(() => setActiveIndex(index));
    await waitForPaint();

    const viewport = document.getElementById(SHOWCASE_PREVIEW_VIEWPORT_ID);
    if (!viewport) return;

    setStatus(`匯出：${s.headline}…`);
    await exportLoveQuestShowcase(viewport, s.filename);
    setStatus(`已下載 ${s.filename}`);
  }, []);

  const exportOne = useCallback(
    async (index: number) => {
      setBusy(true);
      try {
        await exportSlideAt(index);
      } catch (e) {
        console.error(e);
        setStatus('匯出失敗');
      } finally {
        setBusy(false);
      }
    },
    [exportSlideAt]
  );

  const exportAll = useCallback(async () => {
    setBusy(true);
    try {
      for (let i = 0; i < LOVEQUEST_SHOWCASE_SLIDES.length; i++) {
        await exportSlideAt(i);
        await new Promise((r) => setTimeout(r, 400));
      }
      setStatus('5 張已全部匯出');
    } catch (e) {
      console.error(e);
      setStatus('匯出失敗');
    } finally {
      setBusy(false);
    }
  }, [exportSlideAt]);

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
      <header className="sticky top-0 z-50 border-b border-rose-100/80 bg-white/92 px-4 py-3 backdrop-blur-md">
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
          <button
            type="button"
            disabled={busy || !fontsReady}
            onClick={() => void exportAll()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            匯出全部
          </button>
        </div>
        {status ? (
          <p className="mx-auto mt-2 max-w-4xl text-center text-xs text-[#8a7a84]">{status}</p>
        ) : null}
      </header>

      <div className="mx-auto max-w-4xl px-4 py-4">
        <p className="text-center text-[13px] leading-relaxed text-[#8a7a84]">
          手機內為<strong className="font-semibold text-[#5c4d55]">真實 App 元件</strong>（展示用示範資料）·
          匯出尺寸 <strong className="font-semibold text-[#5c4d55]">1284 × 2778</strong>（iPhone 6.5&quot;）·
          離開此頁會還原你的本機資料
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <a
            href={buildShowcaseUrl('/showcase', { screenshotMode: true })}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
          >
            <Smartphone className="h-3.5 w-3.5" aria-hidden />
            全螢幕截圖模式
          </a>
        </div>

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
          <div className="flex gap-2">
            <a
              href={buildShowcaseUrl(slide.path, { screenshotMode: true })}
              className="rounded-full border border-rose-100 bg-white px-3 py-1.5 text-xs font-bold text-rose-700"
            >
              全螢幕截圖
            </a>
            <button
              type="button"
              disabled={busy || !fontsReady}
              onClick={() => void exportOne(activeIndex)}
              className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 disabled:opacity-50"
            >
              下載 PNG
            </button>
          </div>
        </header>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-0 shadow-xl">
          <div
            id={SHOWCASE_PREVIEW_VIEWPORT_ID}
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
              <LoveQuestShowcaseSlideCanvas slide={slide} />
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
        className="flex shrink-0 items-center justify-center gap-3 border-t border-rose-100/60 bg-white/90 px-4 py-3 backdrop-blur-md"
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

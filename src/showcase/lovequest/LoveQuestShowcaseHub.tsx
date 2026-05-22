import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Download, Smartphone } from 'lucide-react';
import { ensureAppStoreFontsReady } from '../../components/appStore/fonts';
import { goHome } from '../../legalNavigate';
import { LoveQuestShowcaseSlideCanvas } from './LoveQuestShowcaseSlide';
import { ShowcaseFitScale } from './ShowcaseFitScale';
import { SHOWCASE_DEVICES, type ShowcaseDeviceId } from './constants';
import { exportLoveQuestShowcase } from './exportShowcase';
import { buildShowcaseUrl, parseShowcaseParams } from './parseParams';
import { LOVEQUEST_SHOWCASE_SLIDES } from './slides';

const PREVIEW_SCALE = 0.2;

export function LoveQuestShowcaseHub() {
  const params = useMemo(() => parseShowcaseParams(), []);
  const [device, setDevice] = useState<ShowcaseDeviceId>(params.device);
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(false);

  const screenshotMode = params.screenshotMode;
  const slide = LOVEQUEST_SHOWCASE_SLIDES[activeIndex]!;
  const { w, h } = SHOWCASE_DEVICES[device];

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

  const exportOne = useCallback(
    async (index: number) => {
      const s = LOVEQUEST_SHOWCASE_SLIDES[index];
      const el = document.getElementById(`lq-showcase-export-${index}`);
      if (!el) return;
      setBusy(true);
      setStatus(`匯出：${s.headline}…`);
      try {
        await exportLoveQuestShowcase(el, s.filename, device);
        setStatus(`已下載 ${s.filename}`);
      } catch (e) {
        console.error(e);
        setStatus('匯出失敗');
      } finally {
        setBusy(false);
      }
    },
    [device]
  );

  const exportAll = useCallback(async () => {
    setBusy(true);
    try {
      for (let i = 0; i < LOVEQUEST_SHOWCASE_SLIDES.length; i++) {
        await exportOne(i);
        await new Promise((r) => setTimeout(r, 400));
      }
      setStatus('5 張已全部匯出');
    } finally {
      setBusy(false);
    }
  }, [exportOne]);

  const goSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(LOVEQUEST_SHOWCASE_SLIDES.length - 1, index));
    setActiveIndex(clamped);
  };

  if (screenshotMode) {
    return (
      <LoveQuestShowcaseFullscreen
        slideIndex={activeIndex}
        device={device}
        onIndexChange={setActiveIndex}
      />
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
          預覽 {device}（{w}×{h}）· 離開此頁會還原你的本機資料
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-bold text-[#9a8a94]">裝置</span>
          {(['6.7', '6.5'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                device === d
                  ? 'bg-rose-500 text-white'
                  : 'border border-rose-100 bg-white text-[#6b5a64]'
              }`}
            >
              iPhone {SHOWCASE_DEVICES[d].label}
            </button>
          ))}
          <a
            href={buildShowcaseUrl('/showcase', { screenshotMode: true, device })}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
          >
            <Smartphone className="h-3.5 w-3.5" aria-hidden />
            一鍵截圖模式
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
              href={buildShowcaseUrl(slide.path, { screenshotMode: true, device })}
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

        <div
          className="overflow-hidden rounded-2xl border border-rose-100 bg-rose-50/50 shadow-xl"
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
            <LoveQuestShowcaseSlideCanvas
              slide={slide}
              device={device}
              exportId={`lq-showcase-preview-${activeIndex}`}
            />
          </div>
        </div>
      </section>

      <section className="pointer-events-none fixed left-[-12000px] top-0" aria-hidden>
        {LOVEQUEST_SHOWCASE_SLIDES.map((s, i) => (
          <LoveQuestShowcaseSlideCanvas
            key={`export-${s.id}`}
            slide={s}
            device={device}
            exportId={`lq-showcase-export-${i}`}
          />
        ))}
      </section>
    </main>
  );
}

type FullscreenProps = {
  slideIndex: number;
  device: ShowcaseDeviceId;
  onIndexChange: (i: number) => void;
};

function LoveQuestShowcaseFullscreen({ slideIndex, device, onIndexChange }: FullscreenProps) {
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
        <ShowcaseFitScale device={device}>
          <LoveQuestShowcaseSlideCanvas slide={slide} device={device} />
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

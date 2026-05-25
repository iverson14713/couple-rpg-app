import { useEffect, useState } from 'react';
import { ensureAppStoreFontsReady } from '../../components/appStore/fonts';
import { APP_STORE_SCREEN } from './constants';
import { LoveQuestShowcaseSlideCanvas } from './LoveQuestShowcaseSlide';
import { LOVEQUEST_SHOWCASE_SLIDES } from './slides';

type Props = {
  /** 1-based slide index (1–5) */
  slideIndex: number;
};

/**
 * 固定 1284×2778 原生截圖畫布 — 供 Playwright / DevTools viewport 擷取。
 * 不使用 transform scale、html2canvas；所見即所得。
 */
export function LoveQuestAppStoreScreenshotPage({ slideIndex }: Props) {
  const slide = LOVEQUEST_SHOWCASE_SLIDES[slideIndex - 1];
  const [ready, setReady] = useState(false);
  const { w, h } = APP_STORE_SCREEN;

  useEffect(() => {
    document.documentElement.classList.add('lq-app-store-screenshot-page');
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    let cancelled = false;
    void ensureAppStoreFontsReady().then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      document.documentElement.classList.remove('lq-app-store-screenshot-page');
      document.body.style.margin = '';
      document.body.style.overflow = '';
    };
  }, []);

  if (!slide) {
    return (
      <main
        className="flex items-center justify-center bg-[#fceef6] text-sm font-bold text-rose-700"
        style={{ width: w, height: h }}
      >
        找不到截圖 #{slideIndex}（請使用 1–5）
      </main>
    );
  }

  if (!ready) {
    return (
      <main
        className="flex items-center justify-center bg-[#fff9fc] text-sm text-[#8a7a84]"
        style={{ width: w, height: h }}
      >
        載入字型…
      </main>
    );
  }

  return (
    <main
      className="lq-native-screenshot-root"
      style={{ width: w, height: h }}
      data-screenshot-ready="true"
      data-slide-index={slideIndex}
      data-filename={slide.filename}
    >
      <LoveQuestShowcaseSlideCanvas slide={slide} nativeScreenshot />
    </main>
  );
}

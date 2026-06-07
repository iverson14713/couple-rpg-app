import { useEffect, useState } from 'react';
import { ensureAppStoreFontsReady } from '../../components/appStore/fonts';
import { IPAD_13_SCREEN } from './ipadConstants';
import { LoveQuestIpadShowcaseSlideCanvas } from './LoveQuestIpadShowcaseSlide';
import { LOVEQUEST_SHOWCASE_SLIDES } from './slides';

/** iPad 匯出順序：main, anniversary, ai-date, level, custom-game */
const IPAD_SLIDE_ORDER = ['sync', 'reminders', 'ai-date', 'rpg', 'games'] as const;

type Props = {
  /** 1-based iPad slide index (1–5) */
  slideIndex: number;
};

/**
 * 固定 2064×2752 iPad 原生截圖畫布 — Playwright 所見即所得。
 */
export function LoveQuestIpadAppStoreScreenshotPage({ slideIndex }: Props) {
  const slideId = IPAD_SLIDE_ORDER[slideIndex - 1];
  const slide = LOVEQUEST_SHOWCASE_SLIDES.find((s) => s.id === slideId);
  const [ready, setReady] = useState(false);
  const { w, h } = IPAD_13_SCREEN;

  useEffect(() => {
    document.documentElement.classList.add('lq-app-store-screenshot-page-ipad');
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    let cancelled = false;
    void ensureAppStoreFontsReady().then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      document.documentElement.classList.remove('lq-app-store-screenshot-page-ipad');
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
        找不到 iPad 截圖 #{slideIndex}（請使用 1–5）
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
      className="lq-native-screenshot-root-ipad"
      style={{ width: w, height: h }}
      data-screenshot-ready="true"
      data-slide-index={slideIndex}
      data-filename={slide.ipadFilename}
    >
      <LoveQuestIpadShowcaseSlideCanvas slide={slide} nativeScreenshot />
    </main>
  );
}

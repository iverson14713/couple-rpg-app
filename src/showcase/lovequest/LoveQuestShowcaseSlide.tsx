import type { LoveQuestShowcaseSlide } from './slides';
import {
  LQ_SHOWCASE_FONT,
  LQ_SHOWCASE_GRADIENT,
  SHOWCASE_BRAND_SIZE,
  SHOWCASE_DEVICES,
  SHOWCASE_HEADLINE_SIZE,
  SHOWCASE_HERO_PB,
  SHOWCASE_HERO_PT,
  SHOWCASE_CANVAS_BOTTOM_PAD,
  SHOWCASE_HERO_PX,
  SHOWCASE_PHONE_GAP_TOP,
  SHOWCASE_SUBTITLE_SIZE,
  getPhoneMockupOuterSize,
  type ShowcaseDeviceId,
} from './constants';
import { ShowcaseBottomDecor } from './components/ShowcaseBottomDecor';
import { ShowcaseCanvasDecor } from './components/ShowcaseCanvasDecor';
import { ShowcaseOrbs } from './components/ShowcaseOrbs';
import { ShowcasePhoneFrame } from './components/ShowcasePhoneFrame';

type Props = {
  slide: LoveQuestShowcaseSlide;
  device?: ShowcaseDeviceId;
  exportId?: string;
  view?: 'marketing' | 'app';
  /** 1284×2778 原生截圖頁：無 opacity 裝飾、無 backdrop-filter */
  nativeScreenshot?: boolean;
};

export function LoveQuestShowcaseSlideCanvas({
  slide,
  device = '6.5',
  exportId,
  view = 'marketing',
  nativeScreenshot = false,
}: Props) {
  const { w, h } = SHOWCASE_DEVICES[device];
  const Screen = slide.Screen;
  const isAppOnly = view === 'app';
  const phone = getPhoneMockupOuterSize(device);

  if (isAppOnly) {
    return (
      <article
        id={exportId}
        className="lq-showcase-canvas-app relative overflow-hidden bg-[#fef9fb]"
        style={{ width: w, height: h, fontFamily: LQ_SHOWCASE_FONT }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 390, height: 844 }}
        >
          <Screen />
        </div>
      </article>
    );
  }

  return (
    <article
      id={exportId}
      className={`lq-showcase-canvas relative flex flex-col overflow-hidden${
        nativeScreenshot ? ' lq-native-screenshot-canvas' : ''
      }`}
      style={{
        width: w,
        height: h,
        fontFamily: LQ_SHOWCASE_FONT,
        background: LQ_SHOWCASE_GRADIENT,
      }}
    >
      {!nativeScreenshot ? (
        <>
          <span className="lq-showcase-canvas-spotlight pointer-events-none absolute inset-0 z-[1]" aria-hidden />
          <ShowcaseOrbs />
          <ShowcaseCanvasDecor />
          <ShowcaseBottomDecor />
        </>
      ) : null}

      <header
        className="lq-showcase-hero relative z-10 shrink-0 text-center"
        style={{
          paddingTop: SHOWCASE_HERO_PT,
          paddingBottom: SHOWCASE_HERO_PB,
          paddingLeft: SHOWCASE_HERO_PX,
          paddingRight: SHOWCASE_HERO_PX,
        }}
      >
        <p
          className="font-semibold tracking-[0.06em] text-rose-400"
          style={{ fontSize: SHOWCASE_BRAND_SIZE }}
        >
          LoveQuest
        </p>
        <span className="mt-1 block text-[28px] leading-none" aria-hidden>
          💗
        </span>
        <h2
          className="lq-showcase-headline mx-auto mt-3 max-w-[1000px] font-extrabold leading-[1.05] tracking-tight text-white"
          style={{
            fontSize: SHOWCASE_HEADLINE_SIZE,
            textShadow:
              '0 2px 8px rgba(190,24,93,0.35), 0 1px 3px rgba(0,0,0,0.15)',
          }}
        >
          {slide.headline}
        </h2>
        <p
          className="mx-auto mt-3 max-w-[920px] font-bold leading-[1.3] text-rose-900/90"
          style={{
            fontSize: SHOWCASE_SUBTITLE_SIZE,
            color: '#9f1239',
          }}
        >
          {slide.subtitle}
        </p>
      </header>

      <section
        className="lq-showcase-phone-section relative z-20 flex min-h-0 flex-1 flex-col items-center justify-end"
        style={{
          paddingTop: SHOWCASE_PHONE_GAP_TOP,
          paddingBottom: SHOWCASE_CANVAS_BOTTOM_PAD,
        }}
      >
        <div
          className="lq-showcase-phone-stage relative"
          style={{ width: phone.width, height: phone.height, isolation: 'isolate' }}
        >
          <ShowcasePhoneFrame device={device}>
            <Screen />
          </ShowcasePhoneFrame>
        </div>
      </section>
    </article>
  );
}

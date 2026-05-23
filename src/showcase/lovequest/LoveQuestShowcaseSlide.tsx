import type { LoveQuestShowcaseSlide } from './slides';
import {
  LQ_SHOWCASE_FONT,
  LQ_SHOWCASE_GRADIENT,
  SHOWCASE_BRAND_SIZE,
  SHOWCASE_CANVAS_PB,
  SHOWCASE_DEVICES,
  SHOWCASE_HEADLINE_SIZE,
  SHOWCASE_HERO_PB,
  SHOWCASE_HERO_PT,
  SHOWCASE_HERO_PX,
  SHOWCASE_PHONE_GAP_TOP,
  SHOWCASE_SUBTITLE_SIZE,
  getPhoneMockupOuterSize,
  type ShowcaseDeviceId,
} from './constants';
import { ShowcaseBottomDecor } from './components/ShowcaseBottomDecor';
import { ShowcaseOrbs } from './components/ShowcaseOrbs';
import { ShowcasePhoneFrame } from './components/ShowcasePhoneFrame';

type Props = {
  slide: LoveQuestShowcaseSlide;
  device: ShowcaseDeviceId;
  exportId?: string;
  view?: 'marketing' | 'app';
};

export function LoveQuestShowcaseSlideCanvas({
  slide,
  device,
  exportId,
  view = 'marketing',
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
      className="lq-showcase-canvas relative flex flex-col overflow-hidden"
      style={{
        width: w,
        height: h,
        fontFamily: LQ_SHOWCASE_FONT,
        background: LQ_SHOWCASE_GRADIENT,
      }}
    >
      <span className="lq-showcase-canvas-spotlight pointer-events-none absolute inset-0 z-[1]" aria-hidden />
      <ShowcaseOrbs />
      <ShowcaseBottomDecor />

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
          className="font-bold tracking-[0.12em] text-white/95"
          style={{ fontSize: SHOWCASE_BRAND_SIZE }}
        >
          LoveQuest
        </p>
        <h2
          className="lq-showcase-headline mt-[10px] font-extrabold leading-[1.06] tracking-tight text-white"
          style={{
            fontSize: SHOWCASE_HEADLINE_SIZE,
            textShadow: '0 4px 32px rgba(190,24,93,0.35), 0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          {slide.headline}
        </h2>
        <p
          className="mx-auto mt-[14px] max-w-[940px] font-semibold leading-[1.28] text-[#fff7fb]"
          style={{
            fontSize: SHOWCASE_SUBTITLE_SIZE,
            textShadow: '0 1px 12px rgba(157,23,77,0.28)',
          }}
        >
          {slide.subtitle}
        </p>
      </header>

      <section
        className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-start"
        style={{ paddingTop: SHOWCASE_PHONE_GAP_TOP, paddingBottom: SHOWCASE_CANVAS_PB }}
      >
        <div className="relative" style={{ width: phone.width, height: phone.height }}>
          <span
            className="lq-showcase-phone-glow pointer-events-none absolute left-1/2 z-[2] -translate-x-1/2"
            style={{
              bottom: '6%',
              width: phone.width * 1.2,
              height: Math.round(phone.height * 0.14),
            }}
            aria-hidden
          />
          <ShowcasePhoneFrame device={device}>
            <Screen />
          </ShowcasePhoneFrame>
        </div>
      </section>
    </article>
  );
}

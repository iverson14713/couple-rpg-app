import type { LoveQuestShowcaseSlide } from './slides';
import {
  LQ_SHOWCASE_FONT,
  LQ_SHOWCASE_GRADIENT,
  PHONE_MOCKUP_TOP,
  SHOWCASE_DEVICES,
  type ShowcaseDeviceId,
} from './constants';
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
      className="lq-showcase-canvas relative overflow-hidden"
      style={{
        width: w,
        height: h,
        fontFamily: LQ_SHOWCASE_FONT,
        background: LQ_SHOWCASE_GRADIENT,
      }}
    >
      <ShowcaseOrbs />

      <header className="absolute left-0 right-0 z-10 px-[56px] pt-[108px] text-center">
        <p className="text-[24px] font-semibold tracking-wide text-white/90">LoveQuest</p>
        <h2
          className="mt-3 text-[62px] font-extrabold leading-[1.06] tracking-tight text-white"
          style={{ textShadow: '0 2px 28px rgba(190,24,93,0.2)' }}
        >
          {slide.headline}
        </h2>
        <p className="mx-auto mt-5 max-w-[1000px] text-[32px] font-medium leading-snug text-white/92">
          {slide.subtitle}
        </p>
      </header>

      <section className="absolute left-1/2 z-10 -translate-x-1/2" style={{ top: PHONE_MOCKUP_TOP }}>
        <ShowcasePhoneFrame>
          <Screen />
        </ShowcasePhoneFrame>
      </section>
    </article>
  );
}

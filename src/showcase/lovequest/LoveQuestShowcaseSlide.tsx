import type { LoveQuestShowcaseSlide } from './slides';
import {
  LQ_SHOWCASE_FONT,
  LQ_SHOWCASE_GRADIENT,
  PHONE_MOCKUP_BOTTOM,
  SHOWCASE_DEVICES,
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
  const phone = getPhoneMockupOuterSize();
  const phoneBottom = Math.round(PHONE_MOCKUP_BOTTOM * (h / 2796));

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
      <ShowcaseBottomDecor />

      {/* 緊湊 Hero：主標偏上、留出手機空間 */}
      <header className="lq-showcase-hero absolute left-0 right-0 z-10 px-[48px] pt-[72px] text-center">
        <p className="text-[20px] font-semibold tracking-wide text-white/88">LoveQuest</p>
        <h2
          className="mt-2 text-[54px] font-extrabold leading-[1.08] tracking-tight text-white"
          style={{ textShadow: '0 2px 24px rgba(190,24,93,0.22)' }}
        >
          {slide.headline}
        </h2>
        <p className="mx-auto mt-3 max-w-[920px] text-[28px] font-medium leading-snug text-white/90">
          {slide.subtitle}
        </p>
      </header>

      {/* 手機貼底、大尺寸 */}
      <span
        className="lq-showcase-phone-glow pointer-events-none absolute left-1/2 z-[2] -translate-x-1/2"
        style={{
          bottom: phoneBottom - 24,
          width: phone.width * 1.15,
          height: Math.round(phone.height * 0.12),
        }}
        aria-hidden
      />

      <section
        className="absolute left-1/2 z-10 -translate-x-1/2"
        style={{ bottom: phoneBottom, width: phone.width, height: phone.height }}
      >
        <ShowcasePhoneFrame>
          <Screen />
        </ShowcasePhoneFrame>
      </section>
    </article>
  );
}

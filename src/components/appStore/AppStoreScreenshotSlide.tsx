import type { AppStoreSlide } from './slides';
import {
  APP_STORE_FONT_FAMILY,
  ASPECT_H,
  ASPECT_W,
  BRAND_FONT_PX,
  BRAND_GRADIENT,
  HEADLINE_FONT_PX,
  HEADER_PT,
  HEADER_PX,
  PHONE_MOCKUP_TOP,
  SUBTITLE_FONT_PX,
} from './constants';
import { IphoneMockup } from './IphoneMockup';

type AppStoreScreenshotSlideProps = {
  slide: AppStoreSlide;
  exportId?: string;
};

export function AppStoreScreenshotSlide({ slide, exportId }: AppStoreScreenshotSlideProps) {
  const Screen = slide.Screen;

  return (
    <article
      id={exportId}
      className="app-store-slide relative overflow-hidden bg-orange-500"
      style={{
        width: ASPECT_W,
        height: ASPECT_H,
        fontFamily: APP_STORE_FONT_FAMILY,
        background: BRAND_GRADIENT,
      }}
    >
      <span
        className="pointer-events-none absolute -left-32 -top-24 h-[480px] w-[480px] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 45%, transparent 70%)',
        }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-24 -right-24 h-[560px] w-[560px] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 60% 55%, rgba(254,215,170,0.4) 0%, rgba(251,146,60,0.12) 50%, transparent 72%)',
        }}
        aria-hidden
      />

      <header
        className="absolute left-0 right-0 z-10 text-center text-white"
        style={{
          paddingLeft: HEADER_PX,
          paddingRight: HEADER_PX,
          paddingTop: HEADER_PT,
          textShadow: '0 2px 24px rgba(0,0,0,0.12)',
        }}
      >
        <p
          className="font-semibold tracking-wide text-white/90"
          style={{ fontSize: BRAND_FONT_PX }}
        >
          Pet Care
        </p>
        <h2
          className="mt-3 font-bold leading-[1.08] tracking-tight"
          style={{ fontSize: HEADLINE_FONT_PX, letterSpacing: '-0.02em' }}
        >
          {slide.headline}
        </h2>
        <p
          className="mx-auto mt-5 max-w-[1000px] font-medium leading-snug text-white/92"
          style={{ fontSize: SUBTITLE_FONT_PX }}
        >
          {slide.subtitle}
        </p>
      </header>

      <section className="absolute left-1/2 z-10 -translate-x-1/2" style={{ top: PHONE_MOCKUP_TOP }}>
        <IphoneMockup>
          <Screen />
        </IphoneMockup>
      </section>
    </article>
  );
}

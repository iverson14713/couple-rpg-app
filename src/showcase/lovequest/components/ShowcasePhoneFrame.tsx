import type { CSSProperties, ReactNode } from 'react';
import { DEVICE_LOGICAL_W, getPhoneMockupMetrics, type ShowcaseDeviceId } from '../constants';

const SCREEN_FILL = '#fef9fb';
const SCREEN_BLEED = 4;

function screenClip(radius: number): string {
  return `inset(0 round ${radius}px)`;
}

function ScreenCornerGuards({ radius }: { radius: number }) {
  const size = Math.max(14, Math.round(radius * 0.45));
  const base: CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    backgroundColor: SCREEN_FILL,
    zIndex: 40,
    pointerEvents: 'none',
  };
  return (
    <>
      <span className="lq-screen-corner-guard" style={{ ...base, top: 0, left: 0 }} aria-hidden />
      <span className="lq-screen-corner-guard" style={{ ...base, top: 0, right: 0 }} aria-hidden />
      <span className="lq-screen-corner-guard" style={{ ...base, bottom: 0, left: 0 }} aria-hidden />
      <span className="lq-screen-corner-guard" style={{ ...base, bottom: 0, right: 0 }} aria-hidden />
    </>
  );
}

type Props = {
  children: ReactNode;
  device: ShowcaseDeviceId;
};

export function ShowcasePhoneFrame({ children, device }: Props) {
  const m = getPhoneMockupMetrics(device);
  const {
    screenW,
    screenH,
    bezel,
    frameRadius,
    screenRadius,
    screenScale,
    screenSafeInset,
    islandW,
    islandH,
    islandTop,
    outerW,
    outerH,
  } = m;

  const islandRadius = Math.round(islandH / 2);
  const contentH = (screenH - screenSafeInset * 2) / screenScale;
  const clipR = screenRadius + 2;
  const screenLeft = bezel - SCREEN_BLEED;
  const screenTop = bezel - SCREEN_BLEED;
  const screenOuterW = screenW + SCREEN_BLEED * 2;
  const screenOuterH = screenH + SCREEN_BLEED * 2;

  return (
    <section
      className="lq-showcase-phone relative shrink-0"
      style={{ width: outerW, height: outerH }}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          borderRadius: frameRadius,
          boxShadow:
            '0 28px 72px -14px rgba(15, 23, 42, 0.2), 0 14px 40px -10px rgba(190, 24, 93, 0.32), 0 0 72px 12px rgba(244, 114, 182, 0.28)',
        }}
      />

      <span
        className="absolute inset-0 z-0"
        style={{
          borderRadius: frameRadius,
          background:
            'linear-gradient(160deg, #6b6b70 0%, #45454a 10%, #2e2e32 32%, #1a1a1d 58%, #0c0c0e 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.25)',
        }}
      />

      <span
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          borderRadius: frameRadius,
          border: '1px solid rgba(255,255,255,0.14)',
        }}
      />

      <span
        className="lq-showcase-phone-screen absolute z-20 overflow-hidden"
        style={{
          left: screenLeft,
          top: screenTop,
          width: screenOuterW,
          height: screenOuterH,
          backgroundColor: SCREEN_FILL,
          clipPath: screenClip(clipR),
          WebkitClipPath: screenClip(clipR),
        }}
      >
        <span
          className="lq-showcase-phone-screen-inner absolute inset-0 overflow-hidden"
          style={{
            backgroundColor: SCREEN_FILL,
            padding: screenSafeInset + SCREEN_BLEED,
            boxSizing: 'border-box',
          }}
        >
          <span
            className="lq-showcase-phone-screen-content block origin-top-left"
            style={{
              width: DEVICE_LOGICAL_W,
              height: contentH,
              transform: `scale(${screenScale})`,
              transformOrigin: 'top left',
              backgroundColor: SCREEN_FILL,
            }}
          >
            {children}
          </span>
        </span>

        <ScreenCornerGuards radius={screenRadius} />

        <span
          className="absolute left-1/2 z-30 -translate-x-1/2"
          style={{
            top: islandTop + SCREEN_BLEED,
            width: islandW,
            height: islandH,
            borderRadius: islandRadius,
            background: '#0a0a0a',
          }}
        />
      </span>
    </section>
  );
}

import type { ReactNode } from 'react';
import { DEVICE_LOGICAL_W, getPhoneMockupMetrics, type ShowcaseDeviceId } from '../constants';

const SCREEN_FILL = '#fef9fb';

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

  return (
    <section
      className="lq-showcase-phone relative shrink-0"
      style={{ width: outerW, height: outerH }}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: frameRadius,
          boxShadow:
            '0 28px 72px -14px rgba(15, 23, 42, 0.2), 0 14px 40px -10px rgba(190, 24, 93, 0.32), 0 0 72px 12px rgba(244, 114, 182, 0.28)',
        }}
      />

      <span
        className="absolute inset-0"
        style={{
          borderRadius: frameRadius,
          background:
            'linear-gradient(160deg, #6b6b70 0%, #45454a 10%, #2e2e32 32%, #1a1a1d 58%, #0c0c0e 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.4), inset 1px 0 0 rgba(255,255,255,0.1)',
        }}
      />

      <span
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: frameRadius,
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.35)',
        }}
      />

      {/* 螢幕：單層粉白底 + 圓角裁切，避免黑底在四角露出 */}
      <span
        className="lq-showcase-phone-screen absolute overflow-hidden"
        style={{
          left: bezel,
          top: bezel,
          width: screenW,
          height: screenH,
          borderRadius: screenRadius,
          backgroundColor: SCREEN_FILL,
        }}
      >
        <span
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: screenRadius,
            backgroundColor: SCREEN_FILL,
            padding: screenSafeInset,
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

        <span
          className="absolute left-1/2 z-30 -translate-x-1/2"
          style={{
            top: islandTop,
            width: islandW,
            height: islandH,
            borderRadius: islandRadius,
            background: '#0a0a0a',
            boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
          }}
        />
      </span>
    </section>
  );
}

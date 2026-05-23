import type { ReactNode } from 'react';
import { DEVICE_LOGICAL_W, getPhoneMockupMetrics, type ShowcaseDeviceId } from '../constants';

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

  return (
    <section
      className="lq-showcase-phone relative shrink-0"
      style={{ width: outerW, height: outerH }}
      aria-hidden
    >
      {/* 柔和外陰影 */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: frameRadius,
          boxShadow:
            '0 48px 96px -28px rgba(15, 23, 42, 0.28), 0 20px 40px -20px rgba(190, 24, 93, 0.22)',
        }}
      />

      {/* 機身：深灰漸層 + 金屬邊緣 */}
      <span
        className="absolute inset-0"
        style={{
          borderRadius: frameRadius,
          background:
            'linear-gradient(155deg, #5c5c62 0%, #3d3d42 12%, #252528 38%, #141416 68%, #09090b 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.45), inset 1px 0 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(0,0,0,0.2)',
        }}
      />

      {/* 外圈金屬高光 */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: frameRadius,
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.35)',
        }}
      />

      {/* 螢幕開孔 */}
      <span
        className="absolute overflow-hidden bg-[#0a0a0a]"
        style={{
          left: bezel,
          top: bezel,
          width: screenW,
          height: screenH,
          borderRadius: screenRadius,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.65)',
        }}
      >
        {/* 螢幕內容（安全邊距，不貼邊） */}
        <span
          className="absolute overflow-hidden bg-[#fef9fb]"
          style={{
            left: screenSafeInset,
            top: screenSafeInset,
            right: screenSafeInset,
            bottom: screenSafeInset,
            borderRadius: Math.max(4, screenRadius - screenSafeInset),
          }}
        >
          <span
            className="origin-top-left block"
            style={{
              width: DEVICE_LOGICAL_W,
              height: (screenH - screenSafeInset * 2) / screenScale,
              transform: `scale(${screenScale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </span>
        </span>

        {/* 動態島（螢幕座標系） */}
        <span
          className="absolute left-1/2 z-30 -translate-x-1/2"
          style={{
            top: islandTop,
            width: islandW,
            height: islandH,
            borderRadius: islandRadius,
            background: '#000000',
            boxShadow:
              '0 1px 2px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.04)',
          }}
        />
      </span>
    </section>
  );
}

import type { ReactNode } from 'react';
import { DEVICE_LOGICAL_W, getPhoneMockupMetrics, type ShowcaseDeviceId } from '../constants';

type Props = {
  children: ReactNode;
  device: ShowcaseDeviceId;
};

export function ShowcasePhoneFrame({ children, device }: Props) {
  const {
    screenW,
    screenH,
    bezel,
    frameRadius,
    screenRadius,
    screenScale,
    outerW,
    outerH,
  } = getPhoneMockupMetrics(device);

  const islandTop = Math.round(18 * (screenW / 612));
  const islandW = Math.round(110 * (screenW / 612));
  const islandH = Math.round(28 * (screenW / 612));

  return (
    <section className="lq-showcase-phone relative shrink-0" style={{ width: outerW, height: outerH }} aria-hidden>
      <span
        className="absolute inset-0 bg-stone-900"
        style={{
          borderRadius: frameRadius,
          boxShadow:
            '0 56px 120px -20px rgba(190, 24, 93, 0.42), 0 24px 48px -16px rgba(0,0,0,0.25), inset 0 0 0 2px rgba(255,255,255,0.12)',
        }}
      />
      <span
        className="absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-black"
        style={{ top: islandTop, width: islandW, height: islandH }}
      />
      <span
        className="absolute overflow-hidden bg-[#fef9fb]"
        style={{
          left: bezel,
          top: bezel,
          width: screenW,
          height: screenH,
          borderRadius: screenRadius,
        }}
      >
        <span
          className="origin-top-left block"
          style={{
            width: DEVICE_LOGICAL_W,
            height: screenH / screenScale,
            transform: `scale(${screenScale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </span>
      </span>
    </section>
  );
}

import type { ReactNode } from 'react';
import {
  DEVICE_LOGICAL_W,
  PHONE_BEZEL,
  PHONE_FRAME_RADIUS,
  PHONE_SCREEN_H,
  PHONE_SCREEN_RADIUS,
  PHONE_SCREEN_W,
  SCREEN_SCALE,
} from '../constants';

type Props = {
  children: ReactNode;
};

export function ShowcasePhoneFrame({ children }: Props) {
  const outerW = PHONE_SCREEN_W + PHONE_BEZEL * 2;
  const outerH = PHONE_SCREEN_H + PHONE_BEZEL * 2;
  const islandTop = Math.round(18 * (PHONE_SCREEN_W / 612));
  const islandW = Math.round(110 * (PHONE_SCREEN_W / 612));
  const islandH = Math.round(28 * (PHONE_SCREEN_W / 612));

  return (
    <section className="lq-showcase-phone relative shrink-0" style={{ width: outerW, height: outerH }} aria-hidden>
      <span
        className="absolute inset-0 bg-stone-900"
        style={{
          borderRadius: PHONE_FRAME_RADIUS,
          boxShadow:
            '0 56px 120px -20px rgba(190, 24, 93, 0.4), 0 24px 48px -16px rgba(0,0,0,0.25), inset 0 0 0 2px rgba(255,255,255,0.1)',
        }}
      />
      <span
        className="absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-black"
        style={{ top: islandTop, width: islandW, height: islandH }}
      />
      <span
        className="absolute overflow-hidden bg-[#fef9fb]"
        style={{
          left: PHONE_BEZEL,
          top: PHONE_BEZEL,
          width: PHONE_SCREEN_W,
          height: PHONE_SCREEN_H,
          borderRadius: PHONE_SCREEN_RADIUS,
        }}
      >
        <span
          className="origin-top-left block"
          style={{
            width: DEVICE_LOGICAL_W,
            height: PHONE_SCREEN_H / SCREEN_SCALE,
            transform: `scale(${SCREEN_SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </span>
      </span>
    </section>
  );
}

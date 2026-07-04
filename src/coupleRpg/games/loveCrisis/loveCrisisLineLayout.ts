import type { CSSProperties } from 'react';

/** 遊戲線角度：0° 朝上、90° 朝右、180° 朝下（自圓心向外放射）。 */
function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * 依線條朝向，將 label / badge 往圓心內側偏移，避免貼邊被裁切。
 */
export function getLineLabelLayout(angle: number): CSSProperties {
  const a = normalizeAngle(angle);
  let shiftX = 0;
  let shiftY = 0;

  if (a > 25 && a < 155) {
    const edge = a <= 90 ? 90 - a : a - 90;
    shiftX = -14 - edge * 0.25;
  }

  if (a > 205 && a < 335) {
    const edge = a <= 270 ? 270 - a : a - 270;
    shiftX = 14 + edge * 0.25;
  }

  if (a > 330 || a < 30) {
    shiftY = 10;
  }

  if (a > 130 && a < 230) {
    const edge = Math.abs(a - 180);
    shiftY = -16 - edge * 0.2;
  }

  return {
    '--line-label-shift-x': `${Math.round(shiftX)}px`,
    '--line-label-shift-y': `${Math.round(shiftY)}px`,
    '--line-badge-shift-x': `${Math.round(shiftX)}px`,
    '--line-badge-shift-y': `${Math.round(shiftY - 8)}px`,
    '--line-hint-shift-x': `${Math.round(shiftX)}px`,
    '--line-hint-shift-y': `${Math.round(shiftY - 14)}px`,
  };
}

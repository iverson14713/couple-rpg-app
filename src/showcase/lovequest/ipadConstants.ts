/** App Store Connect — iPad Pro 12.9" / 13" Display (2064 × 2752) */
export const IPAD_13_SCREEN = {
  w: 2064,
  h: 2752,
  label: '13"',
} as const;

export const IPAD_LAYOUT = {
  padX: 96,
  padTop: 72,
  padBottom: 64,
  colGap: 72,
  leftColW: 880,
  brandSize: 46,
  headlineSize: 128,
  subtitleSize: 46,
  pillSize: 28,
  bulletSize: 30,
  bulletSubSize: 24,
  featureRowH: 300,
  featureRowGap: 28,
  coupleMaxW: 520,
  coupleMaxH: 420,
} as const;

const BASE_PHONE_SCREEN_W = Math.round(612 * 1.1);
const BASE_PHONE_SCREEN_H = Math.round(1328 * 1.1);
const BASE_PHONE_BEZEL = 10;

/** iPad 雙欄：右欄手機 mockup 依可用高度計算縮放 */
export function getIpadPhoneMockupMetrics() {
  const { h: canvasH } = IPAD_13_SCREEN;
  const { padTop, padBottom, featureRowH } = IPAD_LAYOUT;
  const availableH = canvasH - padTop - padBottom - featureRowH - 48;
  const baseOuterH = BASE_PHONE_SCREEN_H + BASE_PHONE_BEZEL * 2;
  const fitScale = (availableH / baseOuterH) * 0.94;
  const scale = Math.max(1.18, Math.min(1.72, fitScale));

  const screenW = Math.round(BASE_PHONE_SCREEN_W * scale);
  const screenH = Math.round(BASE_PHONE_SCREEN_H * scale);
  const bezel = Math.round(BASE_PHONE_BEZEL * scale);
  const logicalScale = screenW / 390;

  const screenRadius = Math.round(screenW * 0.082);
  const frameRadius = Math.round(screenRadius + bezel * 0.32);

  return {
    scale,
    screenW,
    screenH,
    bezel,
    frameRadius,
    screenRadius,
    screenScale: logicalScale,
    screenSafeInset: Math.max(2, Math.round(2 * logicalScale)),
    islandW: Math.round(124 * logicalScale),
    islandH: Math.round(38 * logicalScale),
    islandTop: Math.round(14 * logicalScale),
    outerW: screenW + bezel * 2,
    outerH: screenH + bezel * 2,
  };
}

export function getIpadPhoneOuterSize() {
  const m = getIpadPhoneMockupMetrics();
  return { width: m.outerW, height: m.outerH };
}

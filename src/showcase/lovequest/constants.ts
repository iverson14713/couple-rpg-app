/** App Store 6.7" — iPhone 14/15 Pro Max */
export const DEVICE_67 = { w: 1290, h: 2796, label: '6.7"' } as const;

/** App Store 6.5" — iPhone 11 Pro Max / XS Max */
export const DEVICE_65 = { w: 1242, h: 2688, label: '6.5"' } as const;

export type ShowcaseDeviceId = '6.7' | '6.5';

export const SHOWCASE_DEVICES: Record<ShowcaseDeviceId, { w: number; h: number; label: string }> = {
  '6.7': DEVICE_67,
  '6.5': DEVICE_65,
};

export const DEVICE_LOGICAL_W = 390;

const BASE_PHONE_SCREEN_W = 612;
const BASE_PHONE_SCREEN_H = 1328;
/** 極薄邊框 */
const BASE_PHONE_BEZEL = 14;

const ISLAND_W_LOGICAL = 124;
const ISLAND_H_LOGICAL = 38;
const ISLAND_TOP_LOGICAL = 14;
const SCREEN_SAFE_INSET_LOGICAL = 2;

/** Hero（1290×2796） */
export const SHOWCASE_HERO_PT = 78;
export const SHOWCASE_HERO_PB = 10;
export const SHOWCASE_HERO_PX = 52;

export const SHOWCASE_BRAND_SIZE = 30;
export const SHOWCASE_HEADLINE_SIZE = 96;
export const SHOWCASE_SUBTITLE_SIZE = 40;

export const SHOWCASE_PHONE_GAP_TOP = 6;
/** 手機底部留白，確保整機完整露出 */
export const SHOWCASE_CANVAS_BOTTOM_PAD = 44;

/** 估算 Hero 區高度（與 LoveQuestShowcaseSlide 排版一致） */
function estimateHeroBlockHeight(): number {
  return (
    SHOWCASE_HERO_PT +
    SHOWCASE_HERO_PB +
    SHOWCASE_BRAND_SIZE +
    28 +
    12 +
    Math.ceil(SHOWCASE_HEADLINE_SIZE * 1.06) +
    12 +
    Math.ceil(SHOWCASE_SUBTITLE_SIZE * 1.3)
  );
}

/**
 * 依畫布高度計算 mockup 縮放，保證整支手機不被裁切。
 */
export function getPhoneMockupScale(device: ShowcaseDeviceId): number {
  const { h } = SHOWCASE_DEVICES[device];
  const heroBlock = estimateHeroBlockHeight();
  const available = h - heroBlock - SHOWCASE_PHONE_GAP_TOP - SHOWCASE_CANVAS_BOTTOM_PAD;
  const baseOuterH = BASE_PHONE_SCREEN_H + BASE_PHONE_BEZEL * 2;
  const fitScale = (available / baseOuterH) * 0.992;
  return Math.max(1.15, Math.min(1.82, fitScale));
}

export function getPhoneMockupMetrics(device: ShowcaseDeviceId) {
  const scale = getPhoneMockupScale(device);
  const screenW = Math.round(BASE_PHONE_SCREEN_W * scale);
  const screenH = Math.round(BASE_PHONE_SCREEN_H * scale);
  const bezel = Math.round(BASE_PHONE_BEZEL * scale);
  const logicalScale = screenW / DEVICE_LOGICAL_W;

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
    screenSafeInset: Math.max(2, Math.round(SCREEN_SAFE_INSET_LOGICAL * logicalScale)),
    islandW: Math.round(ISLAND_W_LOGICAL * logicalScale),
    islandH: Math.round(ISLAND_H_LOGICAL * logicalScale),
    islandTop: Math.round(ISLAND_TOP_LOGICAL * logicalScale),
    outerW: screenW + bezel * 2,
    outerH: screenH + bezel * 2,
  };
}

export function getPhoneMockupOuterSize(device: ShowcaseDeviceId = '6.7'): {
  width: number;
  height: number;
} {
  const m = getPhoneMockupMetrics(device);
  return { width: m.outerW, height: m.outerH };
}

export const LQ_SHOWCASE_GRADIENT =
  'linear-gradient(180deg, #fff9fc 0%, #fff0f7 18%, #fde4f0 42%, #f8c9e0 68%, #f3aed4 88%, #eea3cc 100%)';

export const LQ_SHOWCASE_FONT =
  '-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Segoe UI", sans-serif';

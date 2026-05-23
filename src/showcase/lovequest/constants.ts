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

/** 手機放大：填滿畫面、底部微裁切（參考 App Store 構圖） */
const PHONE_MOCKUP_SCALE_67 = 1.8;
const PHONE_MOCKUP_SCALE_65 = 1.7;

const ISLAND_W_LOGICAL = 124;
const ISLAND_H_LOGICAL = 38;
const ISLAND_TOP_LOGICAL = 14;
const SCREEN_SAFE_INSET_LOGICAL = 2;

/** Hero（1290×2796）— 緊湊、標題區偏上但整體飽滿 */
export const SHOWCASE_HERO_PT = 78;
export const SHOWCASE_HERO_PB = 10;
export const SHOWCASE_HERO_PX = 52;

export const SHOWCASE_BRAND_SIZE = 30;
export const SHOWCASE_HEADLINE_SIZE = 96;
export const SHOWCASE_SUBTITLE_SIZE = 40;

export const SHOWCASE_PHONE_GAP_TOP = 6;

/** 畫布底部裁切係數（手機略往下延伸） */
export const SHOWCASE_PHONE_CROP_RATIO = 0.042;
export const SHOWCASE_PHONE_PUSH_RATIO = 0.012;

export function getPhoneMockupScale(device: ShowcaseDeviceId): number {
  return device === '6.5' ? PHONE_MOCKUP_SCALE_65 : PHONE_MOCKUP_SCALE_67;
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

/** 淺粉漸層 + 中部光暈（對齊參考圖） */
export const LQ_SHOWCASE_GRADIENT =
  'linear-gradient(180deg, #fff9fc 0%, #fff0f7 18%, #fde4f0 42%, #f8c9e0 68%, #f3aed4 88%, #eea3cc 100%)';

export const LQ_SHOWCASE_FONT =
  '-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Segoe UI", sans-serif';

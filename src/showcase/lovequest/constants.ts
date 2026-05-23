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
const BASE_PHONE_BEZEL = 44;

/** 6.7" 手機 mockup 放大（約 +15%） */
const PHONE_MOCKUP_SCALE_67 = 1.72;
/** 6.5" 略縮，避免裁切且維持上下飽滿 */
const PHONE_MOCKUP_SCALE_65 = 1.62;

/** Hero 區（1290×2796 畫布座標） */
export const SHOWCASE_HERO_PT = 96;
export const SHOWCASE_HERO_PB = 20;
export const SHOWCASE_HERO_PX = 48;

/** 上架圖 typography（全 slide 一致） */
export const SHOWCASE_BRAND_SIZE = 24;
export const SHOWCASE_HEADLINE_SIZE = 82;
export const SHOWCASE_SUBTITLE_SIZE = 35;

/** 標題與手機 mockup 間距（縮小中空留白） */
export const SHOWCASE_PHONE_GAP_TOP = 16;
export const SHOWCASE_CANVAS_PB = 40;

export function getPhoneMockupScale(device: ShowcaseDeviceId): number {
  return device === '6.5' ? PHONE_MOCKUP_SCALE_65 : PHONE_MOCKUP_SCALE_67;
}

export function getPhoneMockupMetrics(device: ShowcaseDeviceId) {
  const scale = getPhoneMockupScale(device);
  const screenW = Math.round(BASE_PHONE_SCREEN_W * scale);
  const screenH = Math.round(BASE_PHONE_SCREEN_H * scale);
  const bezel = Math.round(BASE_PHONE_BEZEL * scale);
  return {
    scale,
    screenW,
    screenH,
    bezel,
    frameRadius: Math.round(56 * scale),
    screenRadius: Math.round(44 * scale),
    screenScale: screenW / DEVICE_LOGICAL_W,
    outerW: screenW + bezel * 2,
    outerH: screenH + bezel * 2,
  };
}

/** @deprecated 使用 getPhoneMockupMetrics(device) */
export function getPhoneMockupOuterSize(device: ShowcaseDeviceId = '6.7'): {
  width: number;
  height: number;
} {
  const m = getPhoneMockupMetrics(device);
  return { width: m.outerW, height: m.outerH };
}

export const LQ_SHOWCASE_GRADIENT =
  'linear-gradient(165deg, #fff5f9 0%, #fce7f3 16%, #fbcfe8 38%, #f9a8d4 62%, #f472b6 92%, #ec4899 100%)';

export const LQ_SHOWCASE_FONT =
  '-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Segoe UI", sans-serif';

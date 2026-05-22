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

/** 放大 mockup，目標佔 canvas 高度約 75–78%（App Store 常見比例） */
export const PHONE_MOCKUP_SCALE = 1.5;

export const PHONE_SCREEN_W = Math.round(BASE_PHONE_SCREEN_W * PHONE_MOCKUP_SCALE);
export const PHONE_SCREEN_H = Math.round(BASE_PHONE_SCREEN_H * PHONE_MOCKUP_SCALE);
export const PHONE_BEZEL = Math.round(BASE_PHONE_BEZEL * PHONE_MOCKUP_SCALE);
export const PHONE_FRAME_RADIUS = Math.round(56 * PHONE_MOCKUP_SCALE);
export const PHONE_SCREEN_RADIUS = Math.round(44 * PHONE_MOCKUP_SCALE);
export const SCREEN_SCALE = PHONE_SCREEN_W / DEVICE_LOGICAL_W;

/** 手機貼近底部，避免下方大片空白 */
export const PHONE_MOCKUP_BOTTOM = 44;

export function getPhoneMockupOuterSize(): { width: number; height: number } {
  return {
    width: PHONE_SCREEN_W + PHONE_BEZEL * 2,
    height: PHONE_SCREEN_H + PHONE_BEZEL * 2,
  };
}

export const LQ_SHOWCASE_GRADIENT =
  'linear-gradient(165deg, #fff5f9 0%, #fce7f3 18%, #fbcfe8 42%, #f9a8d4 68%, #f472b6 100%)';

export const LQ_SHOWCASE_FONT =
  '-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Segoe UI", sans-serif';

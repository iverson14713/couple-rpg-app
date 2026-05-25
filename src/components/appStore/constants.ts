/**
 * App Store Connect — iPhone 6.5" Display (Portrait)
 * @see https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
 */
export const ASPECT_W = 1284;
export const ASPECT_H = 2778;

export const APP_STORE_SCREEN_W = ASPECT_W;
export const APP_STORE_SCREEN_H = ASPECT_H;

/** Layout tuned on 1290×2796, scaled to 1284×2778 */
const LAYOUT_BASE_W = 1290;
const LAYOUT_BASE_H = 2796;
const scaleW = (n: number) => Math.round(n * (ASPECT_W / LAYOUT_BASE_W));
const scaleH = (n: number) => Math.round(n * (ASPECT_H / LAYOUT_BASE_H));

/** Logical app width inside device screen (matches mobile layout). */
export const DEVICE_LOGICAL_W = 390;

/** Enlarge mockup so in-app UI is clear; fits 1284×2778 headline layout. */
export const PHONE_MOCKUP_SCALE = 1.07;

const BASE_PHONE_SCREEN_W = 612;
const BASE_PHONE_SCREEN_H = 1328;
const BASE_PHONE_BEZEL = 44;

/** Visible screen area inside mockup frame (px at export resolution). */
export const PHONE_SCREEN_W = Math.round(BASE_PHONE_SCREEN_W * PHONE_MOCKUP_SCALE);
export const PHONE_SCREEN_H = Math.round(BASE_PHONE_SCREEN_H * PHONE_MOCKUP_SCALE);
export const PHONE_BEZEL = Math.round(BASE_PHONE_BEZEL * PHONE_MOCKUP_SCALE);
export const PHONE_FRAME_RADIUS = Math.round(56 * PHONE_MOCKUP_SCALE);
export const PHONE_SCREEN_RADIUS = Math.round(44 * PHONE_MOCKUP_SCALE);
export const SCREEN_SCALE = PHONE_SCREEN_W / DEVICE_LOGICAL_W;

/** Vertical offset for phone block below headline area */
export const PHONE_MOCKUP_TOP = scaleH(508);

export const HEADER_PT = scaleH(118);
export const HEADER_PX = scaleW(72);
export const HEADLINE_FONT_PX = scaleH(68);
export const SUBTITLE_FONT_PX = scaleH(34);
export const BRAND_FONT_PX = scaleH(26);

export const BRAND_GRADIENT =
  'linear-gradient(165deg, #fdba74 0%, #fb923c 18%, #f97316 42%, #ea580c 72%, #c2410c 100%)';

/** CJK-friendly stack for mock screens and export (html2canvas). */
export const APP_STORE_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Segoe UI", sans-serif';

export const NOTO_SANS_TC_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap';

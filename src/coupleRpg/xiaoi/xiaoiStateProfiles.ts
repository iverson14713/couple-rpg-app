import type { XiaoiState, XiaoiStateProfile } from './types';

const HERO_SHADOW = 'drop-shadow(0 6px 14px rgba(190, 24, 93, 0.16))';

export const XIAOI_STATE_PROFILES: Record<XiaoiState, XiaoiStateProfile> = {
  happy: {
    state: 'happy',
    displayName: '今天好幸福',
    message: '今天好幸福 💕',
    detailMessage: '互動完成，小愛超開心 💕',
    widgetMessage: '今天好幸福 💕',
    imageName: 'xiaoi_happy',
    widgetImageName: 'xiaoi_widget_happy',
    animationClass: 'lq-xiaoi-pet--happy',
    shadowStyle: HERO_SHADOW,
    mainColor: '#f472b6',
    emotionalTone: 'joyful',
    heroLayout: { scale: 1.18, offsetX: 22, offsetY: -28 },
  },
  sad: {
    state: 'sad',
    displayName: '小愛在等你',
    message: '我在等你們說說話…🥺',
    detailMessage: '今天還沒互動，別冷落對方 🥺',
    widgetMessage: '今天還沒互動 🥺',
    imageName: 'xiaoi_sad',
    widgetImageName: 'xiaoi_widget_sad',
    animationClass: 'lq-xiaoi-pet--sad',
    shadowStyle: HERO_SHADOW,
    mainColor: '#c084a8',
    emotionalTone: 'lonely',
    heroLayout: { scale: 1.18, offsetX: 22, offsetY: -18 },
  },
  sleepy: {
    state: 'sleepy',
    displayName: '小愛睡著了',
    message: '晚安，明天也要好好愛對方',
    detailMessage: '明天也要好好愛對方',
    widgetMessage: '明天也要愛對方',
    imageName: 'xiaoi_sleepy',
    widgetImageName: 'xiaoi_widget_sleepy',
    animationClass: 'lq-xiaoi-pet--sleepy',
    shadowStyle: HERO_SHADOW,
    mainColor: '#a78bfa',
    emotionalTone: 'calm',
    heroLayout: { scale: 1.18, offsetX: 22, offsetY: -20 },
  },
  back_angry: {
    state: 'back_angry',
    displayName: '小愛鬧脾氣了',
    message: '快把我們的愛哄回來',
    detailMessage: '快把我們的愛哄回來',
    widgetMessage: '快把愛哄回來',
    imageName: 'xiaoi_back_angry',
    widgetImageName: 'xiaoi_widget_back_angry',
    animationClass: 'lq-xiaoi-pet--angry',
    shadowStyle: HERO_SHADOW,
    mainColor: '#e11d48',
    emotionalTone: 'upset',
    heroLayout: { scale: 1.18, offsetX: 22, offsetY: -8 },
  },
};

/** `back_angry` 情境文案：未登入 */
export const XIAOI_BACK_ANGRY_MESSAGE_LOGGED_OUT = '登入後讓小愛陪你們互動';

/** `back_angry` 情境文案：未綁定另一半 */
export const XIAOI_BACK_ANGRY_MESSAGE_UNBOUND = '綁定另一半，喚醒你們的小愛';

export function getXiaoiStateProfile(state: XiaoiState): XiaoiStateProfile {
  return XIAOI_STATE_PROFILES[state];
}

export function buildXiaoiHeroMessages(): Record<XiaoiState, string> {
  return {
    happy: XIAOI_STATE_PROFILES.happy.message,
    sad: XIAOI_STATE_PROFILES.sad.message,
    sleepy: XIAOI_STATE_PROFILES.sleepy.message,
    back_angry: XIAOI_STATE_PROFILES.back_angry.message,
  };
}

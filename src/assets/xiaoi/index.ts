import xiaoiBackAngry from './xiaoi_back_angry.png';
import xiaoiHappy from './xiaoi_happy.png';
import xiaoiPromo from './xiaoi_promo.png';
import xiaoiSad from './xiaoi_sad.png';
import xiaoiSleepy from './xiaoi_sleepy.png';

export const XIAOI_IMAGES = {
  xiaoi_happy: xiaoiHappy,
  xiaoi_sad: xiaoiSad,
  xiaoi_sleepy: xiaoiSleepy,
  xiaoi_back_angry: xiaoiBackAngry,
  xiaoi_promo: xiaoiPromo,
} as const;

export type XiaoiImageName = keyof typeof XIAOI_IMAGES;

export function resolveXiaoiImage(imageName: string): string {
  const key = imageName.replace(/\.png$/i, '');
  if (key in XIAOI_IMAGES) {
    return XIAOI_IMAGES[key as XiaoiImageName];
  }
  return XIAOI_IMAGES.xiaoi_happy;
}

import type { XiaoiState } from './xiaoiState';
import { isDevModeFeatureEnabled, readDevXiaoiStateOverride } from './devModeOverride';

export const XIAOI_DEV_PREVIEW: Record<
  XiaoiState,
  { imageName: string; title: string }
> = {
  happy: { imageName: 'xiaoi_happy', title: '今天好幸福' },
  sad: { imageName: 'xiaoi_sad', title: '小愛在等你' },
  sleepy: { imageName: 'xiaoi_sleepy', title: '小愛睡著了' },
  back_angry: { imageName: 'xiaoi_back_angry', title: '小愛鬧脾氣了' },
};

export type HeroXiaoiDisplay = {
  state: XiaoiState;
  imageName: string;
  title: string;
};

/** 首頁 Hero 小愛顯示：dev 覆寫僅影響 UI，devRevision 用於觸發重算 */
export function resolveHeroXiaoiDisplay(
  real: HeroXiaoiDisplay,
  devRevision: number
): HeroXiaoiDisplay {
  void devRevision;
  if (!isDevModeFeatureEnabled()) return real;
  const override = readDevXiaoiStateOverride();
  if (!override) return real;
  return {
    state: override,
    ...XIAOI_DEV_PREVIEW[override],
  };
}

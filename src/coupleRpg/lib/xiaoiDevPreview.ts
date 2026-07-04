import { getXiaoiStateProfile } from '../xiaoi/xiaoiStateProfiles';
import type { XiaoiState } from './xiaoiState';
import { isDevModeFeatureEnabled, readDevXiaoiStateOverride } from './devModeOverride';

export type HeroXiaoiDisplay = {
  state: XiaoiState;
  imageName: string;
  title: string;
};

function heroDisplayFromProfile(state: XiaoiState): HeroXiaoiDisplay {
  const profile = getXiaoiStateProfile(state);
  return {
    state: profile.state,
    imageName: profile.imageName,
    title: profile.displayName,
  };
}

/** 首頁 Hero 小愛顯示：dev 覆寫僅影響 UI，devRevision 用於觸發重算 */
export function resolveHeroXiaoiDisplay(
  real: HeroXiaoiDisplay,
  devRevision: number
): HeroXiaoiDisplay {
  void devRevision;
  if (!isDevModeFeatureEnabled()) return real;
  const override = readDevXiaoiStateOverride();
  if (!override) return real;
  return heroDisplayFromProfile(override);
}

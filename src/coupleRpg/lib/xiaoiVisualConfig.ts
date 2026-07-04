import { XIAOI_STATE_PROFILES } from '../xiaoi/xiaoiStateProfiles';
import type { XiaoiState } from './xiaoiState';

export type XiaoiVisualConfig = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

/** Hero 卡右側小愛：固定舞台內僅允許 scale / offset 微調（來源：xiaoiStateProfiles.heroLayout） */
export const XIAOI_VISUAL_CONFIG: Record<XiaoiState, XiaoiVisualConfig> = {
  happy: XIAOI_STATE_PROFILES.happy.heroLayout,
  sad: XIAOI_STATE_PROFILES.sad.heroLayout,
  sleepy: XIAOI_STATE_PROFILES.sleepy.heroLayout,
  back_angry: XIAOI_STATE_PROFILES.back_angry.heroLayout,
};

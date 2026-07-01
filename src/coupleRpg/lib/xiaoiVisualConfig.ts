import type { XiaoiState } from './xiaoiState';

export type XiaoiVisualConfig = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

/** Hero 卡右側小愛：固定舞台內僅允許 scale / offset 微調 */
export const XIAOI_VISUAL_CONFIG: Record<XiaoiState, XiaoiVisualConfig> = {
  happy: { scale: 1.18, offsetX: 22, offsetY: -28 },
  sad: { scale: 1.18, offsetX: 22, offsetY: -18 },
  sleepy: { scale: 1.18, offsetX: 22, offsetY: -20 },
  back_angry: { scale: 1.18, offsetX: 22, offsetY: -8 },
};

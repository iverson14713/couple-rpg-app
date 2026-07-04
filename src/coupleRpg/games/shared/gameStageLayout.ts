import type {
  GameStageBounds,
  GameStageCoord,
  GameStageSizeConfig,
  LabelClampOptions,
} from './gameLayoutTypes';

export const GAME_STAGE_LAYOUT = {
  COMPACT_VIEWPORT: 400,
  PAD_DEFAULT: 32,
  PAD_COMPACT: 24,
  MAX_DEFAULT: 340,
  MAX_COMPACT: 320,
  MIN_SIZE: 200,
  LABEL_PAD: 10,
  LABEL_OFFSET: 18,
} as const;

/** 愛情危機：大舞台，以視窗寬度計算 */
export const LOVE_CRISIS_STAGE_SIZE: GameStageSizeConfig = {
  measureSource: 'viewport',
  viewportPad: 32,
  maxDefault: 360,
  maxCompact: 360,
  minSize: 300,
  compactViewport: 400,
};

/** 依可用寬度計算正方形舞台邊長 */
export function computeGameStageSize(
  viewportWidth: number,
  config: GameStageSizeConfig = {}
): number {
  if (config.measureSource === 'viewport') {
    const pad = config.viewportPad ?? 32;
    const max = config.maxDefault ?? 360;
    const fitted = Math.min(viewportWidth - pad, max);
    const min = config.minSize ?? GAME_STAGE_LAYOUT.MIN_SIZE;
    return Math.max(fitted, Math.min(min, viewportWidth - pad));
  }

  const compactVp = config.compactViewport ?? GAME_STAGE_LAYOUT.COMPACT_VIEWPORT;
  const compact = viewportWidth < compactVp;
  const pad = compact
    ? (config.padCompact ?? GAME_STAGE_LAYOUT.PAD_COMPACT)
    : (config.padDefault ?? GAME_STAGE_LAYOUT.PAD_DEFAULT);
  const max = compact
    ? (config.maxCompact ?? GAME_STAGE_LAYOUT.MAX_COMPACT)
    : (config.maxDefault ?? GAME_STAGE_LAYOUT.MAX_DEFAULT);
  const min = config.minSize ?? GAME_STAGE_LAYOUT.MIN_SIZE;
  const fitted = Math.min(viewportWidth - pad, max);
  return Math.max(fitted, Math.min(min, viewportWidth - pad));
}

export function readViewportWidth(): number {
  if (typeof window === 'undefined') return 390;
  return window.visualViewport?.width ?? window.innerWidth;
}

export function computeGameStageCoord(size: number): GameStageCoord {
  const labelPadding = GAME_STAGE_LAYOUT.LABEL_PAD;
  const center = size / 2;

  return {
    size,
    centerX: center,
    centerY: center,
    labelPadding,
    bounds: {
      left: labelPadding,
      top: labelPadding,
      right: size - labelPadding,
      bottom: size - labelPadding,
    },
  };
}

export function lineEndpoint(
  centerX: number,
  centerY: number,
  angleDeg: number,
  length: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: centerX + Math.cos(rad) * length,
    y: centerY + Math.sin(rad) * length,
  };
}

export function clampLabelInStage(
  x: number,
  y: number,
  bounds: GameStageBounds,
  options: LabelClampOptions = {}
): { x: number; y: number } {
  const halfW = (options.estWidth ?? 76) / 2;
  const halfH = (options.estHeight ?? 20) / 2;

  return {
    x: Math.min(Math.max(x, bounds.left + halfW), bounds.right - halfW),
    y: Math.min(Math.max(y, bounds.top + halfH), bounds.bottom - halfH),
  };
}

/** 沿線方向外推後 clamp，避免 label 超出 stage */
export function labelAnchorAlongAngle(
  coord: GameStageCoord,
  angleDeg: number,
  lineLength: number,
  options: LabelClampOptions = {}
): { x: number; y: number } {
  const end = lineEndpoint(coord.centerX, coord.centerY, angleDeg, lineLength);
  const rad = (angleDeg * Math.PI) / 180;
  const rawX = end.x + Math.cos(rad) * GAME_STAGE_LAYOUT.LABEL_OFFSET;
  const rawY = end.y + Math.sin(rad) * GAME_STAGE_LAYOUT.LABEL_OFFSET;
  return clampLabelInStage(rawX, rawY, coord.bounds, options);
}

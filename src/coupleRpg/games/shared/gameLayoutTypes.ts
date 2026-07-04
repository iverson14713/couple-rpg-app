import type { ReactNode } from 'react';

/** Stage 內可放置區域（px，原點左上） */
export type GameStageBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/** GameStage 座標系（數學角度：0°=右、-90°=上、y 向下） */
export type GameStageCoord = {
  size: number;
  centerX: number;
  centerY: number;
  bounds: GameStageBounds;
  labelPadding: number;
};

export type GameMascotState = 'happy' | 'sad' | 'nervous' | 'celebrate' | 'sleepy';

export type GameMascotPlacement = 'bottom-left' | 'bottom-right';

export type GameInstructionChip = {
  id: string;
  label: string;
  tone?: 'default' | 'active' | 'done' | 'hold' | 'double';
};

export type LabelClampOptions = {
  estWidth?: number;
  estHeight?: number;
};

export type GamePageShellProps = {
  immersive?: boolean;
  backButton?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  result?: ReactNode;
  className?: string;
};

export type GameHudProps = {
  timerLabel: string;
  scoreLabel: string;
  progressPercent: number;
  statusText?: string;
  urgent?: boolean;
  /** 進度條在 timer 列下方（預設）或上方 */
  barPosition?: 'above' | 'below';
  className?: string;
};

export type GameInstructionCardProps = {
  hint: string;
  chips?: GameInstructionChip[];
  lines?: 1 | 2;
  className?: string;
};

export type GameStoryTextProps = {
  children: string;
  className?: string;
};

export type GameStageSizeConfig = {
  padDefault?: number;
  padCompact?: number;
  maxDefault?: number;
  maxCompact?: number;
  minSize?: number;
  compactViewport?: number;
  /** 以視窗寬度計算（避免被 max-width 父層壓縮） */
  measureSource?: 'container' | 'viewport';
  /** measureSource=viewport 時，左右 padding 總和（預設 32 = 16+16） */
  viewportPad?: number;
};

export type GameStageRenderProps = {
  coord: GameStageCoord;
};

export type GameStageProps = {
  className?: string;
  stageClassName?: string;
  sizeConfig?: GameStageSizeConfig;
  children: (props: GameStageRenderProps) => ReactNode;
};

export type GameMascotBubbleProps = {
  state: GameMascotState;
  message: string;
  placement?: GameMascotPlacement;
  /** bottom-left 時 bubble 在小愛右上方 */
  bubbleLayout?: 'beside' | 'above-right';
  jump?: boolean;
};

export type GameResultCardProps = {
  open: boolean;
  gameLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  stats?: ReactNode;
  quote?: string;
  children?: ReactNode;
  onShare?: () => void;
  sharing?: boolean;
  shareDisabled?: boolean;
  onPlayAgain: () => void;
  onBackToList: () => void;
  playAgainLabel?: string;
  backLabel?: string;
  shareLabel?: string;
};

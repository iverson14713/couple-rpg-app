export type {
  GameHudProps,
  GameInstructionCardProps,
  GameInstructionChip,
  GameMascotBubbleProps,
  GameMascotPlacement,
  GameMascotState,
  GamePageShellProps,
  GameResultCardProps,
  GameStageBounds,
  GameStageCoord,
  GameStageProps,
  GameStageRenderProps,
  GameStageSizeConfig,
  GameStoryTextProps,
  LabelClampOptions,
} from './gameLayoutTypes';

export {
  clampLabelInStage,
  computeGameStageCoord,
  computeGameStageSize,
  GAME_STAGE_LAYOUT,
  labelAnchorAlongAngle,
  lineEndpoint,
  LOVE_CRISIS_STAGE_SIZE,
  readViewportWidth,
} from './gameStageLayout';

export { GamePageBackButton, GamePageHeader, GamePageShell, GamePageShellContent } from './GamePageShell';
export { GameHud } from './GameHud';
export { GameInstructionCard } from './GameInstructionCard';
export { GameStoryText } from './GameStoryText';
export { GameStage, GameStageSurface, useGameStage } from './GameStage';
export { GameMascotBubble } from './GameMascotBubble';
export { GameResultCard } from './GameResultCard';
export { GameStageDemoContent } from './GameStageDemo';
export { GameDesignSystemPreview } from './GameDesignSystemPreview';

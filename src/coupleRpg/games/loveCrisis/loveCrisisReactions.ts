import { emotionTask } from './loveCrisisEmotions';
import type { EmotionType } from './loveCrisisTypes';

export const REACTION_STEP_OK = '好棒，愛心修回來一點了！';
export const REACTION_STEP_PROGRESS = '修復 +1 步';
export const REACTION_FAIL = '這顆碎掉了…下一顆再努力';
export const REACTION_SUCCESS = '修好了！你們好溫柔 💕';
export const REACTION_URGENT = '快！愛心快撑不住了！';
export const REACTION_DOUBLE_HINT = '連點 2 次完成默契！';
export const REACTION_HOLD_HINT = '按住 0.6 秒安撫…';

export function reactionForNextStep(emotion: EmotionType, interaction: 'tap' | 'hold' | 'double'): string {
  const task = emotionTask(emotion);
  if (interaction === 'hold') return REACTION_HOLD_HINT;
  if (interaction === 'double') return REACTION_DOUBLE_HINT;
  if (emotion === 'listen') return '先聽聽對方怎麼說…';
  if (emotion === 'comfort') return '給對方一點溫柔…';
  if (emotion === 'calm') return '先深呼吸，別急…';
  return `${task}…`;
}

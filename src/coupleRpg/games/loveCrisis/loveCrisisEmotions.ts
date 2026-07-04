import type { EmotionType, LineInteractionType } from './loveCrisisTypes';

export type EmotionMeta = {
  type: EmotionType;
  label: string;
  task: string;
  color: string;
  chipClass: string;
  lineClass: string;
};

export const EMOTION_META: Record<EmotionType, EmotionMeta> = {
  comfort: {
    type: 'comfort',
    label: '安慰',
    task: '抱抱對方',
    color: '#f472b6',
    chipClass: 'lq-love-crisis-chip--comfort',
    lineClass: 'lq-love-crisis-line--comfort',
  },
  listen: {
    type: 'listen',
    label: '傾聽',
    task: '聽完再說',
    color: '#c4b5fd',
    chipClass: 'lq-love-crisis-chip--listen',
    lineClass: 'lq-love-crisis-line--listen',
  },
  affirm: {
    type: 'affirm',
    label: '肯定',
    task: '說一句辛苦了',
    color: '#fbbf24',
    chipClass: 'lq-love-crisis-chip--affirm',
    lineClass: 'lq-love-crisis-line--affirm',
  },
  calm: {
    type: 'calm',
    label: '冷靜',
    task: '先深呼吸',
    color: '#93c5fd',
    chipClass: 'lq-love-crisis-chip--calm',
    lineClass: 'lq-love-crisis-line--calm',
  },
  action: {
    type: 'action',
    label: '行動',
    task: '做一件小事',
    color: '#fb923c',
    chipClass: 'lq-love-crisis-chip--action',
    lineClass: 'lq-love-crisis-line--action',
  },
};

export const INTERACTION_BADGE: Record<LineInteractionType, string | null> = {
  tap: null,
  hold: '長按',
  double: '雙點',
};

export const INTERACTION_HINT: Record<LineInteractionType, string | null> = {
  tap: null,
  hold: '按住 0.6 秒安撫',
  double: '連點 2 次完成默契',
};

export function chipLabel(task: string, interaction: LineInteractionType): string {
  if (interaction === 'hold') return `${task}（長按）`;
  if (interaction === 'double') return `${task}（雙點）`;
  return task;
}

export function emotionTask(type: EmotionType): string {
  return EMOTION_META[type].task;
}

export function buildHintSequenceText(
  lines: { emotion: EmotionType; interaction: LineInteractionType }[]
): string {
  return lines
    .map((line) => chipLabel(EMOTION_META[line.emotion].task, line.interaction))
    .join(' → ');
}

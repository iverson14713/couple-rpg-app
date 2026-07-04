export const LOVE_CRISIS_DURATION_MS = 30_000;

export type EmotionType = 'comfort' | 'listen' | 'affirm' | 'calm' | 'action';

export type LineInteractionType = 'tap' | 'hold' | 'double';

export type LoveCrisisScreenPhase =
  | 'intro'
  | 'tutorial'
  | 'countdown'
  | 'playing'
  | 'ended';

export type HeartVisualState = 'active' | 'breaking' | 'repaired';

export type XiaoiMood = 'nervous' | 'happy' | 'sad' | 'panic' | 'celebrate' | 'holding';

export type FeedbackKind = 'step' | 'fail' | 'success' | null;

export type HeartLine = {
  id: string;
  emotion: EmotionType;
  angle: number;
  orderIndex: number;
  interaction: LineInteractionType;
  cut: boolean;
};

export type HeartPuzzle = {
  id: string;
  story: string;
  sequence: EmotionType[];
  lines: HeartLine[];
};

export type LoveCrisisGameResult = {
  successCount: number;
  failCount: number;
  maxStreak: number;
  syncScore: number;
  verdict: string;
  tagline: string;
};

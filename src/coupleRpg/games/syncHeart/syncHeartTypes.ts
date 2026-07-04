export const SYNC_HEART_TOTAL_ROUNDS = 5;

export const SYNC_HEART_WAIT_MIN_MS = 2000;
export const SYNC_HEART_WAIT_MAX_MS = 5000;

export type SyncHeartGamePhase =
  | 'waiting'
  | 'go'
  | 'round_end'
  | 'ended';

export type SyncHeartRoundResult = {
  round: number;
  failed: boolean;
  failReason?: 'early_press';
  earlyPlayerIndex?: 0 | 1;
  playerATimeSec: number | null;
  playerBTimeSec: number | null;
  diffSeconds: number | null;
  ratingLabel: string | null;
  ratingEmoji: string | null;
};

export type SyncHeartGameResult = {
  score: number;
  averageDiffSeconds: number | null;
  bestDiffSeconds: number | null;
  failCount: number;
  validRoundCount: number;
  verdict: string;
  allFailed: boolean;
};

import type { SyncHeartGameResult, SyncHeartRoundResult } from './syncHeartTypes';

export type SyncHeartRating = {
  emoji: string;
  label: string;
};

export function getRoundRating(diffSeconds: number): SyncHeartRating {
  if (diffSeconds <= 0.05) return { emoji: '💘', label: '心電感應' };
  if (diffSeconds <= 0.1) return { emoji: '💕', label: '心有靈犀' };
  if (diffSeconds <= 0.25) return { emoji: '🥰', label: '默契不錯' };
  if (diffSeconds <= 0.5) return { emoji: '😊', label: '再靠近一點' };
  return { emoji: '🤣', label: '各玩各的' };
}

export function computeSyncHeartScore(averageDiffSeconds: number): number {
  return Math.max(0, Math.round(100 - averageDiffSeconds * 120));
}

export function getFinalVerdict(score: number, allFailed: boolean): string {
  if (allFailed) return '今天有點太急了，再試一次吧 ❤️';
  if (score >= 95) return '你們根本心電感應 💘';
  if (score >= 85) return '默契甜到冒泡 💕';
  if (score >= 70) return '很不錯，再挑戰更同步 🥰';
  if (score >= 50) return '差一點點，再玩一局 😊';
  return '今天有點各玩各的 😂';
}

export function computeGameResult(roundResults: SyncHeartRoundResult[]): SyncHeartGameResult {
  const failCount = roundResults.filter((r) => r.failed).length;
  const valid = roundResults.filter((r) => !r.failed && r.diffSeconds != null);
  const allFailed = roundResults.length > 0 && valid.length === 0;

  if (valid.length === 0) {
    return {
      score: 0,
      averageDiffSeconds: null,
      bestDiffSeconds: null,
      failCount,
      validRoundCount: 0,
      verdict: getFinalVerdict(0, allFailed),
      allFailed,
    };
  }

  const diffs = valid.map((r) => r.diffSeconds!);
  const averageDiffSeconds = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
  const bestDiffSeconds = Math.min(...diffs);
  const score = computeSyncHeartScore(averageDiffSeconds);

  return {
    score,
    averageDiffSeconds,
    bestDiffSeconds,
    failCount,
    validRoundCount: valid.length,
    verdict: getFinalVerdict(score, false),
    allFailed: false,
  };
}

export function formatSyncTime(seconds: number): string {
  return `${seconds.toFixed(3)} 秒`;
}

export function randomWaitMs(minMs: number, maxMs: number): number {
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

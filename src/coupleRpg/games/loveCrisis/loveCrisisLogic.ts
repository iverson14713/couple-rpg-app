import type { LoveCrisisGameResult } from './loveCrisisTypes';

export function computeSyncScore(
  successCount: number,
  maxStreak: number,
  failCount: number
): number {
  const raw = successCount * 10 + maxStreak * 5 - failCount * 3;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function getLoveCrisisVerdict(score: number, successCount: number): string {
  if (successCount === 0) return '愛需要練習，你們願意一起試就很好 ❤️';
  if (score >= 90) return '你們是彼此的急救小隊 💘';
  if (score >= 70) return '裂痕被你們溫柔接住了 💕';
  if (score >= 50) return '有在努力靠近，再一局會更順 🥰';
  if (score >= 30) return '今天有點手忙腳亂，但沒關係 😊';
  return '愛需要練習，你們願意一起試就很好 ❤️';
}

export function getLoveCrisisTagline(score: number, successCount: number): string {
  if (successCount === 0) return '下一局，一起把愛修回來';
  if (score >= 70) return '真正的默契，是一起把愛修回來';
  return '你們一起把裂痕接住了';
}

export function buildGameResult(
  successCount: number,
  failCount: number,
  maxStreak: number
): LoveCrisisGameResult {
  const syncScore = computeSyncScore(successCount, maxStreak, failCount);
  return {
    successCount,
    failCount,
    maxStreak,
    syncScore,
    verdict: getLoveCrisisVerdict(syncScore, successCount),
    tagline: getLoveCrisisTagline(syncScore, successCount),
  };
}

export const LOVE_CRISIS_UPGRADE_HINT =
  '愛情危機是 Pro 專屬情侶合作遊戲。升級後和另一半一起修復快碎掉的愛心，挑戰你們的默契與溫柔。';

export const LOVE_CRISIS_TUTORIAL_KEY = 'lq-love-crisis-tutorial-v1';

export function hasSeenLoveCrisisTutorial(): boolean {
  try {
    return localStorage.getItem(LOVE_CRISIS_TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

export function markLoveCrisisTutorialSeen(): void {
  try {
    localStorage.setItem(LOVE_CRISIS_TUTORIAL_KEY, '1');
  } catch {
    /* ignore */
  }
}

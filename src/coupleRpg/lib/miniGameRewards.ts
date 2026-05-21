/** 情侶小遊戲每日獎勵上限（依 Free / Pro 方案） */
export const MINI_GAME_DAILY_REWARD_CAP_FREE = 3;
export const MINI_GAME_DAILY_REWARD_CAP_PRO = 10;

export function getMiniGameDailyRewardCap(isPro: boolean): number {
  return isPro ? MINI_GAME_DAILY_REWARD_CAP_PRO : MINI_GAME_DAILY_REWARD_CAP_FREE;
}

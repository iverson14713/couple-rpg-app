/** Free：每日最多幾項家事可領 LoveCoin / EXP / 默契 */
export const FREE_DAILY_CHORE_REWARD_LIMIT = 5;

/** Pro：每日最多幾項家事可領獎勵 */
export const PRO_DAILY_CHORE_REWARD_LIMIT = 10;

export function dailyChoreRewardLimit(isPro: boolean): number {
  return isPro ? PRO_DAILY_CHORE_REWARD_LIMIT : FREE_DAILY_CHORE_REWARD_LIMIT;
}

/** 完成單項家事且成功發獎時的 UI 提示 */
export const HOUSEWORK_CHORE_REWARD_GRANTED_HINT = '獲得 🪙 +3、✨ +10、🤝 +3';

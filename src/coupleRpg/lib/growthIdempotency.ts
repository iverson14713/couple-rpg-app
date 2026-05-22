export {
  choreCoinKey,
  dateCompleteCoinKey,
  flirtGameCoinKey,
  fallbackEarnCoinKey,
  miniGameCoinKey,
  redeemCoinKey,
  taskCoinKey,
} from './coinIdempotency';

import { localMigrationCoinKey } from './coinIdempotency';

export function localMigrationGrowthKey(userId: string, coupleId: string): string {
  return localMigrationCoinKey(userId, coupleId);
}

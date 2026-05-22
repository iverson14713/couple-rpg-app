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

export function localMigrationGrowthKey(coupleId: string): string {
  return localMigrationCoinKey(coupleId);
}

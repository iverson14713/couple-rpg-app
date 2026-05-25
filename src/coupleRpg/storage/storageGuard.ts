import { getActiveStorageUserId } from './storageSession';

export function canUseUserStorage(expectedUserId: string | null | undefined): boolean {
  if (!expectedUserId) return false;
  const active = getActiveStorageUserId();
  if (active !== expectedUserId) {
    console.warn('[storage-guard] blocked: userId mismatch', { active, expectedUserId });
    return false;
  }
  return true;
}

export function assertStorageUserMatch(expectedUserId: string | null | undefined): boolean {
  return canUseUserStorage(expectedUserId);
}

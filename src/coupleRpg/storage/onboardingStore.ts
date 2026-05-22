import { safeGetItem, safeRemoveItem, safeSetItem } from '../../safeStorage';

/** 使用者指定 key：看過新手導覽後設為 true */
export const ONBOARDING_DONE_KEY = 'lovequest_onboarding_done';

export function isOnboardingDone(): boolean {
  return safeGetItem(ONBOARDING_DONE_KEY) === '1';
}

export function markOnboardingDone(): void {
  safeSetItem(ONBOARDING_DONE_KEY, '1');
}

export function clearOnboardingDone(): void {
  safeRemoveItem(ONBOARDING_DONE_KEY);
}

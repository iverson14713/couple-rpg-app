import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export type UserPlan = 'free' | 'pro';

const DEFAULT_PLAN: UserPlan = 'free';

export function loadUserPlan(): UserPlan {
  const raw = loadJson<string>(LQ_KEYS.userPlan, DEFAULT_PLAN);
  return raw === 'pro' ? 'pro' : 'free';
}

/** 讀取目前方案（與 loadUserPlan 相同） */
export function getUserPlan(): UserPlan {
  return loadUserPlan();
}

export function saveUserPlan(plan: UserPlan): void {
  saveJson(LQ_KEYS.userPlan, plan);
}

/** 寫入方案（與 saveUserPlan 相同） */
export function setUserPlan(plan: UserPlan): void {
  saveUserPlan(plan);
}

export function isProUser(plan: UserPlan = loadUserPlan()): boolean {
  return plan === 'pro';
}

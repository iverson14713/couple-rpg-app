import { dateKeyFromIso, todayKey } from '../lib/dates';
import { FREE_COMPANIONSHIP_DAILY_SEND_LIMIT } from '../lib/companionshipEntitlement';
import { buildRewardScopeKey } from './dailyRewardLedgerStore';
import { loadCompanionshipEvents } from './companionshipStore';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import { canUseUserStorage } from './storageGuard';

const QUOTA_VERSION = 1;

type CompanionshipQuotaScope = {
  days: Record<string, number>;
};

type CompanionshipQuotaData = {
  version: number;
  scopes: Record<string, CompanionshipQuotaScope>;
};

function loadQuota(): CompanionshipQuotaData {
  const raw = loadJson<CompanionshipQuotaData | null>(LQ_KEYS.companionshipSendQuota, null);
  if (!raw || raw.version !== QUOTA_VERSION || !raw.scopes) {
    return { version: QUOTA_VERSION, scopes: {} };
  }
  return raw;
}

function saveQuota(data: CompanionshipQuotaData): void {
  saveJson(LQ_KEYS.companionshipSendQuota, data);
}

function getScope(
  data: CompanionshipQuotaData,
  userId: string,
  coupleId: string
): CompanionshipQuotaScope {
  const key = buildRewardScopeKey(userId, coupleId);
  if (!data.scopes[key]) {
    data.scopes[key] = { days: {} };
  }
  return data.scopes[key]!;
}

export function getCompanionshipSendsToday(
  userId: string | null,
  coupleId: string | null,
  refDate = new Date()
): number {
  if (!userId || !coupleId || !canUseUserStorage(userId)) return 0;
  const data = loadQuota();
  const scope = getScope(data, userId, coupleId);
  const day = todayKey(refDate);
  const fromQuota = scope.days[day] ?? 0;
  const fromEvents = loadCompanionshipEvents().filter(
    (e) => e.senderUserId === userId && dateKeyFromIso(e.createdAt) === day
  ).length;
  return Math.max(fromQuota, fromEvents);
}

export function getCompanionshipSendsRemaining(
  userId: string | null,
  coupleId: string | null,
  isPro: boolean,
  refDate = new Date()
): number | null {
  if (isPro || !userId || !coupleId) return null;
  const sent = getCompanionshipSendsToday(userId, coupleId, refDate);
  return Math.max(0, FREE_COMPANIONSHIP_DAILY_SEND_LIMIT - sent);
}

/** 成功送出後記錄一次；回傳今日已送次數 */
export function recordCompanionshipSendQuota(
  userId: string,
  coupleId: string,
  refDate = new Date()
): number {
  if (!canUseUserStorage(userId)) return 0;
  const data = loadQuota();
  const scope = getScope(data, userId, coupleId);
  const day = todayKey(refDate);
  const next = (scope.days[day] ?? 0) + 1;
  scope.days[day] = next;
  saveQuota(data);
  return next;
}

/** 同步失敗等情境回滾一次 */
export function rollbackCompanionshipSendQuota(
  userId: string,
  coupleId: string,
  refDate = new Date()
): number {
  if (!canUseUserStorage(userId)) return 0;
  const data = loadQuota();
  const scope = getScope(data, userId, coupleId);
  const day = todayKey(refDate);
  const current = scope.days[day] ?? 0;
  const next = Math.max(0, current - 1);
  if (next === 0) {
    delete scope.days[day];
  } else {
    scope.days[day] = next;
  }
  saveQuota(data);
  return next;
}

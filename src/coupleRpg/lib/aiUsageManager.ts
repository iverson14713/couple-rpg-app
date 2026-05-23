import type { AiPlanTier } from './aiUsageLimits';
import {
  buildAiQuotaSnapshot,
  mergeQuotaFromApiFields,
  type AiQuotaSnapshot,
} from '../services/aiUsageService';

export type AiQuotaApiFields = {
  dailyUsed?: number;
  dailyLimit?: number;
  dailyRemaining?: number;
  planEffective?: string;
};

/** Remaining calls from a synced snapshot (server-backed). */
export function getRemainingAiQuota(snapshot: AiQuotaSnapshot): number {
  return snapshot.remaining;
}

export function applyAiQuotaApiFields(
  snapshot: AiQuotaSnapshot,
  fields: AiQuotaApiFields
): AiQuotaSnapshot {
  return mergeQuotaFromApiFields(snapshot, fields);
}

export function buildQuotaFromApiFields(
  fields: AiQuotaApiFields,
  plan: AiPlanTier,
  usageDate: string
): AiQuotaSnapshot {
  const base = buildAiQuotaSnapshot(0, plan, usageDate);
  return mergeQuotaFromApiFields(base, fields);
}

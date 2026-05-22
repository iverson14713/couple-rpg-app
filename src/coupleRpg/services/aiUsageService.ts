import type { SupabaseClient } from '@supabase/supabase-js';
import {
  capAiUsageUsed,
  getDailyAiLimit,
  type AiPlanTier,
} from '../lib/aiUsageLimits';
import { todayUsageDateYmd } from '../lib/coupleAssistantApi';

export type AiQuotaSnapshot = {
  usageDate: string;
  used: number;
  limit: number;
  remaining: number;
  plan: AiPlanTier;
  planEffective?: AiPlanTier;
};

export async function fetchLoveQuestAiUsageToday(
  supabase: SupabaseClient,
  userId: string,
  usageDate: string = todayUsageDateYmd()
): Promise<number> {
  const { data, error } = await supabase
    .from('lovequest_ai_daily_usage')
    .select('used_count')
    .eq('user_id', userId)
    .eq('usage_date', usageDate)
    .maybeSingle();

  if (error) {
    console.warn('[ai-usage] fetch', error.message);
    return 0;
  }
  const n = Number(data?.used_count);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function buildAiQuotaSnapshot(
  used: number,
  plan: AiPlanTier,
  usageDate: string = todayUsageDateYmd(),
  planEffective?: AiPlanTier
): AiQuotaSnapshot {
  const limit = getDailyAiLimit(plan);
  const capped = capAiUsageUsed(used, limit);
  return {
    usageDate,
    used: capped,
    limit,
    remaining: Math.max(0, limit - capped),
    plan,
    planEffective: planEffective ?? plan,
  };
}

export function mergeQuotaFromApiFields(
  snapshot: AiQuotaSnapshot,
  fields: { dailyUsed?: number; dailyLimit?: number; dailyRemaining?: number; planEffective?: string }
): AiQuotaSnapshot {
  const plan =
    fields.planEffective === 'pro' || fields.planEffective === 'free'
      ? fields.planEffective
      : snapshot.plan;
  const limit =
    fields.dailyLimit != null && Number.isFinite(fields.dailyLimit)
      ? Math.floor(fields.dailyLimit)
      : getDailyAiLimit(plan);
  const used =
    fields.dailyUsed != null && Number.isFinite(fields.dailyUsed)
      ? capAiUsageUsed(fields.dailyUsed, limit)
      : snapshot.used;
  return {
    usageDate: snapshot.usageDate,
    used,
    limit,
    remaining:
      fields.dailyRemaining != null && Number.isFinite(fields.dailyRemaining)
        ? Math.max(0, Math.floor(fields.dailyRemaining))
        : Math.max(0, limit - used),
    plan,
    planEffective: plan,
  };
}

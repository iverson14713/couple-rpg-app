import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { useUserPlan } from '../context/UserPlanContext';
import {
  aiQuotaExhaustedMessage,
  formatAiUsageLine,
  getDailyAiLimit,
  type AiPlanTier,
} from '../lib/aiUsageLimits';
import {
  resolveLoveQuestQuotaUrl,
  todayUsageDateYmd,
  type CoupleAssistantAuth,
} from '../lib/coupleAssistantApi';
import {
  buildAiQuotaSnapshot,
  fetchLoveQuestAiUsageToday,
  mergeQuotaFromApiFields,
  type AiQuotaSnapshot,
} from '../services/aiUsageService';

export type AiUsageGateResult =
  | { ok: true }
  | { ok: false; code: 'AUTH' | 'QUOTA'; message: string };

export function useAiUsage() {
  const auth = useSupabaseAuth();
  const { isPro, openUpgradeModal } = useUserPlan();
  const { space } = useCoupleSpace();

  const plan: AiPlanTier = isPro ? 'pro' : 'free';
  const usageDate = todayUsageDateYmd();
  const userId = auth.user?.id ?? null;
  const isLoggedIn = Boolean(userId && auth.session?.access_token);

  const [quota, setQuota] = useState<AiQuotaSnapshot>(() =>
    buildAiQuotaSnapshot(0, plan, usageDate)
  );
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!auth.supabase || !userId) {
      setQuota(buildAiQuotaSnapshot(0, plan, usageDate));
      return;
    }
    setLoading(true);
    try {
      const used = await fetchLoveQuestAiUsageToday(auth.supabase, userId, usageDate);
      setQuota(buildAiQuotaSnapshot(used, plan, usageDate));
    } finally {
      setLoading(false);
    }
  }, [auth.supabase, userId, plan, usageDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setQuota((prev) => {
      const limit = getDailyAiLimit(plan);
      const used = Math.min(prev.used, limit);
      return {
        ...prev,
        plan,
        limit,
        used,
        remaining: Math.max(0, limit - used),
        planEffective: plan,
      };
    });
  }, [plan]);

  const canUseAi = quota.remaining > 0 && isLoggedIn;
  const canUseAdvancedAi = isPro;

  const usageLine = useMemo(
    () => formatAiUsageLine(quota.used, quota.limit),
    [quota.used, quota.limit]
  );

  const getCoupleAssistantAuth = useCallback((): CoupleAssistantAuth | null => {
    const token = auth.session?.access_token;
    if (!userId || !token) return null;
    return {
      userId,
      accessToken: token,
      coupleId: space?.coupleId ?? null,
    };
  }, [auth.session?.access_token, userId, space?.coupleId]);

  const ensureCanCallAi = useCallback((): AiUsageGateResult => {
    if (!isLoggedIn) {
      return { ok: false, code: 'AUTH', message: '請先登入後再使用 AI' };
    }
    if (quota.remaining <= 0) {
      return {
        ok: false,
        code: 'QUOTA',
        message: aiQuotaExhaustedMessage(isPro),
      };
    }
    return { ok: true };
  }, [isLoggedIn, quota.remaining, isPro]);

  const applyQuotaFromResponse = useCallback(
    (fields: {
      dailyUsed?: number;
      dailyLimit?: number;
      dailyRemaining?: number;
      planEffective?: string;
    }) => {
      setQuota((prev) => mergeQuotaFromApiFields(prev, fields));
    },
    []
  );

  const fetchQuotaFromServer = useCallback(async () => {
    const a = getCoupleAssistantAuth();
    if (!a) return;
    const params = new URLSearchParams({
      usageDate,
      userId: a.userId,
      accessToken: a.accessToken,
    });
    if (a.coupleId) params.set('coupleId', a.coupleId);
    const base = resolveLoveQuestQuotaUrl();
    try {
      const res = await fetch(`${base}?${params.toString()}`);
      const body = (await res.json()) as {
        dailyUsed?: number;
        dailyLimit?: number;
        dailyRemaining?: number;
        planEffective?: string;
      };
      if (res.ok) applyQuotaFromResponse(body);
    } catch {
      // fallback: Supabase select via refresh()
      await refresh();
    }
  }, [getCoupleAssistantAuth, usageDate, applyQuotaFromResponse, refresh]);

  const onQuotaBlocked = useCallback(
    (message?: string) => {
      openUpgradeModal(message ?? aiQuotaExhaustedMessage(isPro));
    },
    [openUpgradeModal, isPro]
  );

  return {
    quota,
    usageLine,
    usageDate,
    plan,
    isPro,
    isLoggedIn,
    loading,
    canUseAi,
    canUseAdvancedAi,
    refresh,
    fetchQuotaFromServer,
    getCoupleAssistantAuth,
    ensureCanCallAi,
    applyQuotaFromResponse,
    onQuotaBlocked,
    quotaExhaustedMessage: aiQuotaExhaustedMessage(isPro),
  };
}

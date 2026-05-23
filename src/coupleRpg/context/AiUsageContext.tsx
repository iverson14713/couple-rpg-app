import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleSpace } from './CoupleSpaceContext';
import { useUserPlan } from './UserPlanContext';
import {
  aiQuotaExhaustedMessage,
  formatAiRemainingLine,
  formatAiUsageLine,
  getDailyAiLimit,
  type AiPlanTier,
} from '../lib/aiUsageLimits';
import {
  applyAiQuotaApiFields,
  getRemainingAiQuota,
  type AiQuotaApiFields,
} from '../lib/aiUsageManager';
import {
  resolveLoveQuestQuotaUrl,
  todayUsageDateYmd,
  type CoupleAssistantAuth,
} from '../lib/coupleAssistantApi';
import {
  buildAiQuotaSnapshot,
  fetchLoveQuestAiUsageToday,
  type AiQuotaSnapshot,
} from '../services/aiUsageService';

export type AiUsageGateResult =
  | { ok: true }
  | { ok: false; code: 'AUTH' | 'QUOTA' | 'BUSY' | 'SYNC'; message: string };

type AiUsageContextValue = {
  quota: AiQuotaSnapshot;
  usageLine: string;
  remainingLine: string;
  usageDate: string;
  plan: AiPlanTier;
  isPro: boolean;
  isLoggedIn: boolean;
  loading: boolean;
  quotaSynced: boolean;
  canUseAi: boolean;
  canUseAdvancedAi: boolean;
  aiCallInFlight: boolean;
  refreshAiQuota: () => Promise<void>;
  fetchQuotaFromServer: () => Promise<void>;
  syncQuotaAfterAiSuccess: (fields: AiQuotaApiFields) => Promise<void>;
  getRemainingAiQuota: () => number;
  getCoupleAssistantAuth: () => CoupleAssistantAuth | null;
  ensureCanCallAi: () => AiUsageGateResult;
  tryBeginAiCall: () => boolean;
  endAiCall: () => void;
  onQuotaBlocked: (message?: string) => void;
  quotaExhaustedMessage: string;
  /** @deprecated use syncQuotaAfterAiSuccess */
  applyQuotaFromResponse: (fields: AiQuotaApiFields) => void;
  refresh: () => Promise<void>;
};

const AiUsageContext = createContext<AiUsageContextValue | null>(null);

export function AiUsageProvider({ children }: { children: ReactNode }) {
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
  const [quotaSynced, setQuotaSynced] = useState(false);
  const [aiCallInFlight, setAiCallInFlight] = useState(false);
  const aiCallLockRef = useRef(false);
  const refreshGenRef = useRef(0);

  const getCoupleAssistantAuth = useCallback((): CoupleAssistantAuth | null => {
    const token = auth.session?.access_token;
    if (!userId || !token) return null;
    return {
      userId,
      accessToken: token,
      coupleId: space?.coupleId ?? null,
    };
  }, [auth.session?.access_token, userId, space?.coupleId]);

  const applyQuotaFromResponse = useCallback((fields: AiQuotaApiFields) => {
    setQuota((prev) => applyAiQuotaApiFields(prev, fields));
    setQuotaSynced(true);
  }, []);

  const fetchQuotaFromServer = useCallback(async () => {
    const a = getCoupleAssistantAuth();
    if (!a) {
      setQuota(buildAiQuotaSnapshot(0, plan, usageDate));
      setQuotaSynced(true);
      return;
    }

    const params = new URLSearchParams({
      usageDate,
      userId: a.userId,
    });
    if (a.coupleId) params.set('coupleId', a.coupleId);

    try {
      const base = resolveLoveQuestQuotaUrl();
      const res = await fetch(`${base}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const body = (await res.json()) as AiQuotaApiFields & { error?: string };
      if (res.ok) {
        applyQuotaFromResponse(body);
        return;
      }
    } catch (e) {
      console.warn('[ai-usage] quota fetch failed', e);
    }

    if (auth.supabase) {
      const used = await fetchLoveQuestAiUsageToday(auth.supabase, a.userId, usageDate);
      setQuota(buildAiQuotaSnapshot(used, plan, usageDate));
      setQuotaSynced(true);
    }
  }, [getCoupleAssistantAuth, usageDate, plan, applyQuotaFromResponse, auth.supabase]);

  const refreshAiQuota = useCallback(async () => {
    const gen = ++refreshGenRef.current;
    if (!isLoggedIn) {
      setQuota(buildAiQuotaSnapshot(0, plan, usageDate));
      setQuotaSynced(true);
      return;
    }

    setLoading(true);
    try {
      await fetchQuotaFromServer();
    } finally {
      if (gen === refreshGenRef.current) {
        setLoading(false);
      }
    }
  }, [isLoggedIn, plan, usageDate, fetchQuotaFromServer]);

  const syncQuotaAfterAiSuccess = useCallback(
    async (fields: AiQuotaApiFields) => {
      applyQuotaFromResponse(fields);
      await fetchQuotaFromServer();
    },
    [applyQuotaFromResponse, fetchQuotaFromServer]
  );

  useEffect(() => {
    void refreshAiQuota();
  }, [refreshAiQuota]);

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

  useEffect(() => {
    if (!isLoggedIn) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshAiQuota();
      }
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isLoggedIn, refreshAiQuota]);

  const tryBeginAiCall = useCallback(() => {
    if (aiCallLockRef.current) return false;
    aiCallLockRef.current = true;
    setAiCallInFlight(true);
    return true;
  }, []);

  const endAiCall = useCallback(() => {
    aiCallLockRef.current = false;
    setAiCallInFlight(false);
  }, []);

  const ensureCanCallAi = useCallback((): AiUsageGateResult => {
    if (!isLoggedIn) {
      return { ok: false, code: 'AUTH', message: '請先登入後再使用 AI' };
    }
    if (aiCallLockRef.current) {
      return { ok: false, code: 'BUSY', message: 'AI 正在處理中，請稍候' };
    }
    if (!quotaSynced) {
      return { ok: false, code: 'SYNC', message: '正在同步 AI 次數，請稍候' };
    }
    if (quota.remaining <= 0) {
      return {
        ok: false,
        code: 'QUOTA',
        message: aiQuotaExhaustedMessage(isPro),
      };
    }
    return { ok: true };
  }, [isLoggedIn, quota.remaining, quotaSynced, isPro]);

  const onQuotaBlocked = useCallback(
    (message?: string) => {
      openUpgradeModal(message ?? aiQuotaExhaustedMessage(isPro));
    },
    [openUpgradeModal, isPro]
  );

  const canUseAi = quotaSynced && quota.remaining > 0 && isLoggedIn && !aiCallInFlight;

  const usageLine = useMemo(
    () => formatAiUsageLine(quota.used, quota.limit),
    [quota.used, quota.limit]
  );

  const remainingLine = useMemo(
    () => formatAiRemainingLine(quota.remaining, quota.limit),
    [quota.remaining, quota.limit]
  );

  const value = useMemo<AiUsageContextValue>(
    () => ({
      quota,
      usageLine,
      remainingLine,
      usageDate,
      plan,
      isPro,
      isLoggedIn,
      loading,
      quotaSynced,
      canUseAi,
      canUseAdvancedAi: isPro,
      aiCallInFlight,
      refreshAiQuota,
      fetchQuotaFromServer,
      syncQuotaAfterAiSuccess,
      getRemainingAiQuota: () => getRemainingAiQuota(quota),
      getCoupleAssistantAuth,
      ensureCanCallAi,
      tryBeginAiCall,
      endAiCall,
      onQuotaBlocked,
      quotaExhaustedMessage: aiQuotaExhaustedMessage(isPro),
      applyQuotaFromResponse,
      refresh: refreshAiQuota,
    }),
    [
      quota,
      usageLine,
      remainingLine,
      usageDate,
      plan,
      isPro,
      isLoggedIn,
      loading,
      quotaSynced,
      canUseAi,
      aiCallInFlight,
      refreshAiQuota,
      fetchQuotaFromServer,
      syncQuotaAfterAiSuccess,
      getCoupleAssistantAuth,
      ensureCanCallAi,
      tryBeginAiCall,
      endAiCall,
      onQuotaBlocked,
      applyQuotaFromResponse,
    ]
  );

  return <AiUsageContext.Provider value={value}>{children}</AiUsageContext.Provider>;
}

export function useAiUsage(): AiUsageContextValue {
  const ctx = useContext(AiUsageContext);
  if (!ctx) {
    throw new Error('useAiUsage must be used within AiUsageProvider');
  }
  return ctx;
}

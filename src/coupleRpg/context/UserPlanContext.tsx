import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { BillingPeriod } from '../../subscription/types';
import { isLoveQuestDevMode } from '../lib/loveQuestDevMode';
import {
  PRO_TOAST_COUPLE,
  PRO_TOAST_COUPLE_FREE,
  PRO_TOAST_LOCAL,
  PRO_TOAST_PURCHASE_FAIL,
  PRO_TOAST_RESTORE_FAIL,
  PRO_TOAST_RESTORE_NONE,
  PRO_TOAST_RESTORE_OK,
  PRO_TOAST_SYNC_FAILED,
} from '../lib/proPlanContent';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { addActivityLog } from '../services/activityLogService';
import {
  purchaseLoveQuestPro,
  restoreLoveQuestPurchases,
  syncLoveQuestIapOnLaunch,
} from '../services/loveQuestIapPlanService';
import { loadCoupleExtendedProfile } from '../storage/coupleExtendedStore';
import {
  activateCoupleProTrial,
  getCouplePlan,
  setCouplePlanForTesting,
  shouldUseCoupleSubscription,
  type CouplePlanSnapshot,
} from '../services/couplePlanService';
import { getUserPlan, setUserPlan, type UserPlan } from '../storage/planStore';
import { useCoupleSpace } from './CoupleSpaceContext';

type UserPlanContextValue = {
  plan: UserPlan;
  isPro: boolean;
  planLoading: boolean;
  iapBusy: boolean;
  planSnapshot: CouplePlanSnapshot;
  refreshPlan: () => Promise<void>;
  purchasePro: (period: BillingPeriod) => Promise<void>;
  restorePurchases: () => Promise<void>;
  /** @deprecated 開發測試 */
  tryProExperience: () => Promise<void>;
  /** @deprecated 開發測試 */
  resetToFree: () => Promise<void>;
  /** @deprecated 開發測試 */
  setProForTesting: () => Promise<void>;
  planToast: string | null;
  clearPlanToast: () => void;
  upgradeModalOpen: boolean;
  upgradeModalHint: string | null;
  openUpgradeModal: (hint?: string) => void;
  closeUpgradeModal: () => void;
};

const UserPlanContext = createContext<UserPlanContextValue | null>(null);

const INITIAL_SNAPSHOT: CouplePlanSnapshot = {
  plan: getUserPlan(),
  isPro: getUserPlan() === 'pro',
  source: 'local',
  coupleId: null,
  isShared: false,
  subscription: null,
};

export function UserPlanProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  const isOnline = useOnlineStatus();
  const { space, loading: coupleSpaceLoading, isFullyBound } = useCoupleSpace();

  const [planSnapshot, setPlanSnapshot] = useState<CouplePlanSnapshot>(INITIAL_SNAPSHOT);
  const [planLoading, setPlanLoading] = useState(false);
  const [iapBusy, setIapBusy] = useState(false);
  const [planToast, setPlanToast] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalHint, setUpgradeModalHint] = useState<string | null>(null);

  const coupleId = space?.coupleId ?? null;
  const userId = auth.user?.id ?? null;

  const syncInput = useMemo(
    () => ({
      configured: auth.configured,
      supabase: auth.supabase,
      userId,
      coupleId,
      isFullyBound,
      online: isOnline,
    }),
    [auth.configured, auth.supabase, userId, coupleId, isFullyBound, isOnline]
  );

  const refreshPlan = useCallback(async () => {
    if (coupleSpaceLoading) return;
    setPlanLoading(true);
    try {
      await syncLoveQuestIapOnLaunch(syncInput);
      const snap = await getCouplePlan(syncInput);
      setPlanSnapshot(snap);
      setUserPlan(snap.plan);
    } finally {
      setPlanLoading(false);
    }
  }, [syncInput, coupleSpaceLoading]);

  useEffect(() => {
    if (!auth.authReady) return;
    void refreshPlan();
  }, [auth.authReady, refreshPlan]);

  const clearPlanToast = useCallback(() => setPlanToast(null), []);

  const logProUpgrade = useCallback(() => {
    addActivityLog(
      { actionType: 'upgrade', targetType: 'pro_plan', targetTitle: 'LoveQuest Pro', coupleId },
      { currentUserId: userId, coupleExtended: loadCoupleExtendedProfile() },
      { isPro: true }
    );
  }, [coupleId, userId]);

  const purchasePro = useCallback(
    async (period: BillingPeriod) => {
      setIapBusy(true);
      try {
        const outcome = await purchaseLoveQuestPro(syncInput, period);
        if (outcome.cancelled) return;
        if (!outcome.ok) {
          setPlanToast(outcome.message ?? PRO_TOAST_PURCHASE_FAIL);
          return;
        }
        await refreshPlan();
        logProUpgrade();
        setPlanToast(PRO_TOAST_COUPLE);
        setUpgradeModalOpen(false);
      } finally {
        setIapBusy(false);
      }
    },
    [syncInput, refreshPlan, logProUpgrade]
  );

  const restorePurchases = useCallback(async () => {
    setIapBusy(true);
    try {
      const outcome = await restoreLoveQuestPurchases(syncInput);
      if (outcome.cancelled) return;
      if (!outcome.ok) {
        setPlanToast(
          outcome.message === '尚未找到有效訂閱'
            ? PRO_TOAST_RESTORE_NONE
            : outcome.message ?? PRO_TOAST_RESTORE_FAIL
        );
        return;
      }
      await refreshPlan();
      logProUpgrade();
      setPlanToast(PRO_TOAST_RESTORE_OK);
      setUpgradeModalOpen(false);
    } finally {
      setIapBusy(false);
    }
  }, [syncInput, refreshPlan, logProUpgrade]);

  const tryProExperience = useCallback(async () => {
    if (!isLoveQuestDevMode()) {
      await purchasePro('yearly');
      return;
    }
    if (shouldUseCoupleSubscription(syncInput) && auth.supabase && coupleId && userId) {
      try {
        await activateCoupleProTrial(auth.supabase, coupleId, userId);
        await refreshPlan();
        logProUpgrade();
        setPlanToast(PRO_TOAST_COUPLE);
        setUpgradeModalOpen(false);
      } catch (e) {
        console.error('[couple-plan] activate failed:', e);
        setPlanToast(PRO_TOAST_SYNC_FAILED);
      }
      return;
    }

    setUserPlan('pro');
    setPlanSnapshot((prev) => ({
      ...prev,
      plan: 'pro',
      isPro: true,
      source: 'local',
      isShared: false,
    }));
    setPlanToast(PRO_TOAST_LOCAL);
    setUpgradeModalOpen(false);
    logProUpgrade();
  }, [syncInput, auth.supabase, coupleId, userId, refreshPlan, logProUpgrade, purchasePro]);

  const resetToFree = useCallback(async () => {
    if (!isLoveQuestDevMode()) return;
    if (shouldUseCoupleSubscription(syncInput) && auth.supabase && coupleId && userId) {
      try {
        await setCouplePlanForTesting(auth.supabase, coupleId, userId, 'free');
        await refreshPlan();
        setPlanToast(PRO_TOAST_COUPLE_FREE);
      } catch (e) {
        console.error('[couple-plan] reset free failed:', e);
        setPlanToast(PRO_TOAST_SYNC_FAILED);
      }
      return;
    }

    setUserPlan('free');
    setPlanSnapshot((prev) => ({
      ...prev,
      plan: 'free',
      isPro: false,
      source: 'local',
      isShared: false,
      subscription: null,
    }));
    setPlanToast(PRO_TOAST_COUPLE_FREE);
  }, [syncInput, auth.supabase, coupleId, userId, refreshPlan]);

  const setProForTesting = useCallback(async () => {
    if (!isLoveQuestDevMode()) return;
    if (shouldUseCoupleSubscription(syncInput) && auth.supabase && coupleId && userId) {
      try {
        await setCouplePlanForTesting(auth.supabase, coupleId, userId, 'pro');
        await refreshPlan();
        setPlanToast(PRO_TOAST_COUPLE);
      } catch (e) {
        console.error('[couple-plan] set pro test failed:', e);
        setPlanToast(PRO_TOAST_SYNC_FAILED);
      }
      return;
    }

    setUserPlan('pro');
    setPlanSnapshot((prev) => ({
      ...prev,
      plan: 'pro',
      isPro: true,
      source: 'local',
      isShared: false,
    }));
    setPlanToast(PRO_TOAST_LOCAL);
  }, [syncInput, auth.supabase, coupleId, userId, refreshPlan]);

  const openUpgradeModal = useCallback((hint?: string) => {
    setUpgradeModalHint(hint ?? null);
    setUpgradeModalOpen(true);
  }, []);
  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
    setUpgradeModalHint(null);
  }, []);

  useEffect(() => {
    if (!planToast) return;
    const t = window.setTimeout(() => setPlanToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [planToast]);

  const value = useMemo<UserPlanContextValue>(
    () => ({
      plan: planSnapshot.plan,
      isPro: planSnapshot.isPro,
      planLoading,
      iapBusy,
      planSnapshot,
      refreshPlan,
      purchasePro,
      restorePurchases,
      tryProExperience,
      resetToFree,
      setProForTesting,
      planToast,
      clearPlanToast,
      upgradeModalOpen,
      upgradeModalHint,
      openUpgradeModal,
      closeUpgradeModal,
    }),
    [
      planSnapshot,
      planLoading,
      iapBusy,
      refreshPlan,
      purchasePro,
      restorePurchases,
      tryProExperience,
      resetToFree,
      setProForTesting,
      planToast,
      clearPlanToast,
      upgradeModalOpen,
      upgradeModalHint,
      openUpgradeModal,
      closeUpgradeModal,
    ]
  );

  return <UserPlanContext.Provider value={value}>{children}</UserPlanContext.Provider>;
}

export function useUserPlan() {
  const ctx = useContext(UserPlanContext);
  if (!ctx) throw new Error('useUserPlan must be used within UserPlanProvider');
  return ctx;
}

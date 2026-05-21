import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import {
  PRO_TOAST_COUPLE,
  PRO_TOAST_COUPLE_FREE,
  PRO_TOAST_LOCAL,
  PRO_TOAST_SYNC_FAILED,
} from '../lib/proPlanContent';
import { addActivityLog } from '../services/activityLogService';
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
  planSnapshot: CouplePlanSnapshot;
  refreshPlan: () => Promise<void>;
  tryProExperience: () => Promise<void>;
  resetToFree: () => Promise<void>;
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

  const tryProExperience = useCallback(async () => {
    if (shouldUseCoupleSubscription(syncInput) && auth.supabase && coupleId && userId) {
      try {
        await activateCoupleProTrial(auth.supabase, coupleId, userId);
        await refreshPlan();
        addActivityLog(
          { actionType: 'upgrade', targetType: 'pro_plan', targetTitle: 'Pro 體驗', coupleId },
          { currentUserId: userId, coupleExtended: loadCoupleExtendedProfile() },
          { isPro: true }
        );
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
    addActivityLog(
      { actionType: 'upgrade', targetType: 'pro_plan', targetTitle: 'Pro 體驗', coupleId },
      { currentUserId: userId, coupleExtended: loadCoupleExtendedProfile() },
      { isPro: true }
    );
  }, [syncInput, auth.supabase, coupleId, userId, refreshPlan]);

  const resetToFree = useCallback(async () => {
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
      planSnapshot,
      refreshPlan,
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
      refreshPlan,
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

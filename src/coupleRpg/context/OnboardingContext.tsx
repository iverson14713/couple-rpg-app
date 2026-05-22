import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { LoveQuestOnboarding } from '../components/LoveQuestOnboarding';
import {
  persistOnboardingComplete,
  resolveShouldShowOnboarding,
} from '../services/onboardingSyncService';
import { isOnboardingDone as isOnboardingDoneLocal } from '../storage/onboardingStore';

type OnboardingContextValue = {
  replayOnboarding: () => void;
  /** null = 尚未解析完成 */
  onboardingResolved: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  const [autoShow, setAutoShow] = useState<boolean | null>(null);
  const [manualVisible, setManualVisible] = useState(false);

  const visible = manualVisible || autoShow === true;
  const onboardingResolved = autoShow !== null || !auth.configured;

  const refreshAutoShow = useCallback(async () => {
    if (!auth.configured) {
      setAutoShow(!isOnboardingDoneLocal());
      return;
    }
    if (!auth.authReady) return;

    const shouldShow = await resolveShouldShowOnboarding({
      supabase: auth.supabase,
      userId: auth.user?.id ?? null,
      authReady: auth.authReady,
      configured: auth.configured,
    });
    setAutoShow(shouldShow);
  }, [auth.authReady, auth.configured, auth.supabase, auth.user?.id]);

  useEffect(() => {
    if (manualVisible) return;
    void refreshAutoShow();
  }, [manualVisible, refreshAutoShow]);

  const complete = useCallback(async () => {
    await persistOnboardingComplete({
      supabase: auth.supabase,
      userId: auth.user?.id ?? null,
    });
    setManualVisible(false);
    setAutoShow(false);
  }, [auth.supabase, auth.user?.id]);

  const replayOnboarding = useCallback(() => {
    setManualVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const value = useMemo(
    () => ({ replayOnboarding, onboardingResolved }),
    [replayOnboarding, onboardingResolved]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {visible ? <LoveQuestOnboarding onComplete={() => void complete()} /> : null}
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

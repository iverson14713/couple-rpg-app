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
  /** 含 auth 尚未 ready：不掛載主 App，避免首頁先閃再蓋 onboarding */
  const pendingResolve = auth.configured && autoShow === null && !manualVisible;
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

  const value = useMemo(
    () => ({ replayOnboarding, onboardingResolved }),
    [replayOnboarding, onboardingResolved]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {pendingResolve ? (
        <OnboardingResolveShell />
      ) : visible ? (
        <LoveQuestOnboarding onComplete={() => void complete()} />
      ) : (
        children
      )}
    </OnboardingContext.Provider>
  );
}

/** 解析 onboarding 狀態時不掛載主 App，避免首頁閃現 */
function OnboardingResolveShell() {
  return (
    <div
      className="lq-onboarding-screen flex min-h-[100dvh] items-center justify-center"
      aria-busy="true"
      aria-label="載入中"
    >
      <div className="h-8 w-8 animate-pulse rounded-full bg-rose-200/80 ring-4 ring-rose-100/60" />
    </div>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

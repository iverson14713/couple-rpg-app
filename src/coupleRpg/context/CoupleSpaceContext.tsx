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
import {
  acceptCoupleInvite,
  copyInviteCode,
  createCoupleSpace,
  fetchMyCoupleSpace,
  type CoupleSpaceInfo,
} from '../services/coupleSpaceApi';
import { mapCoupleSpaceError } from '../services/coupleSpaceErrors';
import { LQ_KEYS } from '../storage/keys';
import { loadJson, saveJson } from '../storage/persist';

type CoupleSpaceContextValue = {
  space: CoupleSpaceInfo | null;
  loading: boolean;
  busy: boolean;
  actionError: string | null;
  successMessage: string | null;
  isFullyBound: boolean;
  hasMembership: boolean;
  showBindReminder: boolean;
  refresh: () => Promise<void>;
  createSpace: (coupleName?: string) => Promise<void>;
  joinSpace: (inviteCode: string) => Promise<void>;
  copyCode: () => Promise<void>;
  clearMessages: () => void;
};

const CoupleSpaceContext = createContext<CoupleSpaceContextValue | null>(null);

export function CoupleSpaceProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  const [space, setSpace] = useState<CoupleSpaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!auth.configured || !auth.supabase || !auth.user) {
      setSpace(null);
      saveJson(LQ_KEYS.coupleSpaceId, null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const info = await fetchMyCoupleSpace(auth.supabase, auth.user);
      setSpace(info);
      saveJson(LQ_KEYS.coupleSpaceId, info?.coupleId ?? null);
    } catch (e) {
      console.warn('[couple-space refresh]', e);
      setActionError(mapCoupleSpaceError(e));
    } finally {
      setLoading(false);
    }
  }, [auth.configured, auth.supabase, auth.user]);

  useEffect(() => {
    if (!auth.authReady) return;
    void refresh();
  }, [auth.authReady, auth.user?.id, refresh]);

  const createSpace = useCallback(
    async (coupleName?: string) => {
      setActionError(null);
      setSuccessMessage(null);
      if (!auth.supabase || !auth.user) {
        setActionError('請先登入');
        return;
      }
      setBusy(true);
      try {
        await createCoupleSpace(auth.supabase, coupleName);
        await refresh();
        setSuccessMessage('情侶空間已建立！請將邀請碼傳給另一半');
      } catch (e) {
        setActionError(mapCoupleSpaceError(e));
      } finally {
        setBusy(false);
      }
    },
    [auth.supabase, auth.user, refresh]
  );

  const joinSpace = useCallback(
    async (inviteCode: string) => {
      setActionError(null);
      setSuccessMessage(null);
      if (!auth.supabase || !auth.user) {
        setActionError('請先登入');
        return;
      }
      setBusy(true);
      try {
        await acceptCoupleInvite(auth.supabase, inviteCode);
        await refresh();
        setSuccessMessage('已成功加入情侶空間！');
      } catch (e) {
        setActionError(mapCoupleSpaceError(e));
      } finally {
        setBusy(false);
      }
    },
    [auth.supabase, auth.user, refresh]
  );

  const copyCode = useCallback(async () => {
    if (!space?.inviteCode) return;
    const ok = await copyInviteCode(space.inviteCode);
    setSuccessMessage(ok ? '邀請碼已複製' : '無法複製，請手動選取邀請碼');
  }, [space?.inviteCode]);

  const clearMessages = useCallback(() => {
    setActionError(null);
    setSuccessMessage(null);
  }, []);

  const isFullyBound = space?.isFullyBound ?? false;
  const hasMembership = space !== null;
  const showBindReminder = !auth.user || (!loading && !isFullyBound);

  const value = useMemo(
    () => ({
      space,
      loading,
      busy,
      actionError,
      successMessage,
      isFullyBound,
      hasMembership,
      showBindReminder,
      refresh,
      createSpace,
      joinSpace,
      copyCode,
      clearMessages,
    }),
    [
      space,
      loading,
      busy,
      actionError,
      successMessage,
      isFullyBound,
      hasMembership,
      showBindReminder,
      refresh,
      createSpace,
      joinSpace,
      copyCode,
      clearMessages,
    ]
  );

  return <CoupleSpaceContext.Provider value={value}>{children}</CoupleSpaceContext.Provider>;
}

export function useCoupleSpace() {
  const ctx = useContext(CoupleSpaceContext);
  if (!ctx) throw new Error('useCoupleSpace must be used within CoupleSpaceProvider');
  return ctx;
}

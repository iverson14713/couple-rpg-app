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
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import type { CompanionshipPreset } from '../data/companionshipPresets';
import { resolveCompanionshipSend } from '../data/companionshipPresets';
import {
  checkCustomCompanionshipSend,
  checkPresetCompanionshipSend,
  freeCompanionshipSendsRemaining,
  todaySentByUserFromQuota,
} from '../lib/companionshipEntitlement';
import {
  canSendCompanionship,
  companionshipBindHint,
  logCompanionshipCoupleState,
  resolveCompanionshipActiveCouple,
  type CompanionshipActiveCouple,
} from '../lib/companionshipCoupleContext';
import { validateCompanionshipCustomMessage } from '../lib/companionshipCustomMessage';
import { lightCompanionshipHaptic } from '../lib/companionshipTime';
import {
  canSyncCompanionship,
  pushPendingCompanionshipEvents,
} from '../services/companionshipSyncService';
import {
  createCompanionshipSyncScheduler,
  type CompanionshipSyncScheduler,
} from '../services/companionshipSyncScheduler';
import {
  appendCompanionshipEvent,
  computeCompanionshipStats,
  getLatestUnseenForReceiver,
  loadCompanionshipEvents,
  markCompanionshipSeenLocal,
  newCompanionshipLocalId,
  registerCompanionshipSyncScheduler,
  removeCompanionshipEventById,
  subscribeCompanionshipUpdated,
} from '../storage/companionshipStore';
import {
  recordCompanionshipSendQuota,
  rollbackCompanionshipSendQuota,
} from '../storage/companionshipQuotaStore';
import type { CompanionshipEvent, CompanionshipStats } from '../storage/companionshipTypes';
import { canUseUserStorage } from '../storage/storageGuard';
import { useCoupleSpace } from './CoupleSpaceContext';
import { useLoveQuest } from './LoveQuestContext';
import { useUserPlan } from './UserPlanContext';

export type CompanionshipSendResult =
  | 'ok'
  | 'no_partner'
  | 'not_bound'
  | 'not_logged_in'
  | 'save_failed'
  | 'sync_failed'
  | 'pro_required'
  | 'daily_limit';

export type CompanionshipCustomSendResult =
  | { ok: true }
  | { ok: false; reason: 'invalid'; hint: string }
  | { ok: false; reason: 'no_partner' | 'not_bound' | 'not_logged_in' | 'save_failed' | 'sync_failed' }
  | { ok: false; reason: 'pro_required' | 'daily_limit'; hint: string };

type CompanionshipContextValue = {
  events: CompanionshipEvent[];
  stats: CompanionshipStats;
  latestUnseen: CompanionshipEvent | null;
  sendCompanionship: (preset: CompanionshipPreset) => Promise<CompanionshipSendResult>;
  sendCustomCompanionship: (rawMessage: string) => Promise<CompanionshipCustomSendResult>;
  markSeen: (eventId: string) => void;
  lastSendFeedback: 'idle' | 'sent';
  clearSendFeedback: () => void;
  canUseCompanionship: boolean;
  bindHint: string | null;
  activeCouple: CompanionshipActiveCouple;
  todaySentByMe: number;
  freeSendsRemaining: number | null;
};

const CompanionshipContext = createContext<CompanionshipContextValue | null>(null);

const LOG = '[companionship]';

export function CompanionshipProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  const { isPro } = useUserPlan();
  const { isFullyBound, space } = useCoupleSpace();
  const { coupleExtended } = useLoveQuest();
  const isOnline = useOnlineStatus();
  const currentUserId = auth.user?.id ?? null;

  const activeCouple = useMemo(
    () => resolveCompanionshipActiveCouple({ space, currentUserId, coupleExtended }),
    [space, currentUserId, coupleExtended]
  );
  const coupleId = activeCouple.coupleId;
  const partnerUserId = activeCouple.partnerUserId;

  const canUseCompanionship = useMemo(
    () => canSendCompanionship(activeCouple, currentUserId),
    [activeCouple, currentUserId]
  );

  const bindHint = useMemo(
    () => companionshipBindHint(activeCouple, currentUserId),
    [activeCouple, currentUserId]
  );

  useEffect(() => {
    logCompanionshipCoupleState(currentUserId, activeCouple);
  }, [activeCouple, currentUserId]);

  const [events, setEvents] = useState<CompanionshipEvent[]>(() => loadCompanionshipEvents());
  const [lastSendFeedback, setLastSendFeedback] = useState<'idle' | 'sent'>('idle');
  const [quotaTick, setQuotaTick] = useState(0);
  const schedulerRef = useRef<CompanionshipSyncScheduler | null>(null);

  const refreshEvents = useCallback(() => {
    setEvents(loadCompanionshipEvents());
  }, []);

  const bumpQuota = useCallback(() => {
    setQuotaTick((n) => n + 1);
  }, []);

  useEffect(() => subscribeCompanionshipUpdated(refreshEvents), [refreshEvents]);

  useEffect(() => {
    schedulerRef.current?.dispose();
    const scheduler = createCompanionshipSyncScheduler({
      canSync: () =>
        canSyncCompanionship({
          configured: auth.configured,
          userId: currentUserId,
          coupleId,
          online: isOnline,
          isFullyBound,
        }),
      getSupabase: () => auth.supabase,
      getCoupleId: () => coupleId,
      getUserId: () => currentUserId,
    });
    schedulerRef.current = scheduler;
    registerCompanionshipSyncScheduler(scheduler.scheduleCompanionshipSync);

    if (
      canSyncCompanionship({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      void scheduler.pullFromRemoteIfIdle();
    }

    return () => {
      registerCompanionshipSyncScheduler(null);
      scheduler.dispose();
      schedulerRef.current = null;
    };
  }, [
    auth.configured,
    auth.supabase,
    coupleId,
    currentUserId,
    isFullyBound,
    isOnline,
  ]);

  const stats = useMemo(() => computeCompanionshipStats(events), [events]);

  const latestUnseen = useMemo(
    () => getLatestUnseenForReceiver(events, currentUserId),
    [events, currentUserId]
  );

  const todaySentByMe = useMemo(
    () => todaySentByUserFromQuota(currentUserId, coupleId),
    [currentUserId, coupleId, quotaTick]
  );

  const freeSendsRemaining = useMemo(
    () => freeCompanionshipSendsRemaining(currentUserId, coupleId, isPro),
    [currentUserId, coupleId, isPro, quotaTick]
  );

  const dispatchCompanionshipEvent = useCallback(
    async (type: string, message: string): Promise<CompanionshipSendResult> => {
      logCompanionshipCoupleState(currentUserId, activeCouple);
      console.log(`${LOG} sendCompanion start`, {
        type,
        currentUserId,
        coupleId,
        partnerId: partnerUserId,
        activeCouple,
      });

      if (!currentUserId) {
        console.log(`${LOG} send fail`, 'not_logged_in');
        return 'not_logged_in';
      }
      if (!canUseUserStorage(currentUserId)) {
        console.log(`${LOG} send fail`, 'not_logged_in (storage)');
        return 'not_logged_in';
      }
      if (!coupleId) {
        console.log(`${LOG} send fail`, 'not_bound');
        return 'not_bound';
      }
      if (!partnerUserId) {
        console.log(`${LOG} send fail`, 'no_partner');
        return 'no_partner';
      }

      const event: CompanionshipEvent = {
        id: newCompanionshipLocalId(),
        coupleId,
        senderUserId: currentUserId,
        receiverUserId: partnerUserId,
        type,
        message,
        createdAt: new Date().toISOString(),
        seenAt: null,
        source: 'local',
      };

      const saved = appendCompanionshipEvent(event);
      if (!saved) {
        console.log(`${LOG} send fail`, 'save_failed');
        return 'save_failed';
      }

      let quotaRecorded = false;
      if (!isPro) {
        const sentToday = recordCompanionshipSendQuota(currentUserId, coupleId);
        quotaRecorded = true;
        const remaining = freeCompanionshipSendsRemaining(currentUserId, coupleId, false);
        console.log(`${LOG} quota update`, { sentToday, remaining });
      }

      setEvents(loadCompanionshipEvents());
      bumpQuota();

      const shouldSync = canSyncCompanionship({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      });

      if (shouldSync && auth.supabase) {
        try {
          await pushPendingCompanionshipEvents(auth.supabase, coupleId);
          console.log(`${LOG} send success`, { eventId: event.id, synced: true });
        } catch (e) {
          removeCompanionshipEventById(event.id);
          if (quotaRecorded) {
            rollbackCompanionshipSendQuota(currentUserId, coupleId);
            const remaining = freeCompanionshipSendsRemaining(currentUserId, coupleId, false);
            console.log(`${LOG} quota rollback`, { remaining });
          }
          setEvents(loadCompanionshipEvents());
          bumpQuota();
          console.log(`${LOG} send fail`, 'sync_failed', e);
          return 'sync_failed';
        }
      } else {
        console.log(`${LOG} send success`, { eventId: event.id, synced: false });
      }

      lightCompanionshipHaptic();
      setLastSendFeedback('sent');
      return 'ok';
    },
    [
      activeCouple,
      auth.configured,
      auth.supabase,
      bumpQuota,
      coupleId,
      currentUserId,
      isFullyBound,
      isOnline,
      isPro,
      partnerUserId,
    ]
  );

  const sendCompanionship = useCallback(
    async (preset: CompanionshipPreset): Promise<CompanionshipSendResult> => {
      const gate = checkPresetCompanionshipSend(preset, isPro, currentUserId, coupleId);
      if (!gate.allowed) {
        console.log(`${LOG} send fail`, gate.reason);
        return gate.reason;
      }

      const resolved = resolveCompanionshipSend(preset);
      return dispatchCompanionshipEvent(resolved.type, resolved.message);
    },
    [coupleId, currentUserId, dispatchCompanionshipEvent, isPro]
  );

  const sendCustomCompanionship = useCallback(
    async (rawMessage: string): Promise<CompanionshipCustomSendResult> => {
      const gate = checkCustomCompanionshipSend(isPro);
      if (!gate.allowed) {
        console.log(`${LOG} send fail`, gate.reason);
        return { ok: false, reason: gate.reason, hint: gate.hint };
      }

      const validated = validateCompanionshipCustomMessage(rawMessage);
      if (!validated.ok) {
        return { ok: false, reason: 'invalid', hint: validated.hint };
      }

      const result = await dispatchCompanionshipEvent('custom', validated.message);
      if (result === 'not_bound') return { ok: false, reason: 'not_bound' };
      if (result === 'no_partner') return { ok: false, reason: 'no_partner' };
      if (result === 'not_logged_in') return { ok: false, reason: 'not_logged_in' };
      if (result === 'save_failed') return { ok: false, reason: 'save_failed' };
      if (result === 'sync_failed') return { ok: false, reason: 'sync_failed' };
      return { ok: true };
    },
    [dispatchCompanionshipEvent, isPro]
  );

  const markSeen = useCallback((eventId: string) => {
    markCompanionshipSeenLocal(eventId, new Date().toISOString());
    setEvents(loadCompanionshipEvents());
  }, []);

  const clearSendFeedback = useCallback(() => setLastSendFeedback('idle'), []);

  const value = useMemo<CompanionshipContextValue>(
    () => ({
      events,
      stats,
      latestUnseen,
      sendCompanionship,
      sendCustomCompanionship,
      markSeen,
      lastSendFeedback,
      clearSendFeedback,
      canUseCompanionship,
      bindHint,
      activeCouple,
      todaySentByMe,
      freeSendsRemaining,
    }),
    [
      events,
      stats,
      latestUnseen,
      sendCompanionship,
      sendCustomCompanionship,
      markSeen,
      lastSendFeedback,
      clearSendFeedback,
      canUseCompanionship,
      bindHint,
      activeCouple,
      todaySentByMe,
      freeSendsRemaining,
    ]
  );

  return (
    <CompanionshipContext.Provider value={value}>{children}</CompanionshipContext.Provider>
  );
}

export function useCompanionship(): CompanionshipContextValue {
  const ctx = useContext(CompanionshipContext);
  if (!ctx) throw new Error('useCompanionship must be used within CompanionshipProvider');
  return ctx;
}

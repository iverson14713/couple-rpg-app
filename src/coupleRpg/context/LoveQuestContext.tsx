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
import { FLIRT_GAMES, type FlirtGameId } from '../data/flirtGames';
import { loadJson, saveJson } from '../storage/persist';
import { LQ_KEYS } from '../storage/keys';
import {
  getRecentHistory,
  getTodayDinner,
  loadDinner,
  pickRandomOption,
  saveDinner,
  saveTodayResult,
} from '../storage/dinnerStore';
import {
  completePending,
  getWeeklyStats,
  completeAssignedChore,
  clearTodayAssignment,
  getHouseworkHomeStatus,
  loadHousework,
  reassignToday,
  saveHousework,
  setSelectedTaskIds,
  startTodayAssignment,
} from '../storage/houseworkStore';
import type { HouseworkHomeStatus } from '../storage/houseworkStore';
import {
  dailyTaskProgress,
  loadTasks,
  replaceLoveTask,
  saveTasks,
  toggleDailyTask,
} from '../storage/tasksStore';
import {
  clearSession,
  isGameDoneToday,
  loadFlirtGames,
  markGameCompleted,
  rollGamePrompt,
  saveFlirtGames,
  startGameSession,
} from '../storage/flirtGamesStore';
import {
  appendCompletion,
  getRecentCompletions,
  loadCompletionHistory,
} from '../storage/completionHistoryStore';
import {
  completeCurrentDate,
  getFavoriteIdeas,
  getRecentDateHistory,
  loadDatePlanner,
  pickRandomDateIdea,
  saveDatePlanner,
  toggleFavorite,
} from '../storage/datePlannerStore';
import type { DateFilterKey, DatePlannerData } from '../storage/dateTypes';
import { DEFAULT_DATE_FILTERS } from '../storage/dateTypes';
import {
  acknowledgeReminder,
  addAnniversaryEvent,
  canRewardCelebrate,
  canRewardPlan,
  getActiveReminders,
  getNextImportant,
  getNextOccurrence,
  getUpcomingEvents,
  loadAnniversaries,
  markCelebrated,
  markPlanRewarded,
  occurrenceYear,
  removeAnniversaryEvent,
  saveAnniversaries,
  saveGiftSuggestions,
  savePlan,
  updateAnniversaryEvent,
  updateGiftPreferences,
} from '../storage/anniversaryStore';
import type { AnniversaryData, AnniversaryEventType, GiftPreferences } from '../storage/anniversaryTypes';
import { mockAnniversaryPlan } from '../data/mockAnniversaryPlans';
import { mockGiftSuggestions } from '../data/mockGiftSuggestions';
import { appendActivity, loadActivity } from '../storage/activityStore';
import {
  addCoinEarn,
  completeRewardCardLocal,
  getActiveCoupons,
  getCouponsByStatus,
  getRecentEarns,
  getUsedCoupons,
  getWeeklyTitles,
  loadRewards,
  processDailyLogin,
  redeemCoupon,
  redeemCustomCoupon,
  saveRewards,
  useRewardCardLocal,
} from '../storage/rewardsStore';
import {
  canSyncRewardCards,
  cleanupOldCompletedRewardCards,
  completeRewardCard as pushCompleteRewardCardRemote,
  pullRewardCardsFromRemote,
  redeemRewardCard,
  sortCompletedCoupons,
  syncRewardCards as syncRewardCardsRemote,
  useRewardCard as pushUseRewardCardRemote,
  type RewardCardSyncStatus,
} from '../services/rewardCardSync';
import { addActivityLog } from '../services/activityLogService';
import type { ActivityLogInput } from '../storage/activityLogTypes';
import { canSyncChores, type ChoreSyncStatus } from '../services/choreSyncService';
import { createChoreSyncScheduler, type ChoreSyncScheduler } from '../services/choreSyncScheduler';
import {
  displayNameForUserId,
  formatCompleteFeedLine,
  formatRedeemFeedLine,
  formatUseFeedLine,
  couponNeedsPartnerCompletion,
} from '../lib/rewardCardHelpers';
import type { CustomRewardCardInput } from '../storage/rewardTypes';
import { getMiniGameDailyRewardCap } from '../lib/miniGameRewards';
import { useCoupleSpace } from './CoupleSpaceContext';
import { useUserPlan } from './UserPlanContext';
import type { CoinEarnMeta, RewardsData, ShopItemId } from '../storage/rewardTypes';
import {
  applyReward,
  defaultDailyGuard,
  defaultRpgState,
  normalizeRpgState,
  REWARDS,
  rpgSnapshot,
  rollDailyGuardForToday,
  RPG_SCHEMA_VERSION,
  type RpgReward,
} from '../storage/rpgLogic';
import type {
  ActivityLogEntry,
  CompletionRecord,
  CoupleProfile,
  DinnerData,
  DinnerOption,
  FlirtGamesData,
  HouseworkData,
  PartnerId,
  RpgState,
  TasksData,
} from '../storage/types';
import type { CoupleExtendedProfile } from '../storage/coupleExtendedTypes';
import type { WeeklyHouseworkStats } from '../storage/houseworkStore';
import { makeId } from '../lib/id';
import { todayKey } from '../lib/dates';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import {
  canSyncFoodOptions,
  deleteFoodOptionRemote,
  pullRemoteFoodOptions,
  pushAllLocalDinnerOptions,
  pushDinnerOptionToSupabase,
} from '../services/foodOptionsSync';
import { useCoupleSpace } from './CoupleSpaceContext';
import {
  loadCoupleExtendedProfile,
  saveCoupleExtendedProfile,
  stampCoupleExtendedProfile,
} from '../storage/coupleExtendedStore';
import {
  canSyncCoupleProfile,
  getRemoteCoupleProfile,
  mergeCoupleProfile,
  pullCoupleProfileFromRemote,
  pushCoupleProfileToRemote,
  syncCoupleProfile,
  type CoupleProfileSyncStatus,
} from '../services/coupleProfileSyncService';
import {
  loadImportantDateReminders,
  saveImportantDateReminders,
} from '../storage/importantDateRemindersStore';
import type { ImportantDateRemindersData } from '../storage/importantDateReminderTypes';
import { importantDatesKnowledgeIncreased } from '../lib/coupleProfileImportantReward';
import { getNicknameSetupStatus, mergeCoupleProfile, type NicknameSetupStatus } from '../lib/coupleDisplayNames';

const DEFAULT_COUPLE: CoupleProfile = {
  nameA: '我',
  nameB: '另一半',
  emojiA: '💗',
  emojiB: '💙',
};

type LoveQuestContextValue = {
  couple: CoupleProfile;
  nicknameSetup: NicknameSetupStatus;
  rpg: RpgState;
  rpgView: ReturnType<typeof rpgSnapshot> & { miniGamesRewardCap: number };
  dinner: DinnerData;
  todayDinner: ReturnType<typeof getTodayDinner>;
  dinnerHistory: ReturnType<typeof getRecentHistory>;
  housework: HouseworkData;
  houseworkHomeStatus: HouseworkHomeStatus;
  weeklyStats: WeeklyHouseworkStats;
  tasks: TasksData;
  taskProgress: ReturnType<typeof dailyTaskProgress>;
  coupleExtended: CoupleExtendedProfile;
  setCoupleExtendedProfile: (profile: CoupleExtendedProfile) => void;
  coupleProfileSyncStatus: CoupleProfileSyncStatus;
  coupleProfileSyncError: string | null;
  syncCoupleProfile: () => Promise<void>;
  importantDateReminders: ImportantDateRemindersData;
  patchImportantDateReminder: (
    updater: (prev: ImportantDateRemindersData) => ImportantDateRemindersData
  ) => void;
  rerollLoveTask: (taskId: string) => void;
  flirtGames: FlirtGamesData;
  flirtGameDefs: typeof FLIRT_GAMES;
  completionHistory: CompletionRecord[];
  activity: ActivityLogEntry[];
  draftPick: string | null;
  spinning: boolean;
  addDinnerOption: (label: string) => void;
  removeDinnerOption: (id: string) => void;
  rollDinner: () => void;
  /** 設定晚餐抽籤預覽結果（動畫結束後寫入，與 `rollDinner` 邏輯分離） */
  setDinnerDraftPick: (label: string | null) => void;
  saveDinnerResult: (label?: string) => void;
  pullDinnerFromCloud: () => Promise<void>;
  syncDinnerFoodOptions: () => Promise<void>;
  addHouseworkItem: (label: string, emoji?: string) => void;
  removeHouseworkItem: (id: string) => void;
  setHouseworkSelectedTaskIds: (taskIds: string[]) => void;
  startHouseworkAssignment: () => boolean;
  completeHouseworkChore: (taskId: string) => void;
  clearTodayHousework: () => void;
  reassignTodayHousework: () => boolean;
  choreSyncStatus: ChoreSyncStatus;
  choreSyncError: string | null;
  pullHouseworkFromCloud: () => Promise<void>;
  syncHousework: () => Promise<void>;
  retryChoreSync: () => void;
  toggleDailyTask: (id: string) => void;
  startFlirtGame: (gameId: FlirtGameId) => void;
  rerollFlirtPrompt: () => void;
  completeFlirtGame: () => void;
  /** 情侶小遊戲頁「完成」：每日最多 3 次發放 RPG／LoveCoin；回傳是否本次有發獎 */
  claimMiniGameReward: (detail?: string) => boolean;
  cancelFlirtGame: () => void;
  isFlirtGameDoneToday: (gameId: FlirtGameId) => boolean;
  datePlanner: DatePlannerData;
  dateHistory: ReturnType<typeof getRecentDateHistory>;
  favoriteIdeas: ReturnType<typeof getFavoriteIdeas>;
  setDateFilter: (key: DateFilterKey, on: boolean) => void;
  clearDateFilters: () => void;
  generateDateIdea: () => boolean;
  toggleDateFavorite: (ideaId: string) => void;
  completeCurrentDate: () => void;
  anniversaries: AnniversaryData;
  upcomingAnniversaries: ReturnType<typeof getUpcomingEvents>;
  nextAnniversary: ReturnType<typeof getNextImportant>;
  activeAnniversaryReminders: ReturnType<typeof getActiveReminders>;
  addAnniversary: (input: {
    name: string;
    date: string;
    type: AnniversaryEventType;
    note: string;
    repeatYearly: boolean;
  }) => void;
  updateAnniversary: (
    id: string,
    input: Partial<{
      name: string;
      date: string;
      type: AnniversaryEventType;
      note: string;
      repeatYearly: boolean;
    }>
  ) => void;
  removeAnniversary: (id: string) => void;
  generateAnniversaryPlan: (eventId: string) => void;
  completeAnniversaryPlan: (eventId: string) => void;
  markAnniversaryCelebrated: (eventId: string) => void;
  updateGiftPrefs: (prefs: GiftPreferences) => void;
  generateGiftSuggestions: () => void;
  dismissAnniversaryReminder: (reminderId: string) => void;
  rewards: RewardsData;
  todayCoinEarned: number;
  recentCoinEarns: ReturnType<typeof getRecentEarns>;
  weeklyTitles: ReturnType<typeof getWeeklyTitles>;
  activeCoupons: ReturnType<typeof getActiveCoupons>;
  usedCoupons: ReturnType<typeof getUsedCoupons>;
  redeemedCoupons: ReturnType<typeof getCouponsByStatus>;
  inProgressCoupons: ReturnType<typeof getCouponsByStatus>;
  completedCoupons: ReturnType<typeof getCouponsByStatus>;
  rewardCardSyncStatus: RewardCardSyncStatus;
  rewardCardSyncError: string | null;
  redeemRewardItem: (itemId: ShopItemId) => boolean;
  redeemCustomRewardItem: (input: CustomRewardCardInput) => boolean;
  useCoupon: (couponId: string) => void;
  completeRewardCard: (couponId: string) => void;
  pullRewardCardsFromCloud: () => Promise<void>;
  syncRewardCards: () => Promise<void>;
  /** 清理超過保留期的已完成卡券，回傳刪除筆數 */
  cleanupOldCompletedRewardCards: () => Promise<number>;
  completedCouponsSorted: ReturnType<typeof sortCompletedCoupons>;
  partnerName: (id: PartnerId) => string;
  partnerEmoji: (id: PartnerId) => string;
};

const LoveQuestContext = createContext<LoveQuestContextValue | null>(null);

function loadRpg(): RpgState {
  const raw = loadJson<Partial<RpgState> & Record<string, unknown>>(LQ_KEYS.rpg, {});
  const next = normalizeRpgState({ ...defaultRpgState(), ...raw });
  const rawVer = (raw as { rpgSchemaVersion?: number }).rpgSchemaVersion;
  const rawGuard = (raw as { dailyGuard?: unknown }).dailyGuard;
  if (rawVer !== RPG_SCHEMA_VERSION || !rawGuard) {
    saveRpg(next);
  }
  return next;
}

function saveRpg(state: RpgState): void {
  saveJson(LQ_KEYS.rpg, state);
}

function loadCouple(): CoupleProfile {
  return loadJson(LQ_KEYS.couple, DEFAULT_COUPLE);
}

export function LoveQuestProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  const isOnline = useOnlineStatus();
  const { isPro } = useUserPlan();
  const { space, loading: coupleSpaceLoading, isFullyBound } = useCoupleSpace();
  const coupleId = space?.coupleId ?? null;
  const currentUserId = auth.user?.id ?? null;

  const [rewardCardSyncStatus, setRewardCardSyncStatus] = useState<RewardCardSyncStatus>('local');
  const [rewardCardSyncError, setRewardCardSyncError] = useState<string | null>(null);
  const [choreSyncStatus, setChoreSyncStatus] = useState<ChoreSyncStatus>('local');
  const [choreSyncError, setChoreSyncError] = useState<string | null>(null);
  const [coupleProfileSyncStatus, setCoupleProfileSyncStatus] =
    useState<CoupleProfileSyncStatus>('local');
  const [coupleProfileSyncError, setCoupleProfileSyncError] = useState<string | null>(null);

  const [coupleBase] = useState(loadCouple);
  const [rpg, setRpg] = useState(loadRpg);
  const [dinner, setDinner] = useState(loadDinner);
  const [housework, setHousework] = useState(loadHousework);
  const [tasks, setTasks] = useState(loadTasks);
  const [coupleExtended, setCoupleExtendedState] = useState(loadCoupleExtendedProfile);
  const [importantDateReminders, setImportantDateReminders] = useState(loadImportantDateReminders);

  const couple = useMemo(() => mergeCoupleProfile(coupleBase, coupleExtended), [coupleBase, coupleExtended]);
  const nicknameSetup = useMemo(() => getNicknameSetupStatus(coupleExtended), [coupleExtended]);

  const partnerUserId = useMemo(() => {
    if (!space || !currentUserId) return null;
    const other = space.members.find((m) => m.userId !== currentUserId);
    return other?.userId ?? null;
  }, [space, currentUserId]);

  const choreSyncCtx = useMemo(
    () => ({
      currentUserId,
      partnerUserId,
      myName: coupleExtended.myNickname.trim() || '我',
      partnerName: coupleExtended.partnerNickname.trim() || '另一半',
    }),
    [currentUserId, partnerUserId, coupleExtended.myNickname, coupleExtended.partnerNickname]
  );

  const logTodayActivity = useCallback(
    (input: Omit<ActivityLogInput, 'actorUserId' | 'coupleId' | 'source'>) => {
      addActivityLog(
        { ...input, actorUserId: currentUserId, coupleId, source: 'local' },
        { currentUserId, coupleExtended },
        { isPro }
      );
    },
    [coupleExtended, coupleId, currentUserId, isPro]
  );

  const choreSchedulerRef = useRef<ChoreSyncScheduler | null>(null);

  useEffect(() => {
    choreSchedulerRef.current?.dispose();
    choreSchedulerRef.current = createChoreSyncScheduler({
      debounceMs: 1500,
      canSync: () =>
        canSyncChores({
          configured: auth.configured,
          userId: currentUserId,
          coupleId,
          online: isOnline,
          isFullyBound,
        }),
      getSupabase: () => auth.supabase,
      getCoupleId: () => coupleId,
      getCtx: () => choreSyncCtx,
      onStatusChange: (status, error) => {
        setChoreSyncStatus(status);
        setChoreSyncError(error);
      },
      onHouseworkUpdated: (data) => setHousework(data),
    });
    if (
      canSyncChores({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      void choreSchedulerRef.current.pullFromRemoteIfIdle();
    } else {
      setChoreSyncStatus('local');
    }
    return () => {
      choreSchedulerRef.current?.dispose();
      choreSchedulerRef.current = null;
    };
  }, [
    auth.configured,
    auth.supabase,
    choreSyncCtx,
    coupleId,
    coupleSpaceLoading,
    currentUserId,
    isFullyBound,
    isOnline,
  ]);

  const scheduleChoreSync = useCallback((reason?: string) => {
    choreSchedulerRef.current?.scheduleChoreSync(reason);
  }, []);
  const [flirtGames, setFlirtGames] = useState(loadFlirtGames);
  const [completionHistory, setCompletionHistory] = useState(loadCompletionHistory);
  const [datePlanner, setDatePlanner] = useState(loadDatePlanner);
  const [anniversaries, setAnniversaries] = useState(loadAnniversaries);
  const [rewards, setRewards] = useState(loadRewards);
  const [activity, setActivity] = useState(loadActivity);
  const [draftPick, setDraftPick] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  const taskProgress = useMemo(() => dailyTaskProgress(tasks.dailyTasks), [tasks.dailyTasks]);
  const weeklyStats = useMemo(() => getWeeklyStats(housework.completions), [housework.completions]);
  const houseworkHomeStatus = useMemo(() => getHouseworkHomeStatus(housework), [housework]);

  const grantReward = useCallback((reward: RpgReward, log: string, coin?: CoinEarnMeta) => {
    setRpg((prev) => {
      const next = applyReward(normalizeRpgState(prev), reward);
      saveRpg(next);
      return next;
    });
    if (coin && (reward.loveCoins ?? 0) > 0) {
      setRewards((prev) => {
        const next = addCoinEarn(prev, reward.loveCoins ?? 0, coin);
        saveRewards(next);
        return next;
      });
    }
    setActivity(appendActivity(log));
  }, []);

  useEffect(() => {
    setRpg((prev) => {
      const { state: next, isNewDay } = processDailyLogin(prev);
      if (!isNewDay) return prev;
      const normalized = normalizeRpgState(next);
      const withBonus = applyReward(normalized, REWARDS.loginBonus);
      saveRpg(withBonus);
      return withBonus;
    });
  }, []);

  const addCompletion = useCallback(
    (kind: CompletionRecord['kind'], title: string, emoji: string, meta?: { gameId?: FlirtGameId; detail?: string }) => {
      const next = appendCompletion(kind, title, emoji, meta);
      setCompletionHistory(next);
    },
    []
  );

  const claimMiniGameReward = useCallback(
    (detail?: string): boolean => {
      const cap = getMiniGameDailyRewardCap(isPro);
      let granted = false;
      setRpg((prev) => {
        const rolled = rollDailyGuardForToday(normalizeRpgState(prev));
        const g = rolled.dailyGuard ?? defaultDailyGuard();
        const count = g.miniGamesRewardCount ?? 0;
        if (count >= cap) {
          return rolled === prev ? prev : rolled;
        }
        granted = true;
        const after = applyReward(rolled, REWARDS.miniGameComplete);
        const out: RpgState = {
          ...after,
          dailyGuard: {
            ...g,
            miniGamesRewardCount: count + 1,
          },
        };
        saveRpg(out);
        return out;
      });

      if (granted) {
        const coins = REWARDS.miniGameComplete.loveCoins ?? 0;
        if (coins > 0) {
          setRewards((rev) => {
            const n = addCoinEarn(rev, coins, {
              source: 'game',
              title: '情侶小遊戲',
              emoji: '🎲',
            });
            saveRewards(n);
            return n;
          });
        }
        setActivity(appendActivity('完成情侶小遊戲'));
        addCompletion('game', '情侶小遊戲', '🎲', detail ? { detail } : undefined);
        logTodayActivity({ actionType: 'complete', targetType: 'mini_game' });
      }

      return granted;
    },
    [addCompletion, isPro, logTodayActivity]
  );

  const rpgView = useMemo(
    () => ({
      ...rpgSnapshot(rpg),
      miniGamesRewardCap: getMiniGameDailyRewardCap(isPro),
    }),
    [rpg, isPro]
  );

  const pullDinnerFromCloud = useCallback(async () => {
    if (coupleSpaceLoading) return;
    if (!canSyncFoodOptions({
      configured: auth.configured,
      userId: auth.user?.id ?? null,
      coupleId,
      online: isOnline,
    })) {
      return;
    }
    if (!auth.supabase || !coupleId) return;
    try {
      const cur = loadDinner();
      const merged = await pullRemoteFoodOptions(auth.supabase, coupleId, cur);
      saveDinner(merged);
      setDinner(merged);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[food-sync] pull failed:', msg);
    }
  }, [auth.configured, auth.supabase, auth.user?.id, coupleId, coupleSpaceLoading, isOnline]);

  const syncDinnerFoodOptions = useCallback(async () => {
    if (!canSyncFoodOptions({
      configured: auth.configured,
      userId: auth.user?.id ?? null,
      coupleId,
      online: isOnline,
    })) {
      console.warn('[food-sync] sync skipped: 需要登入、情侶空間與網路');
      return;
    }
    if (!auth.supabase || !coupleId) return;
    try {
      const cur = loadDinner();
      await pushAllLocalDinnerOptions(auth.supabase, coupleId, cur);
      const merged = await pullRemoteFoodOptions(auth.supabase, coupleId, cur);
      saveDinner(merged);
      setDinner(merged);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[food-sync] sync failed:', msg);
    }
  }, [auth.configured, auth.supabase, auth.user?.id, coupleId, isOnline]);

  const addDinnerOption = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const newId = makeId();
      setDinner((prev) => {
        const next: DinnerData = {
          ...prev,
          options: [...prev.options, { id: newId, label: trimmed }],
        };
        saveDinner(next);
        console.log('[food-sync] local saved');
        const sortOrder = next.options.length - 1;
        const opt: DinnerOption = { id: newId, label: trimmed };
        if (
          canSyncFoodOptions({
            configured: auth.configured,
            userId: auth.user?.id ?? null,
            coupleId,
            online: isOnline,
          }) &&
          auth.supabase &&
          coupleId
        ) {
          console.log(`[food-sync] current couple_id = ${coupleId}`);
          void pushDinnerOptionToSupabase(auth.supabase, coupleId, opt, sortOrder).catch((e) => {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('[food-sync] push failed:', msg);
          });
        }
        return next;
      });
      logTodayActivity({
        actionType: 'create',
        targetType: 'dinner',
        targetTitle: trimmed,
      });
    },
    [auth.configured, auth.supabase, auth.user?.id, coupleId, isOnline, logTodayActivity]
  );

  const removeDinnerOption = useCallback(
    (id: string) => {
      setDinner((prev) => {
        const next = { ...prev, options: prev.options.filter((o) => o.id !== id) };
        saveDinner(next);
        console.log('[food-sync] local saved');
        if (
          canSyncFoodOptions({
            configured: auth.configured,
            userId: auth.user?.id ?? null,
            coupleId,
            online: isOnline,
          }) &&
          auth.supabase &&
          coupleId
        ) {
          void deleteFoodOptionRemote(auth.supabase, coupleId, id).catch((e) => {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('[food-sync] delete remote failed:', msg);
          });
        }
        return next;
      });
    },
    [auth.configured, auth.supabase, auth.user?.id, coupleId, isOnline]
  );

  const rollDinner = useCallback(() => {
    setDinner((prev) => {
      const picked = pickRandomOption(prev.options);
      const label = picked?.label ?? null;
      queueMicrotask(() => setDraftPick(label));
      return prev;
    });
  }, []);

  const setDinnerDraftPick = useCallback((label: string | null) => {
    setDraftPick(label);
  }, []);

  const saveDinnerResult = useCallback(
    (label?: string) => {
      const choice = (label ?? draftPick)?.trim();
      if (!choice) return;
      setDinner((prev) => {
        const next = saveTodayResult(prev, choice);
        saveDinner(next);
        return next;
      });
      setDraftPick(null);
      setRpg((prev) => {
        const rolled = rollDailyGuardForToday(normalizeRpgState(prev));
        const g = rolled.dailyGuard ?? defaultDailyGuard();
        if (g.dinnerRewardCount >= 2) {
          return rolled;
        }
        const after = applyReward(rolled, REWARDS.dinnerSaved);
        const out = {
          ...after,
          dailyGuard: {
            ...g,
            dinnerRewardCount: g.dinnerRewardCount + 1,
            anchorDate: todayKey(),
          },
        };
        saveRpg(out);
        return out;
      });
      setActivity(appendActivity(`今晚晚餐：${choice}`));
      logTodayActivity({
        actionType: 'complete',
        targetType: 'dinner',
        targetTitle: choice,
      });
    },
    [draftPick, logTodayActivity]
  );

  const addHouseworkItem = useCallback((label: string, emoji = '🏠') => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setHousework((prev) => {
      const next: HouseworkData = {
        ...prev,
        items: [...prev.items, { id: makeId(), label: trimmed, emoji, isActive: true, syncPending: true }],
      };
      saveHousework(next);
      scheduleChoreSync('add-item');
      logTodayActivity({
        actionType: 'create',
        targetType: 'chore',
        targetTitle: trimmed,
      });
      return next;
    });
  }, [logTodayActivity, scheduleChoreSync]);

  const removeHouseworkItem = useCallback(
    (id: string) => {
      if (
        canSyncChores({
          configured: auth.configured,
          userId: currentUserId,
          coupleId,
          online: isOnline,
          isFullyBound,
        }) &&
        auth.supabase &&
        coupleId
      ) {
        void auth.supabase
          .from('chores')
          .update({ is_active: false })
          .eq('couple_id', coupleId)
          .eq('local_id', id)
          .then(({ error }) => {
            if (error) console.warn('[chore-sync] deactivate chore failed:', error.message);
          });
      }
      setHousework((prev) => {
        let next = {
          ...prev,
          items: prev.items.filter((i) => i.id !== id),
          pendingSpin: null,
        };
        const ta = next.todayAssignment;
        if (ta) {
          next = {
            ...next,
            todayAssignment: {
              ...ta,
              selectedTaskIds: ta.selectedTaskIds.filter((tid) => tid !== id),
              chores: ta.chores.filter((c) => c.taskId !== id),
            },
          };
        }
        saveHousework(next);
        scheduleChoreSync('remove-item');
        return next;
      });
    },
    [auth.configured, auth.supabase, coupleId, currentUserId, isFullyBound, isOnline, scheduleChoreSync]
  );

  const setHouseworkSelectedTaskIdsFn = useCallback(
    (taskIds: string[]) => {
      setHousework((prev) => {
        const next = setSelectedTaskIds(prev, taskIds);
        saveHousework(next);
        scheduleChoreSync('select-tasks');
        return next;
      });
    },
    [scheduleChoreSync]
  );

  const startHouseworkAssignmentFn = useCallback((): boolean => {
    let ok = false;
    setHousework((prev) => {
      const next = startTodayAssignment(prev);
      if (!next) return prev;
      ok = true;
      saveHousework(next);
      scheduleChoreSync('start-assignment');
      return next;
    });
    if (ok) {
      logTodayActivity({ actionType: 'sync', targetType: 'chore' });
    }
    return ok;
  }, [logTodayActivity, scheduleChoreSync]);

  const completeHouseworkChoreFn = useCallback(
    (taskId: string) => {
      setHousework((prev) => {
        const { data: next, granted, item } = completeAssignedChore(prev, taskId, todayKey(), currentUserId);
        if (granted && item) {
          const assigneeName =
            next.todayAssignment?.chores.find((c) => c.taskId === taskId)?.assignee === 'A'
              ? coupleExtended.myNickname.trim() || '我'
              : coupleExtended.partnerNickname.trim() || '另一半';
          grantReward(REWARDS.houseworkChoreComplete, `${assigneeName} 完成「${item.label}」`, {
            source: 'housework',
            title: item.label,
            emoji: item.emoji,
          });
        }
        saveHousework(next);
        scheduleChoreSync('complete-chore');
        if (item) {
          logTodayActivity({
            actionType: 'complete',
            targetType: 'chore',
            targetTitle: item.label,
          });
        }
        return next;
      });
    },
    [
      coupleExtended.myNickname,
      coupleExtended.partnerNickname,
      currentUserId,
      grantReward,
      logTodayActivity,
      scheduleChoreSync,
    ]
  );

  const clearTodayHouseworkFn = useCallback(() => {
    setHousework((prev) => {
      const next = clearTodayAssignment(prev);
      saveHousework(next);
      scheduleChoreSync('clear-today');
      return next;
    });
  }, [scheduleChoreSync]);

  const reassignTodayHouseworkFn = useCallback((): boolean => {
    let ok = false;
    setHousework((prev) => {
      const next = reassignToday(prev);
      if (!next) return prev;
      ok = true;
      saveHousework(next);
      scheduleChoreSync('reassign');
      return next;
    });
    return ok;
  }, [scheduleChoreSync]);

  const patchImportantDateReminderFn = useCallback(
    (updater: (prev: ImportantDateRemindersData) => ImportantDateRemindersData) => {
      setImportantDateReminders((prev) => {
        const next = updater(prev);
        saveImportantDateReminders(next);
        return next;
      });
    },
    []
  );

  const pushCoupleProfileBackground = useCallback(
    async (profile: CoupleExtendedProfile) => {
      if (
        !canSyncCoupleProfile({
          configured: auth.configured,
          userId: currentUserId,
          coupleId,
          online: isOnline,
          isFullyBound,
        })
      ) {
        setCoupleProfileSyncStatus('local');
        return;
      }
      const sb = auth.supabase;
      if (!sb || !coupleId) return;

      setCoupleProfileSyncStatus('syncing');
      setCoupleProfileSyncError(null);
      try {
        const { serverUpdatedAt } = await getRemoteCoupleProfile(sb, coupleId);
        const result = await pushCoupleProfileToRemote(sb, coupleId, profile, serverUpdatedAt);
        if (result.conflict) {
          const row = await pullCoupleProfileFromRemote(sb, coupleId);
          const merged = mergeCoupleProfile(profile, row.profile);
          saveCoupleExtendedProfile(merged);
          setCoupleExtendedState(merged);
        }
        setCoupleProfileSyncStatus('synced');
      } catch (err) {
        console.error('[couple-profile-sync] background push failed:', err);
        setCoupleProfileSyncStatus('error');
        setCoupleProfileSyncError('同步失敗，稍後再試');
      }
    },
    [auth.configured, auth.supabase, coupleId, currentUserId, isFullyBound, isOnline]
  );

  const syncCoupleProfileFn = useCallback(async () => {
    if (
      !canSyncCoupleProfile({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      setCoupleProfileSyncStatus('local');
      setCoupleProfileSyncError(null);
      return;
    }
    const sb = auth.supabase;
    if (!sb || !coupleId) return;

    setCoupleProfileSyncStatus('syncing');
    setCoupleProfileSyncError(null);
    try {
      const result = await syncCoupleProfile(sb, coupleId);
      setCoupleExtendedState(result.merged);
      setCoupleProfileSyncStatus('synced');
    } catch (err) {
      console.error('[couple-profile-sync] sync failed:', err);
      setCoupleProfileSyncStatus('error');
      setCoupleProfileSyncError('同步失敗，稍後再試');
    }
  }, [auth.configured, auth.supabase, coupleId, currentUserId, isFullyBound, isOnline]);

  useEffect(() => {
    if (
      !canSyncCoupleProfile({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      setCoupleProfileSyncStatus('local');
      setCoupleProfileSyncError(null);
      return;
    }
    const sb = auth.supabase;
    if (!sb || !coupleId) return;

    let cancelled = false;
    void (async () => {
      try {
        const row = await pullCoupleProfileFromRemote(sb, coupleId);
        if (cancelled) return;
        const local = loadCoupleExtendedProfile();
        const merged = mergeCoupleProfile(local, row.profile);
        saveCoupleExtendedProfile(merged);
        setCoupleExtendedState(merged);
        setCoupleProfileSyncStatus('synced');
        setCoupleProfileSyncError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('[couple-profile-sync] pull on load failed:', err);
        setCoupleProfileSyncStatus('error');
        setCoupleProfileSyncError('同步失敗，稍後再試');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth.configured, auth.supabase, coupleId, currentUserId, isFullyBound, isOnline]);

  const setCoupleExtendedProfileFn = useCallback(
    (profile: CoupleExtendedProfile) => {
      const stamped = stampCoupleExtendedProfile(profile);
      setCoupleExtendedState((prev) => {
        saveCoupleExtendedProfile(stamped);
        const prevSnap = { ...prev };
        queueMicrotask(() => {
          let gave = false;
          setRpg((r0) => {
            if (!importantDatesKnowledgeIncreased(prevSnap, stamped)) return r0;
            const rolled = rollDailyGuardForToday(normalizeRpgState(r0));
            const g = rolled.dailyGuard ?? defaultDailyGuard();
            if (g.coupleProfileImportantRewardClaimed) return rolled;
            gave = true;
            const after = applyReward(rolled, REWARDS.coupleProfileImportant);
            const out = {
              ...after,
              dailyGuard: {
                ...g,
                coupleProfileImportantRewardClaimed: true,
                anchorDate: todayKey(),
              },
            };
            saveRpg(out);
            return out;
          });
          if (gave) {
            setActivity(appendActivity('情侶資料重要日子 · 獲得獎勵'));
          }
        });
        return stamped;
      });
      logTodayActivity({ actionType: 'update', targetType: 'couple_profile' });
      void pushCoupleProfileBackground(stamped);
    },
    [logTodayActivity, pushCoupleProfileBackground]
  );

  const rerollLoveTaskFn = useCallback((taskId: string) => {
    setTasks((prev) => {
      const next = replaceLoveTask(prev, taskId);
      saveTasks(next);
      return next;
    });
  }, []);

  const toggleDailyTaskFn = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const day = todayKey();
        const wasDone = prev.dailyTasks.find((t) => t.id === id)?.done ?? false;
        const { data: nextBase, task } = toggleDailyTask(prev, id);
        const claimedToday = prev.dailyRewardClaimedDate === day;
        let next = nextBase;

        if (task?.done && !wasDone) {
          if (!claimedToday) {
            grantReward(REWARDS.loveTaskComplete, `完成戀愛任務「${task.label}」`, {
              source: 'task',
              title: task.label,
              emoji: task.emoji,
            });
            addCompletion('task', task.label, task.emoji);
            next = { ...nextBase, dailyRewardClaimedDate: day };
          }
          logTodayActivity({ actionType: 'complete', targetType: 'love_task', targetTitle: task.label });
          saveTasks(next);
        } else {
          saveTasks(nextBase);
        }
        return next;
      });
    },
    [grantReward, addCompletion, logTodayActivity]
  );

  const startFlirtGame = useCallback((gameId: FlirtGameId) => {
    setFlirtGames((prev) => {
      const next = startGameSession(prev, gameId);
      saveFlirtGames(next);
      return next;
    });
  }, []);

  const rerollFlirtPrompt = useCallback(() => {
    setFlirtGames((prev) => {
      const gid = prev.activeSession?.gameId;
      if (!gid) return prev;
      const prompt = rollGamePrompt(gid, String(Date.now()));
      const next = {
        ...prev,
        activeSession: { ...prev.activeSession!, prompt },
      };
      saveFlirtGames(next);
      return next;
    });
  }, []);

  const completeFlirtGame = useCallback(() => {
    setFlirtGames((prev) => {
      const session = prev.activeSession;
      if (!session?.gameId) return prev;
      const gameId = session.gameId;
      const def = FLIRT_GAMES.find((g) => g.id === gameId);
      const alreadyDone = isGameDoneToday(prev, gameId);

      const next = markGameCompleted(prev, gameId);
      saveFlirtGames(next);

      if (!alreadyDone) {
        grantReward(REWARDS.flirtGameComplete, `完成小遊戲「${def?.title ?? gameId}」`, {
          source: 'game',
          title: def?.title ?? '曖昧小遊戲',
          emoji: def?.emoji ?? '🎮',
        });
      }
      addCompletion('game', def?.title ?? '曖昧小遊戲', def?.emoji ?? '🎮', {
        gameId,
        detail: session.prompt,
      });

      return next;
    });
  }, [grantReward, addCompletion]);

  const cancelFlirtGame = useCallback(() => {
    setFlirtGames((prev) => {
      const next = clearSession(prev);
      saveFlirtGames(next);
      return next;
    });
  }, []);

  const isFlirtGameDoneTodayFn = useCallback(
    (gameId: FlirtGameId) => isGameDoneToday(flirtGames, gameId),
    [flirtGames]
  );

  const setDateFilter = useCallback((key: DateFilterKey, on: boolean) => {
    setDatePlanner((prev) => {
      const next: DatePlannerData = {
        ...prev,
        filters: { ...prev.filters, [key]: on },
      };
      saveDatePlanner(next);
      return next;
    });
  }, []);

  const clearDateFilters = useCallback(() => {
    setDatePlanner((prev) => {
      const next: DatePlannerData = { ...prev, filters: DEFAULT_DATE_FILTERS() };
      saveDatePlanner(next);
      return next;
    });
  }, []);

  const generateDateIdea = useCallback(() => {
    let ok = false;
    setDatePlanner((prev) => {
      const suggestion = pickRandomDateIdea(prev.filters);
      if (!suggestion) return prev;
      ok = true;
      const next: DatePlannerData = { ...prev, current: suggestion };
      saveDatePlanner(next);
      return next;
    });
    return ok;
  }, []);

  const toggleDateFavoriteFn = useCallback((ideaId: string) => {
    setDatePlanner((prev) => {
      const next = toggleFavorite(prev, ideaId);
      saveDatePlanner(next);
      return next;
    });
  }, []);

  const completeCurrentDateFn = useCallback(() => {
    setDatePlanner((prev) => {
      const { data: next, entry } = completeCurrentDate(prev);
      if (!entry) return prev;
      saveDatePlanner(next);
      const captured = entry;
      queueMicrotask(() => {
        let grantRpg = false;
        setRpg((r0) => {
          const rolled = rollDailyGuardForToday(normalizeRpgState(r0));
          const g = rolled.dailyGuard ?? defaultDailyGuard();
          if (g.dateRewardClaimed) return rolled;
          grantRpg = true;
          const after = applyReward(rolled, REWARDS.dateComplete);
          const out = {
            ...after,
            dailyGuard: { ...g, dateRewardClaimed: true, anchorDate: todayKey() },
          };
          saveRpg(out);
          return out;
        });
        const coins = REWARDS.dateComplete.loveCoins ?? 0;
        if (grantRpg && coins > 0) {
          setRewards((rev) => {
            const n = addCoinEarn(rev, coins, {
              source: 'date',
              title: captured.title,
              emoji: captured.emoji,
            });
            saveRewards(n);
            return n;
          });
        }
        if (grantRpg) {
          setActivity(appendActivity(`完成約會「${captured.title}」`));
          addCompletion('date', captured.title, captured.emoji);
          logTodayActivity({
            actionType: 'complete',
            targetType: 'date_idea',
            targetTitle: captured.title,
          });
        }
      });
      return next;
    });
  }, [addCompletion, logTodayActivity]);

  const addAnniversaryFn = useCallback(
    (input: {
      name: string;
      date: string;
      type: AnniversaryEventType;
      note: string;
      repeatYearly: boolean;
    }) => {
      setAnniversaries((prev) => {
        const next = addAnniversaryEvent(prev, input);
        saveAnniversaries(next);
        return next;
      });
      logTodayActivity({
        actionType: 'create',
        targetType: 'important_date',
        targetTitle: input.name.trim(),
      });
    },
    [logTodayActivity]
  );

  const updateAnniversaryFn = useCallback(
    (
      id: string,
      input: Partial<{
        name: string;
        date: string;
        type: AnniversaryEventType;
        note: string;
        repeatYearly: boolean;
      }>
    ) => {
      let eventTitle = input.name?.trim() || '';
      setAnniversaries((prev) => {
        if (!eventTitle) {
          eventTitle = prev.events.find((e) => e.id === id)?.name ?? '重要日子';
        }
        const next = updateAnniversaryEvent(prev, id, input);
        saveAnniversaries(next);
        return next;
      });
      logTodayActivity({
        actionType: 'update',
        targetType: 'important_date',
        targetTitle: eventTitle,
      });
    },
    [logTodayActivity]
  );

  const removeAnniversaryFn = useCallback((id: string) => {
    setAnniversaries((prev) => {
      const next = removeAnniversaryEvent(prev, id);
      saveAnniversaries(next);
      return next;
    });
  }, []);

  const generateAnniversaryPlanFn = useCallback((eventId: string) => {
    setAnniversaries((prev) => {
      const event = prev.events.find((e) => e.id === eventId);
      if (!event) return prev;
      const plan = mockAnniversaryPlan(event);
      const next = savePlan(prev, eventId, plan);
      saveAnniversaries(next);
      return next;
    });
  }, []);

  const completeAnniversaryPlanFn = useCallback(
    (eventId: string) => {
      setAnniversaries((prev) => {
        const event = prev.events.find((e) => e.id === eventId);
        if (!event) return prev;
        const occ = getNextOccurrence(event);
        const year = occurrenceYear(event, occ);
        if (!canRewardPlan(event, year)) return prev;
        const next = markPlanRewarded(prev, eventId, year);
        saveAnniversaries(next);
        grantReward(REWARDS.anniversaryPlanComplete, `完成「${event.name}」紀念日規劃`, {
          source: 'anniversary',
          title: `${event.name} 規劃`,
          emoji: '✨',
        });
        addCompletion('anniversary', `${event.name} 規劃`, '✨');
        return next;
      });
    },
    [grantReward, addCompletion]
  );

  const markAnniversaryCelebratedFn = useCallback(
    (eventId: string) => {
      setAnniversaries((prev) => {
        const event = prev.events.find((e) => e.id === eventId);
        if (!event) return prev;
        const occ = getNextOccurrence(event);
        const year = occurrenceYear(event, occ);
        if (!canRewardCelebrate(event, year)) return prev;
        const next = markCelebrated(prev, eventId, year);
        saveAnniversaries(next);
        grantReward(REWARDS.anniversaryCelebrated, `慶祝「${event.name}」紀念日`, {
          source: 'anniversary',
          title: `${event.name} 慶祝`,
          emoji: '🎉',
        });
        addCompletion('anniversary', `${event.name} 慶祝`, '🎉');
        return next;
      });
    },
    [grantReward, addCompletion]
  );

  const updateGiftPrefsFn = useCallback((prefs: GiftPreferences) => {
    setAnniversaries((prev) => {
      const next = updateGiftPreferences(prev, prefs);
      saveAnniversaries(next);
      return next;
    });
  }, []);

  const generateGiftSuggestionsFn = useCallback(() => {
    setAnniversaries((prev) => {
      const suggestions = mockGiftSuggestions(prev.giftPreferences);
      const next = saveGiftSuggestions(prev, suggestions);
      saveAnniversaries(next);
      return next;
    });
  }, []);

  const dismissAnniversaryReminderFn = useCallback((reminderId: string) => {
    setAnniversaries((prev) => {
      const next = acknowledgeReminder(prev, reminderId);
      saveAnniversaries(next);
      return next;
    });
  }, []);

  const actorDisplayName = useCallback(
    (userId: string | null) =>
      displayNameForUserId(
        userId,
        currentUserId,
        coupleExtended.myNickname,
        coupleExtended.partnerNickname
      ),
    [currentUserId, coupleExtended.myNickname, coupleExtended.partnerNickname]
  );

  const pushCouponBackground = useCallback(
    (coupon: NonNullable<ReturnType<typeof redeemCoupon>['coupon']>) => {
      if (
        !canSyncRewardCards({
          configured: auth.configured,
          userId: currentUserId,
          coupleId,
          online: isOnline,
          isFullyBound,
        }) ||
        !auth.supabase ||
        !coupleId
      ) {
        setRewardCardSyncStatus('local');
        return;
      }
      setRewardCardSyncStatus('syncing');
      setRewardCardSyncError(null);
      void redeemRewardCard(auth.supabase, coupleId, coupon)
        .then((synced) => {
          setRewards((prev) => {
            const next = {
              ...prev,
              coupons: prev.coupons.map((c) => (c.id === synced.id ? synced : c)),
            };
            saveRewards(next);
            return next;
          });
          setRewardCardSyncStatus('synced');
          setRewardCardSyncError(null);
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : String(e);
          console.error('[reward-card-sync] push failed:', msg);
          setRewardCardSyncStatus('error');
          setRewardCardSyncError('同步失敗，稍後再試');
        });
    },
    [auth.configured, auth.supabase, coupleId, currentUserId, isFullyBound, isOnline]
  );

  const redeemRewardItemFn = useCallback(
    (itemId: ShopItemId): boolean => {
      const rpgPrev = loadRpg();
      const rewPrev = loadRewards();
      const result = redeemCoupon(rewPrev, itemId, rpgPrev.loveCoins, currentUserId);
      if (result.error || !result.coupon) return false;
      const nextRpg = normalizeRpgState({
        ...rpgPrev,
        loveCoins: rpgPrev.loveCoins - result.coupon.cost,
      });
      saveRpg(nextRpg);
      saveRewards(result.rewards);
      setRpg(nextRpg);
      setRewards(result.rewards);
      const name = actorDisplayName(currentUserId);
      setActivity(appendActivity(formatRedeemFeedLine(name, result.coupon.cardTitle)));
      logTodayActivity({
        actionType: 'redeem',
        targetType: 'reward_card',
        targetTitle: result.coupon.cardTitle,
      });
      pushCouponBackground(result.coupon);
      return true;
    },
    [actorDisplayName, currentUserId, logTodayActivity, pushCouponBackground]
  );

  const redeemCustomRewardItemFn = useCallback(
    (input: CustomRewardCardInput): boolean => {
      const rpgPrev = loadRpg();
      const rewPrev = loadRewards();
      const result = redeemCustomCoupon(rewPrev, input, rpgPrev.loveCoins, currentUserId);
      if (result.error || !result.coupon) return false;
      const nextRpg = normalizeRpgState({
        ...rpgPrev,
        loveCoins: rpgPrev.loveCoins - result.coupon.cost,
      });
      saveRpg(nextRpg);
      saveRewards(result.rewards);
      setRpg(nextRpg);
      setRewards(result.rewards);
      const name = actorDisplayName(currentUserId);
      setActivity(appendActivity(formatRedeemFeedLine(name, result.coupon.cardTitle)));
      logTodayActivity({
        actionType: 'redeem',
        targetType: 'reward_card',
        targetTitle: result.coupon.cardTitle,
      });
      pushCouponBackground(result.coupon);
      return true;
    },
    [actorDisplayName, currentUserId, logTodayActivity, pushCouponBackground]
  );

  const useCouponFn = useCallback(
    (couponId: string) => {
      const target = partnerUserId;
      setRewards((prev) => {
        const r = useRewardCardLocal(prev, couponId, currentUserId, target);
        if (r.error || !r.coupon) return prev;
        saveRewards(r.rewards);
        const towardPartner = couponNeedsPartnerCompletion(r.coupon) && Boolean(target);
        const name = actorDisplayName(currentUserId);
        setActivity(
          appendActivity(formatUseFeedLine(name, r.coupon.cardTitle, towardPartner))
        );
        logTodayActivity({
          actionType: 'use',
          targetType: 'reward_card',
          targetTitle: r.coupon.cardTitle,
        });
        if (
          canSyncRewardCards({
            configured: auth.configured,
            userId: currentUserId,
            coupleId,
            online: isOnline,
            isFullyBound,
          }) &&
          auth.supabase &&
          coupleId
        ) {
          setRewardCardSyncStatus('syncing');
          void pushUseRewardCardRemote(auth.supabase, coupleId, r.coupon)
            .then((synced) => {
              setRewards((p) => {
                const n = {
                  ...p,
                  coupons: p.coupons.map((c) => (c.id === synced.id ? synced : c)),
                };
                saveRewards(n);
                return n;
              });
              setRewardCardSyncStatus('synced');
              setRewardCardSyncError(null);
            })
            .catch((e) => {
              const msg = e instanceof Error ? e.message : String(e);
              console.error('[reward-card-sync] use push failed:', msg);
              setRewardCardSyncStatus('error');
              setRewardCardSyncError('同步失敗，稍後再試');
            });
        }
        return r.rewards;
      });
    },
    [
      actorDisplayName,
      auth.configured,
      auth.supabase,
      coupleId,
      currentUserId,
      isFullyBound,
      isOnline,
      logTodayActivity,
      partnerUserId,
    ]
  );

  const completeRewardCardFn = useCallback(
    (couponId: string) => {
      setRewards((prev) => {
        const r = completeRewardCardLocal(prev, couponId);
        if (r.error || !r.coupon) return prev;
        saveRewards(r.rewards);
        const name = actorDisplayName(currentUserId);
        setActivity(appendActivity(formatCompleteFeedLine(name, r.coupon.cardTitle)));
        logTodayActivity({
          actionType: 'complete',
          targetType: 'reward_card',
          targetTitle: r.coupon.cardTitle,
        });
        if (
          canSyncRewardCards({
            configured: auth.configured,
            userId: currentUserId,
            coupleId,
            online: isOnline,
            isFullyBound,
          }) &&
          auth.supabase &&
          coupleId
        ) {
          setRewardCardSyncStatus('syncing');
          void pushCompleteRewardCardRemote(auth.supabase, coupleId, r.coupon)
            .then((synced) => {
              setRewards((p) => {
                const n = {
                  ...p,
                  coupons: p.coupons.map((c) => (c.id === synced.id ? synced : c)),
                };
                saveRewards(n);
                return n;
              });
              setRewardCardSyncStatus('synced');
              setRewardCardSyncError(null);
            })
            .catch((e) => {
              const msg = e instanceof Error ? e.message : String(e);
              console.error('[reward-card-sync] complete push failed:', msg);
              setRewardCardSyncStatus('error');
              setRewardCardSyncError('同步失敗，稍後再試');
            });
        }
        return r.rewards;
      });
    },
    [
      actorDisplayName,
      auth.configured,
      auth.supabase,
      coupleId,
      currentUserId,
      isFullyBound,
      isOnline,
    ]
  );

  const runRewardCardCleanup = useCallback(
    async (syncRemote: boolean) => {
      const canRemote = syncRemote && Boolean(auth.supabase && coupleId);
      const { removedCount, rewards: cleaned } = await cleanupOldCompletedRewardCards(
        canRemote ? auth.supabase : null,
        coupleId,
        { syncRemote: canRemote }
      );
      if (removedCount > 0) {
        setRewards(cleaned);
      }
      return removedCount;
    },
    [auth.supabase, coupleId]
  );

  const cleanupOldCompletedRewardCardsFn = useCallback(async () => {
    const canRemote = canSyncRewardCards({
      configured: auth.configured,
      userId: currentUserId,
      coupleId,
      online: isOnline,
      isFullyBound,
    });
    return runRewardCardCleanup(canRemote);
  }, [
    auth.configured,
    coupleId,
    currentUserId,
    isFullyBound,
    isOnline,
    runRewardCardCleanup,
  ]);

  const pullRewardCardsFromCloud = useCallback(async () => {
    const canRemote = canSyncRewardCards({
      configured: auth.configured,
      userId: currentUserId,
      coupleId,
      online: isOnline,
      isFullyBound,
    });
    await runRewardCardCleanup(canRemote);

    if (coupleSpaceLoading) return;
    if (!canRemote) {
      setRewardCardSyncStatus('local');
      return;
    }
    if (!auth.supabase || !coupleId) return;
    setRewardCardSyncStatus('syncing');
    setRewardCardSyncError(null);
    try {
      const cur = loadRewards();
      const merged = await pullRewardCardsFromRemote(auth.supabase, coupleId, cur);
      saveRewards(merged);
      setRewards(merged);
      setRewardCardSyncStatus('synced');
      setRewardCardSyncError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[reward-card-sync] pull failed:', msg);
      setRewardCardSyncStatus('error');
      setRewardCardSyncError('同步失敗，稍後再試');
    }
  }, [
    auth.configured,
    auth.supabase,
    coupleId,
    coupleSpaceLoading,
    currentUserId,
    isFullyBound,
    isOnline,
    runRewardCardCleanup,
  ]);

  const syncRewardCards = useCallback(async () => {
    if (
      !canSyncRewardCards({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      setRewardCardSyncStatus('local');
      setRewardCardSyncError('需要登入、完成情侶綁定並連上網路才能同步');
      return;
    }
    if (!auth.supabase || !coupleId) return;
    setRewardCardSyncStatus('syncing');
    setRewardCardSyncError(null);
    try {
      const merged = await syncRewardCardsRemote(auth.supabase, coupleId);
      setRewards(merged);
      setRewardCardSyncStatus('synced');
      setRewardCardSyncError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[reward-card-sync] sync failed:', msg);
      setRewardCardSyncStatus('error');
      setRewardCardSyncError('同步失敗，稍後再試');
    }
  }, [auth.configured, auth.supabase, coupleId, currentUserId, isFullyBound, isOnline]);

  useEffect(() => {
    if (
      !canSyncRewardCards({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      setRewardCardSyncStatus('local');
      void runRewardCardCleanup(false);
      return;
    }
    if (!auth.supabase || !coupleId || coupleSpaceLoading) return;

    let cancelled = false;
    void (async () => {
      try {
        if (!cancelled) {
          await runRewardCardCleanup(true);
        }
        const cur = loadRewards();
        const merged = await pullRewardCardsFromRemote(auth.supabase!, coupleId, cur);
        if (cancelled) return;
        saveRewards(merged);
        setRewards(merged);
        setRewardCardSyncStatus('synced');
        setRewardCardSyncError(null);
      } catch (e) {
        if (cancelled) return;
        console.error('[reward-card-sync] auto pull failed:', e);
        setRewardCardSyncStatus('error');
        setRewardCardSyncError('同步失敗，稍後再試');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    auth.configured,
    auth.supabase,
    coupleId,
    coupleSpaceLoading,
    currentUserId,
    isFullyBound,
    isOnline,
    runRewardCardCleanup,
  ]);

  const completedCouponsSorted = useMemo(
    () => sortCompletedCoupons(getCouponsByStatus(rewards, 'completed')),
    [rewards]
  );

  const pullHouseworkFromCloud = useCallback(async () => {
    if (coupleSpaceLoading) return;
    await choreSchedulerRef.current?.pullFromRemoteIfIdle();
  }, [coupleSpaceLoading]);

  const syncHousework = useCallback(async () => {
    if (
      !canSyncChores({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      setChoreSyncStatus('local');
      setChoreSyncError('需要登入、完成情侶綁定並連上網路才能同步');
      return;
    }
    await choreSchedulerRef.current?.flushChoreSync();
  }, [auth.configured, coupleId, currentUserId, isFullyBound, isOnline]);

  const retryChoreSync = useCallback(() => {
    choreSchedulerRef.current?.retryChoreSync();
  }, []);

  const weeklyTitles = useMemo(
    () => getWeeklyTitles(weeklyStats, completionHistory, couple),
    [weeklyStats, completionHistory, couple]
  );

  const partnerName = useCallback(
    (id: PartnerId) => (id === 'A' ? couple.nameA : couple.nameB),
    [couple]
  );

  const partnerEmoji = useCallback(
    (id: PartnerId) => (id === 'A' ? couple.emojiA : couple.emojiB),
    [couple]
  );

  const value = useMemo<LoveQuestContextValue>(
    () => ({
      couple,
      nicknameSetup,
      rpg,
      rpgView,
      dinner,
      todayDinner: getTodayDinner(dinner.history),
      dinnerHistory: getRecentHistory(dinner.history),
      housework,
      houseworkHomeStatus,
      weeklyStats,
      tasks,
      taskProgress,
      coupleExtended,
      setCoupleExtendedProfile: setCoupleExtendedProfileFn,
      coupleProfileSyncStatus,
      coupleProfileSyncError,
      syncCoupleProfile: syncCoupleProfileFn,
      importantDateReminders,
      patchImportantDateReminder: patchImportantDateReminderFn,
      rerollLoveTask: rerollLoveTaskFn,
      flirtGames,
      flirtGameDefs: FLIRT_GAMES,
      completionHistory: getRecentCompletions(completionHistory),
      activity,
      draftPick,
      spinning,
      addDinnerOption,
      removeDinnerOption,
      rollDinner,
      setDinnerDraftPick,
      saveDinnerResult,
      pullDinnerFromCloud,
      syncDinnerFoodOptions,
      addHouseworkItem,
      removeHouseworkItem,
      setHouseworkSelectedTaskIds: setHouseworkSelectedTaskIdsFn,
      startHouseworkAssignment: startHouseworkAssignmentFn,
      completeHouseworkChore: completeHouseworkChoreFn,
      clearTodayHousework: clearTodayHouseworkFn,
      reassignTodayHousework: reassignTodayHouseworkFn,
      choreSyncStatus,
      choreSyncError,
      pullHouseworkFromCloud,
      syncHousework,
      retryChoreSync,
      toggleDailyTask: toggleDailyTaskFn,
      startFlirtGame,
      rerollFlirtPrompt,
      completeFlirtGame,
      claimMiniGameReward,
      cancelFlirtGame,
      isFlirtGameDoneToday: isFlirtGameDoneTodayFn,
      datePlanner,
      dateHistory: getRecentDateHistory(datePlanner.history),
      favoriteIdeas: getFavoriteIdeas(datePlanner.favoriteIds),
      setDateFilter,
      clearDateFilters,
      generateDateIdea,
      toggleDateFavorite: toggleDateFavoriteFn,
      completeCurrentDate: completeCurrentDateFn,
      anniversaries,
      upcomingAnniversaries: getUpcomingEvents(anniversaries.events, 20),
      nextAnniversary: getNextImportant(anniversaries.events),
      activeAnniversaryReminders: getActiveReminders(anniversaries),
      addAnniversary: addAnniversaryFn,
      updateAnniversary: updateAnniversaryFn,
      removeAnniversary: removeAnniversaryFn,
      generateAnniversaryPlan: generateAnniversaryPlanFn,
      completeAnniversaryPlan: completeAnniversaryPlanFn,
      markAnniversaryCelebrated: markAnniversaryCelebratedFn,
      updateGiftPrefs: updateGiftPrefsFn,
      generateGiftSuggestions: generateGiftSuggestionsFn,
      dismissAnniversaryReminder: dismissAnniversaryReminderFn,
      rewards,
      todayCoinEarned: rewards.todayEarnedDate === todayKey() ? rewards.todayEarnedCoins : 0,
      recentCoinEarns: getRecentEarns(rewards),
      weeklyTitles,
      activeCoupons: getActiveCoupons(rewards),
      usedCoupons: getUsedCoupons(rewards),
      redeemedCoupons: getCouponsByStatus(rewards, 'redeemed'),
      inProgressCoupons: getCouponsByStatus(rewards, 'used'),
      completedCoupons: getCouponsByStatus(rewards, 'completed'),
      completedCouponsSorted,
      rewardCardSyncStatus,
      rewardCardSyncError,
      redeemRewardItem: redeemRewardItemFn,
      redeemCustomRewardItem: redeemCustomRewardItemFn,
      useCoupon: useCouponFn,
      completeRewardCard: completeRewardCardFn,
      pullRewardCardsFromCloud,
      syncRewardCards,
      cleanupOldCompletedRewardCards: cleanupOldCompletedRewardCardsFn,
      partnerName,
      partnerEmoji,
    }),
    [
      couple,
      nicknameSetup,
      rpg,
      rpgView,
      dinner,
      housework,
      houseworkHomeStatus,
      weeklyStats,
      tasks,
      taskProgress,
      coupleExtended,
      importantDateReminders,
      setCoupleExtendedProfileFn,
      coupleProfileSyncStatus,
      coupleProfileSyncError,
      syncCoupleProfileFn,
      patchImportantDateReminderFn,
      rerollLoveTaskFn,
      flirtGames,
      completionHistory,
      datePlanner,
      anniversaries,
      rewards,
      weeklyTitles,
      activity,
      draftPick,
      spinning,
      addDinnerOption,
      removeDinnerOption,
      rollDinner,
      setDinnerDraftPick,
      saveDinnerResult,
      pullDinnerFromCloud,
      syncDinnerFoodOptions,
      addHouseworkItem,
      removeHouseworkItem,
      setHouseworkSelectedTaskIdsFn,
      startHouseworkAssignmentFn,
      completeHouseworkChoreFn,
      clearTodayHouseworkFn,
      reassignTodayHouseworkFn,
      choreSyncStatus,
      choreSyncError,
      pullHouseworkFromCloud,
      syncHousework,
      retryChoreSync,
      toggleDailyTaskFn,
      startFlirtGame,
      rerollFlirtPrompt,
      completeFlirtGame,
      claimMiniGameReward,
      cancelFlirtGame,
      isFlirtGameDoneTodayFn,
      setDateFilter,
      clearDateFilters,
      generateDateIdea,
      toggleDateFavoriteFn,
      completeCurrentDateFn,
      addAnniversaryFn,
      updateAnniversaryFn,
      removeAnniversaryFn,
      generateAnniversaryPlanFn,
      completeAnniversaryPlanFn,
      markAnniversaryCelebratedFn,
      updateGiftPrefsFn,
      generateGiftSuggestionsFn,
      dismissAnniversaryReminderFn,
      redeemRewardItemFn,
      redeemCustomRewardItemFn,
      useCouponFn,
      completeRewardCardFn,
      pullRewardCardsFromCloud,
      syncRewardCards,
      cleanupOldCompletedRewardCardsFn,
      completedCouponsSorted,
      rewardCardSyncStatus,
      rewardCardSyncError,
      partnerName,
      partnerEmoji,
    ]
  );

  return <LoveQuestContext.Provider value={value}>{children}</LoveQuestContext.Provider>;
}

export function useLoveQuest(): LoveQuestContextValue {
  const ctx = useContext(LoveQuestContext);
  if (!ctx) throw new Error('useLoveQuest must be used within LoveQuestProvider');
  return ctx;
}

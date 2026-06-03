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
  clearTodayDinnerResult,
  getActiveDinnerOptions,
  getDinnerHomeStatus,
  getRecentHistory,
  getTodayDinner,
  loadDinner,
  pickRandomOption,
  saveDinner,
  saveTodayResult,
  softRemoveDinnerOption,
} from '../storage/dinnerStore';
import {
  completePending,
  getWeeklyStats,
  completeAssignedChore,
  clearTodayAssignment,
  getHouseworkHomeStatus,
  getTodayAssignment,
  loadHousework,
  reassignToday,
  saveHousework,
  setSelectedTaskIds,
  startTodayAssignment,
} from '../storage/houseworkStore';
import {
  backfillChoreRewardClaimsFromHousework,
  evaluateChoreRewardGrant,
  hasChoreRewardClaim,
  tryClaimChoreReward,
} from '../storage/choreRewardClaimsStore';
import type { HouseworkHomeStatus } from '../storage/houseworkStore';
import {
  dailyTaskProgress,
  ensureTodayTasks,
  loadTasks,
  loadTasksWithLedgerSync,
  replaceLoveTask,
  saveTasks,
  toggleDailyTask,
} from '../storage/tasksStore';
import {
  getLoveTaskProgressFromLedger,
  getMiniGameRewardCount,
  getScopeRecord,
  isLedgerWritable,
  isLoveFlameRecordedToday,
  isLoveTaskAllCompleteClaimed,
  isLoveTaskSlotClaimed,
  LOVE_FLAME_MILESTONE_COINS,
  loveFlameDisplayFromScope,
  scopeToLoveFlameData,
  syncTasksRewardFlagsFromLedger,
  tryClaimFlameMilestone,
  tryClaimLoveTaskAllComplete,
  tryClaimLevel3Combo,
  isLevel3ComboClaimed,
  tryClaimLoveTaskSlot,
  tryClaimMiniGameReward,
  tryRecordLoveFlameToday,
  type LedgerContext,
} from '../storage/dailyRewardLedgerStore';
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
  addAnniversaryEvent,
  canRewardCelebrate,
  canRewardPlan,
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
  cancelUseRewardCardLocal,
  completeRewardCardLocal,
  filterMyCoupons,
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
  applyRemoteRewardRowsToRewards,
  canSyncRewardCards,
  cleanupOldCompletedRewardCards,
  completeRewardCard as pushCompleteRewardCardRemote,
  getRemoteRewardCards,
  redeemRewardCard,
  sortCompletedCoupons,
  syncRewardCards as syncRewardCardsRemote,
  useRewardCard as pushUseRewardCardRemote,
  type RewardCardSyncStatus,
} from '../services/rewardCardSync';
import { addActivityLog, registerActivityLogSyncScheduler } from '../services/activityLogService';
import { ENABLE_ACTIVITY_LOG_CLOUD_SYNC } from '../constants/activityLogSyncFlags';
import { canSyncActivityLogs } from '../services/activityLogSyncService';
import {
  createActivityLogSyncScheduler,
  type ActivityLogSyncScheduler,
} from '../services/activityLogSyncScheduler';
import { ENABLE_AI_FAVORITES_CLOUD_SYNC } from '../constants/aiFavoritesSyncFlags';
import { canSyncAiFavorites } from '../services/aiFavoritesSyncService';
import {
  createAiFavoritesSyncScheduler,
  type AiFavoritesSyncScheduler,
} from '../services/aiFavoritesSyncScheduler';
import {
  emitAiFavoritesSyncStatus,
  registerAiFavoritesRetrySync,
  registerAiFavoritesSyncScheduler,
} from '../storage/aiFavoritesStore';
import type { ActivityLogInput } from '../storage/activityLogTypes';
import { ENABLE_CHORE_ITEMS_CLOUD_SYNC } from '../constants/choreSyncFlags';
import {
  canSyncChoreItems,
  preserveLocalHouseworkAssignment,
  type ChoreSyncStatus,
} from '../services/choreSyncService';
import { createChoreSyncScheduler, type ChoreSyncScheduler } from '../services/choreSyncScheduler';
import {
  buildCoupleDisplayNames,
  resolveDisplayNameForUserId,
  type UserDisplayNameContext,
} from '../lib/coupleDisplayNames';
import { normalizeOwnedCoupon } from '../lib/rewardCardModel';
import {
  formatCompleteFeedLine,
  formatRedeemFeedLine,
  formatUseFeedLine,
} from '../lib/rewardCardHelpers';
import type { CustomRewardCardInput } from '../storage/rewardTypes';
import { getMiniGameDailyRewardCap } from '../lib/miniGameRewards';
import { getShopItem } from '../data/rewardShopCatalog';
import { normalizeCustomRewardInput } from '../lib/customRewardCard';
import { useCoupleSpace } from './CoupleSpaceContext';
import { useUserPlan } from './UserPlanContext';
import type { CoinEarnMeta, RewardsData, ShopItemId } from '../storage/rewardTypes';
import {
  applyReward,
  defaultDailyGuard,
  defaultRpgState,
  localOnlyRewardFields,
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
import { restoreLoveQuestRewardState } from '../lib/restoreLoveQuestRewardState';
import { STORAGE_USER_CHANGED_EVENT } from '../storage/storageSession';
import {
  choreCoinKey,
  dateCompleteCoinKey,
  flirtGameCoinKey,
  fallbackEarnCoinKey,
  loveFlameMilestoneKey,
  loveTaskAllCompleteKey,
  level3ComboCoinKey,
  weeklyChallengeCoinKey,
  miniGameCoinKey,
  redeemCoinKey,
  taskCoinKey,
} from '../lib/coinIdempotency';
import { canRerollLoveTask } from '../lib/loveTaskRewards';
import {
  LEVEL3_COMBO_LOVE_COINS,
  MIN_COUPLE_LEVEL_FOR_COMBO,
} from '../lib/level3ComboReward';
import {
  canSyncCoinWallet,
  getCachedCoinBalance,
  growthSnapshotToRpgFields,
  growthTransactionsToEarnHistory,
  hasGrowthDeltas,
  recordGrowthEvent,
  rewardToGrowthDeltas,
  type CoinWalletSyncStatus,
  type GrowthSnapshot,
} from '../services/coinWalletSyncService';
import {
  createCoinWalletSyncScheduler,
  type CoinWalletSyncScheduler,
} from '../services/coinWalletSyncScheduler';
import { loadCoinWalletCache, saveCoinWalletCache } from '../storage/coinWalletCache';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { ENABLE_DINNER_DECISION_CLOUD_SYNC } from '../constants/dinnerSyncFlags';
import { canSyncDinnerOptions, type DinnerSyncStatus } from '../services/dinnerSyncService';
import { createDinnerSyncScheduler, type DinnerSyncScheduler } from '../services/dinnerSyncScheduler';
import { touchDinnerOption } from '../storage/dinnerSyncMeta';

import {
  loadCoupleExtendedProfile,
  saveCoupleExtendedProfile,
  stampCoupleExtendedProfile,
} from '../storage/coupleExtendedStore';
import {
  canSyncCoupleProfile,
  getRemoteCoupleProfile,
  mergeCoupleExtendedProfile,
  pullCoupleProfileFromRemote,
  pushCoupleProfileToRemote,
  syncCoupleProfile,
  type CoupleProfileSyncContext,
  type CoupleProfileSyncStatus,
} from '../services/coupleProfileSyncService';
import {
  acknowledgeImportantDateReminder,
  loadImportantDateReminders,
  saveImportantDateReminders,
} from '../storage/importantDateRemindersStore';
import {
  computeImportantDateReminderBuckets,
  type ImportantDateScheduledReminder,
} from '../lib/importantDateReminderEngine';
import type { ImportantDateRemindersData } from '../storage/importantDateReminderTypes';
import { rescheduleLoveQuestImportantDateNotifications } from '../../services/notificationService';
import { importantDatesKnowledgeIncreased } from '../lib/coupleProfileImportantReward';
import { getNicknameSetupStatus, mergeCoupleProfile, type NicknameSetupStatus } from '../lib/coupleDisplayNames';
import { levelFromTotalExp } from '../lib/coupleLevel';
import { LevelUpModal } from '../components/LevelUpModal';
import {
  expClaimKey,
  getCoupleExpView,
  grantWeeklyChallengeExp,
  markLevelUpPopupShown,
  shouldShowLevelUpPopup,
  tryGrantCoupleExp,
  type CoupleExpView,
  type ExpGrantSource,
} from '../storage/coupleExpStore';
import {
  getWeeklyChallengeView,
  tryMarkWeeklyChallengeClaimed,
  type WeeklyChallengeView,
} from '../storage/weeklyChallengeStore';
import {
  getCoupleWeeklyRecapView,
  type CoupleWeeklyRecapView,
} from '../lib/coupleWeeklyRecap';

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
  /** Phase 3A：情侶 EXP 等級（與 LoveCoin 分離） */
  coupleExpView: CoupleExpView;
  /** Phase 3C：本週情侶挑戰 */
  weeklyChallengeView: WeeklyChallengeView;
  claimWeeklyChallengeReward: () => Promise<boolean>;
  /** Phase 3D：本週情侶回顧卡（Lv.5） */
  coupleWeeklyRecapView: CoupleWeeklyRecapView;
  dinner: DinnerData;
  dinnerOptions: DinnerOption[];
  todayDinner: ReturnType<typeof getTodayDinner>;
  dinnerHistory: ReturnType<typeof getRecentHistory>;
  dinnerHomeStatus: ReturnType<typeof getDinnerHomeStatus>;
  dinnerSyncStatus: DinnerSyncStatus;
  dinnerSyncError: string | null;
  dinnerCanSyncOptions: boolean;
  housework: HouseworkData;
  houseworkHomeStatus: HouseworkHomeStatus;
  weeklyStats: WeeklyHouseworkStats;
  tasks: TasksData;
  taskProgress: ReturnType<typeof dailyTaskProgress>;
  loveFlameView: ReturnType<typeof loveFlameDisplayFromScope> & {
    currentStreak: number;
    longestStreak: number;
    todayRecorded: boolean;
  };
  canRerollLoveTaskFor: (taskId: string) => boolean;
  /** 帳本：今日戀愛任務槽位是否已領獎（localStorage，防刷） */
  isLoveTaskSlotRewardClaimed: (slotIndex: number) => boolean;
  isLoveTaskAllCompleteRewardClaimed: () => boolean;
  isLevel3ComboClaimedToday: () => boolean;
  /** Lv.3 連擊加成剛領取時的提示（完成 2/2 後） */
  level3ComboNotice: { coins: number; expGranted: number } | null;
  clearLevel3ComboNotice: () => void;
  /** 已登入且可寫入每日獎勵帳本（未登入時完成互動不發獎） */
  canEarnDailyRewards: boolean;
  coupleExtended: CoupleExtendedProfile;
  /** 全站一致：我／另一半顯示名 */
  displayNames: { me: string; partner: string };
  displayNameForUser: (userId: string | null | undefined) => string;
  setCoupleExtendedProfile: (profile: CoupleExtendedProfile) => void;
  coupleProfileSyncStatus: CoupleProfileSyncStatus;
  coupleProfileSyncError: string | null;
  syncCoupleProfile: () => Promise<void>;
  importantDateReminders: ImportantDateRemindersData;
  patchImportantDateReminder: (
    updater: (prev: ImportantDateRemindersData) => ImportantDateRemindersData
  ) => void;
  /** 重新排程 iOS/Android 本機推播（重要日子） */
  rescheduleImportantDatePush: () => Promise<void>;
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
  clearTodayDinnerResult: () => void;
  pullDinnerFromCloud: () => Promise<void>;
  syncDinnerFoodOptions: () => Promise<void>;
  retryDinnerSync: () => void;
  addHouseworkItem: (label: string, emoji?: string) => void;
  removeHouseworkItem: (id: string) => void;
  setHouseworkSelectedTaskIds: (taskIds: string[]) => void;
  startHouseworkAssignment: () => boolean;
  completeHouseworkChore: (taskId: string) => {
    granted: boolean;
    rewardAlreadyClaimed: boolean;
    dailyLimitReached: boolean;
  };
  clearTodayHousework: () => void;
  reassignTodayHousework: () => boolean;
  choreSyncStatus: ChoreSyncStatus;
  choreSyncError: string | null;
  choreCanSyncItems: boolean;
  pullHouseworkFromCloud: () => Promise<void>;
  syncHousework: () => Promise<void>;
  retryChoreSync: () => void;
  pullActivityLogsFromCloud: () => Promise<void>;
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
  /** 依 offsets 計算：今天應顯示的 App 內提醒 */
  todayImportantDateReminders: ImportantDateScheduledReminder[];
  futureImportantDateReminders: ImportantDateScheduledReminder[];
  /** @deprecated 請用 todayImportantDateReminders */
  activeAnniversaryReminders: ImportantDateScheduledReminder[];
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
  dismissImportantDateReminder: (reminderId: string) => void;
  /** @deprecated 請用 dismissImportantDateReminder */
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
  /** 剛兌換的卡券 id（卡券頁捲動／高亮） */
  highlightCouponId: string | null;
  clearHighlightCoupon: () => void;
  redeemRewardItem: (itemId: ShopItemId) => Promise<RewardRedeemResult>;
  redeemCustomRewardItem: (input: CustomRewardCardInput) => Promise<RewardRedeemResult>;
  useCoupon: (couponId: string) => void;
  cancelRewardCardUse: (couponId: string) => void;
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

export type RewardRedeemResult = { ok: true; couponId: string } | { ok: false };

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
  const [highlightCouponId, setHighlightCouponId] = useState<string | null>(null);
  const clearHighlightCoupon = useCallback(() => setHighlightCouponId(null), []);
  const [choreSyncStatus, setChoreSyncStatus] = useState<ChoreSyncStatus>('local');
  const [choreSyncError, setChoreSyncError] = useState<string | null>(null);
  const [dinnerSyncStatus, setDinnerSyncStatus] = useState<DinnerSyncStatus>('local');
  const [dinnerSyncError, setDinnerSyncError] = useState<string | null>(null);
  const [coupleProfileSyncStatus, setCoupleProfileSyncStatus] =
    useState<CoupleProfileSyncStatus>('local');
  const [coupleProfileSyncError, setCoupleProfileSyncError] = useState<string | null>(null);
  const [coinWalletSyncStatus, setCoinWalletSyncStatus] =
    useState<CoinWalletSyncStatus>('local');
  const [coinWalletSyncError, setCoinWalletSyncError] = useState<string | null>(null);

  const [coupleBase] = useState(loadCouple);
  const [rpg, setRpg] = useState(loadRpg);
  const [dinner, setDinner] = useState(loadDinner);
  const [housework, setHousework] = useState(loadHousework);

  useEffect(() => {
    backfillChoreRewardClaimsFromHousework(loadHousework());
  }, []);
  const ledgerCtx = useMemo<LedgerContext>(
    () => ({ userId: currentUserId, coupleId }),
    [currentUserId, coupleId]
  );
  const [ledgerRevision, setLedgerRevision] = useState(0);
  const bumpLedger = useCallback(() => setLedgerRevision((n) => n + 1), []);
  const [expRevision, setExpRevision] = useState(0);
  const bumpExp = useCallback(() => setExpRevision((n) => n + 1), []);
  const [pendingLevelUp, setPendingLevelUp] = useState<number | null>(null);
  const [level3ComboNotice, setLevel3ComboNotice] = useState<{
    coins: number;
    expGranted: number;
  } | null>(null);
  const clearLevel3ComboNotice = useCallback(() => setLevel3ComboNotice(null), []);

  const [tasks, setTasks] = useState(() =>
    loadTasks(
      isPro,
      { userId: currentUserId, coupleId },
      getCoupleExpView({ userId: currentUserId, coupleId }).level
    )
  );
  const [coupleExtended, setCoupleExtendedState] = useState(loadCoupleExtendedProfile);
  const [importantDateReminders, setImportantDateReminders] = useState(loadImportantDateReminders);

  const couple = useMemo(() => mergeCoupleProfile(coupleBase, coupleExtended), [coupleBase, coupleExtended]);
  const nicknameSetup = useMemo(() => getNicknameSetupStatus(coupleExtended), [coupleExtended]);

  const partnerUserId = useMemo(() => {
    if (!space || !currentUserId) return null;
    const other = space.members.find((m) => m.userId !== currentUserId);
    return other?.userId ?? null;
  }, [space, currentUserId]);

  const displayNameContext = useMemo<UserDisplayNameContext>(
    () => ({
      currentUserId,
      partnerUserId,
      user: auth.user,
      profile: auth.profile,
      coupleExtended,
    }),
    [auth.profile, auth.user, coupleExtended, currentUserId, partnerUserId]
  );

  const displayNames = useMemo(
    () => buildCoupleDisplayNames(displayNameContext),
    [displayNameContext]
  );

  const choreSyncCtx = useMemo(
    () => ({
      currentUserId,
      partnerUserId,
      myName: displayNames.me,
      partnerName: displayNames.partner,
    }),
    [currentUserId, displayNames.me, displayNames.partner, partnerUserId]
  );

  const coupleProfileSyncCtx = useMemo<CoupleProfileSyncContext>(
    () => ({ currentUserId, partnerUserId }),
    [currentUserId, partnerUserId]
  );

  const logTodayActivity = useCallback(
    (input: Omit<ActivityLogInput, 'actorUserId' | 'coupleId' | 'source'>) => {
      addActivityLog(
        { ...input, actorUserId: currentUserId, coupleId, source: 'local' },
        displayNameContext,
        { isPro }
      );
    },
    [coupleId, currentUserId, displayNameContext, isPro]
  );

  const displayNameForUser = useCallback(
    (userId: string | null | undefined) => resolveDisplayNameForUserId(userId, displayNameContext),
    [displayNameContext]
  );

  const actorDisplayName = displayNameForUser;

  const choreSchedulerRef = useRef<ChoreSyncScheduler | null>(null);
  const dinnerSchedulerRef = useRef<DinnerSyncScheduler | null>(null);
  const activityLogSchedulerRef = useRef<ActivityLogSyncScheduler | null>(null);
  const aiFavoritesSchedulerRef = useRef<AiFavoritesSyncScheduler | null>(null);
  const coinWalletSchedulerRef = useRef<CoinWalletSyncScheduler | null>(null);

  const canSyncWallet = useMemo(
    () =>
      canSyncCoinWallet({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      }),
    [auth.configured, coupleId, currentUserId, isFullyBound, isOnline]
  );

  const applyGrowthSnapshot = useCallback(
    (snapshot: GrowthSnapshot) => {
    const cloudFields = growthSnapshotToRpgFields(snapshot);
    const expView = getCoupleExpView(ledgerCtx);
    setRpg((prev) => {
      const mergedXp = Math.max(expView.totalExp, cloudFields.xp ?? 0);
      const next = normalizeRpgState({
        ...prev,
        ...cloudFields,
        xp: mergedXp,
        level: levelFromTotalExp(mergedXp),
      });
      saveRpg(next);
      return next;
    });
    const cache = loadCoinWalletCache();
    setRewards((prev) => {
      const next = {
        ...prev,
        earnHistory: growthTransactionsToEarnHistory(cache.userCoinTransactions),
      };
      saveRewards(next);
      return next;
    });
  },
    [ledgerCtx, expRevision]
  );

  const syncRpgExpFromStore = useCallback((totalExp: number) => {
    const level = levelFromTotalExp(totalExp);
    setRpg((prev) => {
      const normalized = normalizeRpgState(prev);
      if (normalized.xp === totalExp && normalized.level === level) return prev;
      const next = { ...normalized, xp: totalExp, level };
      saveRpg(next);
      return next;
    });
  }, []);

  const applyExpGrant = useCallback(
    (source: ExpGrantSource) => {
      const day = todayKey();
      const result = tryGrantCoupleExp(ledgerCtx, source, day);
      if (result.granted <= 0) return result;
      bumpExp();
      syncRpgExpFromStore(result.totalExp);
      if (result.newLevel > result.previousLevel) {
        let highestUnshown: number | null = null;
        for (let lv = result.previousLevel + 1; lv <= result.newLevel; lv++) {
          if (shouldShowLevelUpPopup(ledgerCtx, lv)) highestUnshown = lv;
        }
        if (highestUnshown != null) {
          for (let lv = result.previousLevel + 1; lv <= result.newLevel; lv++) {
            markLevelUpPopupShown(ledgerCtx, lv);
          }
          setPendingLevelUp((prev) =>
            prev == null || highestUnshown > prev ? highestUnshown : prev
          );
        }
      }
      if (canSyncWallet && coupleId && currentUserId) {
        const key = `exp:${day}:${expClaimKey(source)}`;
        void recordGrowthEvent(auth.supabase, true, {
          coupleId,
          userId: currentUserId,
          txType: 'earn',
          source: 'task',
          idempotencyKey: key,
          expDelta: result.granted,
          loveCoinDelta: 0,
          heartDelta: 0,
          bondDelta: 0,
        }).then((res) => {
          if (res.ok) applyGrowthSnapshot(res.snapshot);
        });
      }
      return result;
    },
    [
      applyGrowthSnapshot,
      auth.supabase,
      bumpExp,
      canSyncWallet,
      coupleId,
      currentUserId,
      ledgerCtx,
      syncRpgExpFromStore,
    ]
  );

  const hydrateRewardState = useCallback(() => {
    if (!currentUserId) return;
    const legacyXp = loadRpg().xp;
    const { totalExp } = restoreLoveQuestRewardState(ledgerCtx, { legacyRpgXp: legacyXp });
    bumpExp();
    bumpLedger();
    syncRpgExpFromStore(totalExp);
    setTasks(loadTasksWithLedgerSync(isPro, ledgerCtx, levelFromTotalExp(totalExp)));
    if (canSyncWallet) {
      const cachedCoins = getCachedCoinBalance();
      setRpg((prev) => {
        const normalized = normalizeRpgState(prev);
        if (normalized.loveCoins === cachedCoins) return prev;
        const next = { ...normalized, loveCoins: cachedCoins };
        saveRpg(next);
        return next;
      });
    }
  }, [
    bumpExp,
    bumpLedger,
    canSyncWallet,
    currentUserId,
    isPro,
    ledgerCtx,
    syncRpgExpFromStore,
  ]);

  useEffect(() => {
    if (!isLedgerWritable(ledgerCtx)) return;
    hydrateRewardState();
  }, [ledgerCtx, coupleId, currentUserId, hydrateRewardState]);

  useEffect(() => {
    const onStorageUser = () => {
      if (!currentUserId) {
        setRpg(normalizeRpgState(defaultRpgState()));
        return;
      }
      setRpg(normalizeRpgState(loadRpg()));
      hydrateRewardState();
    };
    window.addEventListener(STORAGE_USER_CHANGED_EVENT, onStorageUser);
    return () => window.removeEventListener(STORAGE_USER_CHANGED_EVENT, onStorageUser);
  }, [currentUserId, hydrateRewardState]);

  const coupleExpView = useMemo(
    () => getCoupleExpView(ledgerCtx, todayKey()),
    [ledgerCtx, expRevision]
  );

  const [weeklyChallengeRevision, setWeeklyChallengeRevision] = useState(0);
  const bumpWeeklyChallenge = useCallback(
    () => setWeeklyChallengeRevision((n) => n + 1),
    []
  );

  const weeklyChallengeView = useMemo(
    () => getWeeklyChallengeView(ledgerCtx, coupleExpView.level, isPro),
    [ledgerCtx, coupleExpView.level, isPro, ledgerRevision, weeklyChallengeRevision]
  );

  const coupleWeeklyRecapView = useMemo(
    () => getCoupleWeeklyRecapView(ledgerCtx, coupleExpView.level, isPro),
    [ledgerCtx, coupleExpView.level, isPro, ledgerRevision, expRevision]
  );

  useEffect(() => {
    choreSchedulerRef.current?.dispose();
    choreSchedulerRef.current = createChoreSyncScheduler({
      debounceMs: 1500,
      canSync: () =>
        canSyncChoreItems({
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
      onHouseworkUpdated: (incoming) => {
        setHousework((prev) => preserveLocalHouseworkAssignment(incoming, prev));
      },
    });
    if (
      ENABLE_CHORE_ITEMS_CLOUD_SYNC &&
      canSyncChoreItems({
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
      setChoreSyncError(null);
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

  const wasOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!ENABLE_CHORE_ITEMS_CLOUD_SYNC) return;
    const cameOnline = !wasOnlineRef.current && isOnline;
    wasOnlineRef.current = isOnline;
    if (
      cameOnline &&
      canSyncChoreItems({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      void choreSchedulerRef.current?.pullFromRemoteIfIdle({ force: true });
    }
  }, [auth.configured, coupleId, currentUserId, isFullyBound, isOnline]);

  useEffect(() => {
    dinnerSchedulerRef.current?.dispose();
    dinnerSchedulerRef.current = createDinnerSyncScheduler({
      debounceMs: 1500,
      canSync: () =>
        canSyncDinnerOptions({
          configured: auth.configured,
          userId: currentUserId,
          coupleId,
          online: isOnline,
          isFullyBound,
        }),
      getSupabase: () => auth.supabase,
      getCoupleId: () => coupleId,
      getUserId: () => currentUserId,
      onStatusChange: (status, error) => {
        setDinnerSyncStatus(status);
        setDinnerSyncError(error);
      },
      onDinnerUpdated: (incoming) => {
        setDinner((prev) => ({
          ...incoming,
          history: ENABLE_DINNER_DECISION_CLOUD_SYNC ? incoming.history : prev.history,
        }));
      },
    });
    if (
      canSyncDinnerOptions({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      void dinnerSchedulerRef.current.pullFromRemoteIfIdle();
    } else {
      setDinnerSyncStatus('local');
    }
    return () => {
      dinnerSchedulerRef.current?.dispose();
      dinnerSchedulerRef.current = null;
    };
  }, [auth.configured, auth.supabase, coupleId, currentUserId, isFullyBound, isOnline]);

  const scheduleDinnerSync = useCallback((reason?: string) => {
    dinnerSchedulerRef.current?.scheduleDinnerSync(reason);
  }, []);

  useEffect(() => {
    activityLogSchedulerRef.current?.dispose();
    const scheduler = createActivityLogSyncScheduler({
      debounceMs: 800,
      canSync: () =>
        canSyncActivityLogs({
          configured: auth.configured,
          userId: currentUserId,
          coupleId,
          online: isOnline,
          isFullyBound,
        }),
      getSupabase: () => auth.supabase,
      getCoupleId: () => coupleId,
      getIsPro: () => isPro,
      onStatusChange: () => {},
    });
    activityLogSchedulerRef.current = scheduler;
    registerActivityLogSyncScheduler(scheduler.scheduleActivityLogSync);

    if (
      ENABLE_ACTIVITY_LOG_CLOUD_SYNC &&
      canSyncActivityLogs({
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
      registerActivityLogSyncScheduler(null);
      scheduler.dispose();
      activityLogSchedulerRef.current = null;
    };
  }, [
    auth.configured,
    auth.supabase,
    coupleId,
    currentUserId,
    isFullyBound,
    isOnline,
    isPro,
  ]);

  useEffect(() => {
    aiFavoritesSchedulerRef.current?.dispose();
    const scheduler = createAiFavoritesSyncScheduler({
      debounceMs: 400,
      canSync: () =>
        canSyncAiFavorites({
          configured: auth.configured,
          userId: currentUserId,
          online: isOnline,
        }),
      getSupabase: () => auth.supabase,
      getUserId: () => currentUserId,
      onStatusChange: (status, error) => {
        emitAiFavoritesSyncStatus(status, error);
      },
    });
    aiFavoritesSchedulerRef.current = scheduler;
    registerAiFavoritesSyncScheduler(scheduler.scheduleAiFavoritesSync);
    registerAiFavoritesRetrySync(scheduler.retrySync);

    if (
      ENABLE_AI_FAVORITES_CLOUD_SYNC &&
      canSyncAiFavorites({
        configured: auth.configured,
        userId: currentUserId,
        online: isOnline,
      })
    ) {
      void scheduler.pullFromRemote();
    }

    return () => {
      registerAiFavoritesSyncScheduler(null);
      registerAiFavoritesRetrySync(null);
      scheduler.dispose();
      aiFavoritesSchedulerRef.current = null;
    };
  }, [auth.configured, auth.supabase, currentUserId, isOnline]);

  const wasAiFavoritesOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!ENABLE_AI_FAVORITES_CLOUD_SYNC) return;
    const cameOnline = !wasAiFavoritesOnlineRef.current && isOnline;
    wasAiFavoritesOnlineRef.current = isOnline;
    if (
      cameOnline &&
      canSyncAiFavorites({
        configured: auth.configured,
        userId: currentUserId,
        online: isOnline,
      })
    ) {
      void aiFavoritesSchedulerRef.current?.pullFromRemote();
      aiFavoritesSchedulerRef.current?.scheduleAiFavoritesSync('online');
    }
  }, [auth.configured, currentUserId, isOnline]);

  useEffect(() => {
    coinWalletSchedulerRef.current?.dispose();
    const scheduler = createCoinWalletSyncScheduler({
      canSync: () => canSyncWallet,
      getSupabase: () => auth.supabase,
      getCoupleId: () => coupleId,
      getUserId: () => currentUserId,
      getLocalRpg: () => {
        const r = loadRpg();
        return {
          loveCoins: r.loveCoins,
          heartPoints: r.heartPoints,
          compatibility: r.compatibility,
          xp: r.xp,
        };
      },
      onGrowthApplied: applyGrowthSnapshot,
      onStatusChange: (status, error) => {
        setCoinWalletSyncStatus(status);
        setCoinWalletSyncError(error);
      },
    });
    coinWalletSchedulerRef.current = scheduler;
    return () => {
      scheduler.dispose();
      coinWalletSchedulerRef.current = null;
    };
  }, [
    applyGrowthSnapshot,
    auth.supabase,
    canSyncWallet,
    coupleId,
    currentUserId,
  ]);

  const pullActivityLogsFromCloud = useCallback(async () => {
    await (activityLogSchedulerRef.current?.pullFromRemoteIfIdle() ?? Promise.resolve());
  }, []);

  const wasActivityOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!ENABLE_ACTIVITY_LOG_CLOUD_SYNC) return;
    const cameOnline = !wasActivityOnlineRef.current && isOnline;
    wasActivityOnlineRef.current = isOnline;
    if (
      cameOnline &&
      canSyncActivityLogs({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      })
    ) {
      void activityLogSchedulerRef.current?.pullFromRemoteIfIdle();
    }
  }, [auth.configured, coupleId, currentUserId, isFullyBound, isOnline]);

  const [flirtGames, setFlirtGames] = useState(loadFlirtGames);
  const [completionHistory, setCompletionHistory] = useState(loadCompletionHistory);
  const [datePlanner, setDatePlanner] = useState(loadDatePlanner);
  const [anniversaries, setAnniversaries] = useState(loadAnniversaries);
  const [rewards, setRewards] = useState(loadRewards);
  const [activity, setActivity] = useState(loadActivity);
  const [draftPick, setDraftPick] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  const taskProgress = useMemo(() => {
    const fromLedger = getLoveTaskProgressFromLedger(ledgerCtx);
    const fromTasks = dailyTaskProgress(tasks.dailyTasks);
    const done = Math.max(fromLedger.done, fromTasks.done);
    const total = fromLedger.total || fromTasks.total || 2;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [ledgerCtx, ledgerRevision, tasks.dailyTasks]);


  useEffect(() => {
    if (!ledgerCtx.userId) return;
    setTasks((prev) => {
      const next = syncTasksRewardFlagsFromLedger(
        ledgerCtx,
        ensureTodayTasks(prev, isPro, coupleExpView.level)
      );
      saveTasks(next);
      return next;
    });
  }, [isPro, coupleExpView.level, ledgerCtx, ledgerRevision]);

  const ledgerScope = useMemo(
    () => getScopeRecord(ledgerCtx),
    [ledgerCtx, ledgerRevision]
  );

  const loveFlameView = useMemo(() => {
    const flame = scopeToLoveFlameData(ledgerScope);
    const display = loveFlameDisplayFromScope(ledgerScope);
    return {
      ...display,
      currentStreak: flame.currentStreak,
      longestStreak: flame.longestStreak,
      todayRecorded: display.todayRecorded,
    };
  }, [ledgerScope]);

  const isLoveTaskSlotRewardClaimed = useCallback(
    (slotIndex: number) => isLoveTaskSlotClaimed(ledgerCtx, todayKey(), slotIndex),
    [ledgerCtx, ledgerRevision]
  );

  const isLoveTaskAllCompleteRewardClaimed = useCallback(
    () => isLoveTaskAllCompleteClaimed(ledgerCtx, todayKey()),
    [ledgerCtx, ledgerRevision]
  );

  const isLevel3ComboClaimedToday = useCallback(
    () => isLevel3ComboClaimed(ledgerCtx, todayKey()),
    [ledgerCtx, ledgerRevision]
  );

  const canRerollLoveTaskFor = useCallback(
    (taskId: string) => canRerollLoveTask(tasks, taskId, isPro),
    [tasks, isPro]
  );

  const canEarnDailyRewards = useMemo(() => isLedgerWritable(ledgerCtx), [ledgerCtx]);
  const weeklyStats = useMemo(() => getWeeklyStats(housework.completions), [housework.completions]);
  const houseworkHomeStatus = useMemo(() => getHouseworkHomeStatus(housework), [housework]);
  const choreCanSyncItems = useMemo(
    () =>
      canSyncChoreItems({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      }),
    [auth.configured, coupleId, currentUserId, isFullyBound, isOnline]
  );
  const dinnerOptions = useMemo(() => getActiveDinnerOptions(dinner.options), [dinner.options]);
  const dinnerHomeStatus = useMemo(() => getDinnerHomeStatus(dinner.history), [dinner.history]);
  const dinnerCanSyncOptions = useMemo(
    () =>
      canSyncDinnerOptions({
        configured: auth.configured,
        userId: currentUserId,
        coupleId,
        online: isOnline,
        isFullyBound,
      }),
    [auth.configured, coupleId, currentUserId, isFullyBound, isOnline]
  );

  const formatLoveCoinActivityMessage = useCallback(
    (delta: number, title?: string) => {
      const who = actorDisplayName(currentUserId);
      const label = title?.trim() || '互動';
      if (delta > 0) return `${who} ${label} +${delta} LoveCoin`;
      return `${who} 兌換了${label} ${delta} LoveCoin`;
    },
    [actorDisplayName, currentUserId]
  );

  const grantReward = useCallback(
    (
      reward: RpgReward,
      log: string,
      coin?: CoinEarnMeta,
      idempotencyKey?: string,
      options?: { skipRpg?: boolean }
    ) => {
      const rewardForRpg = { ...reward, xp: 0 };
      const deltas = rewardToGrowthDeltas(rewardForRpg);
      const useCloud = canSyncWallet && coupleId && hasGrowthDeltas(deltas);
      const localFields = localOnlyRewardFields(reward);
      const hasLocalFields =
        localFields.houseworkPoints > 0 ||
        (localFields.dateAchievements ?? 0) > 0 ||
        (localFields.anniversaryAchievements ?? 0) > 0;

      const coinOnlyReward: RpgReward = {
        heart: 0,
        compatibility: 0,
        xp: 0,
        houseworkPoints: 0,
        loveCoins: deltas.loveCoinDelta,
      };
      if (deltas.loveCoinDelta > 0 && (useCloud || options?.skipRpg)) {
        setRpg((prev) => {
          const next = applyReward(normalizeRpgState(prev), coinOnlyReward);
          saveRpg(next);
          return next;
        });
      }

      if (!options?.skipRpg) {
        if (useCloud) {
          if (hasLocalFields) {
            setRpg((prev) => {
              const next = applyReward(normalizeRpgState(prev), localFields);
              saveRpg(next);
              return next;
            });
          }
        } else {
          setRpg((prev) => {
            const next = applyReward(normalizeRpgState(prev), rewardForRpg);
            saveRpg(next);
            return next;
          });
        }
      }

      if (hasGrowthDeltas(deltas)) {
        if (useCloud) {
          const key =
            idempotencyKey ?? fallbackEarnCoinKey(coin?.source ?? 'growth');
          void recordGrowthEvent(auth.supabase, true, {
            coupleId,
            userId: currentUserId,
            txType: 'earn',
            source: coin?.source ?? 'task',
            idempotencyKey: key,
            note: coin?.title,
            emoji: coin?.emoji,
            loveCoinDelta: deltas.loveCoinDelta,
            heartDelta: deltas.heartDelta,
            bondDelta: deltas.bondDelta,
            expDelta: deltas.expDelta,
            meta: coin,
          }).then((result) => {
            if (result.ok) {
              applyGrowthSnapshot(result.snapshot);
              coinWalletSchedulerRef.current?.scheduleSync();
            }
          });
        }

        if (deltas.loveCoinDelta > 0 && coin) {
          setRewards((prev) => {
            const next = addCoinEarn(prev, deltas.loveCoinDelta, coin);
            saveRewards(next);
            return next;
          });
          logTodayActivity({
            actionType: 'complete',
            targetType: 'love_task',
            targetTitle: coin.title,
            message: formatLoveCoinActivityMessage(deltas.loveCoinDelta, coin.title),
          });
        }
      }

      setActivity(appendActivity(log));
    },
    [
      applyGrowthSnapshot,
      auth.supabase,
      canSyncWallet,
      coupleId,
      currentUserId,
      formatLoveCoinActivityMessage,
      logTodayActivity,
    ]
  );

  const claimWeeklyChallengeReward = useCallback(async (): Promise<boolean> => {
    const result = tryMarkWeeklyChallengeClaimed(ledgerCtx, coupleExpView.level, isPro);
    if (!result.ok) return false;

    grantReward(
      {
        heart: 0,
        compatibility: 0,
        xp: 0,
        houseworkPoints: 0,
        loveCoins: result.loveCoins,
      },
      `完成本週挑戰`,
      { source: 'task', title: '每週情侶挑戰', emoji: '🏆' },
      weeklyChallengeCoinKey(
        currentUserId ?? '',
        coupleId,
        result.weekStartDate,
        result.challengeId
      )
    );

    const previousLevel = coupleExpView.level;
    const expResult = grantWeeklyChallengeExp(
      ledgerCtx,
      result.expAmount,
      result.weekStartDate,
      result.challengeId
    );
    if (expResult.granted > 0) {
      bumpExp();
      syncRpgExpFromStore(expResult.totalExp);
      const newLevel = levelFromTotalExp(expResult.totalExp);
      if (newLevel > previousLevel) {
        let highestUnshown: number | null = null;
        for (let lv = previousLevel + 1; lv <= newLevel; lv++) {
          if (shouldShowLevelUpPopup(ledgerCtx, lv)) highestUnshown = lv;
        }
        if (highestUnshown != null) {
          for (let lv = previousLevel + 1; lv <= newLevel; lv++) {
            markLevelUpPopupShown(ledgerCtx, lv);
          }
          setPendingLevelUp((prev) =>
            prev == null || highestUnshown > prev ? highestUnshown : prev
          );
        }
      }
      if (canSyncWallet && coupleId && currentUserId) {
        const key = `exp:weekly:${result.weekStartDate}:${result.challengeId}`;
        void recordGrowthEvent(auth.supabase, true, {
          coupleId,
          userId: currentUserId,
          txType: 'earn',
          source: 'task',
          idempotencyKey: key,
          expDelta: expResult.granted,
          loveCoinDelta: 0,
          heartDelta: 0,
          bondDelta: 0,
        }).then((res) => {
          if (res.ok) applyGrowthSnapshot(res.snapshot);
        });
      }
    }

    bumpWeeklyChallenge();
    return true;
  }, [
    applyGrowthSnapshot,
    auth.supabase,
    bumpExp,
    bumpWeeklyChallenge,
    canSyncWallet,
    coupleExpView.level,
    coupleId,
    currentUserId,
    grantReward,
    isPro,
    ledgerCtx,
    syncRpgExpFromStore,
  ]);

  const recordValidInteractionToday = useCallback(() => {
    const { recordedToday, newMilestones } = tryRecordLoveFlameToday(ledgerCtx);
    bumpLedger();
    if (!recordedToday) return;
    applyExpGrant({ type: 'love_flame' });
    for (const m of newMilestones) {
      if (!tryClaimFlameMilestone(ledgerCtx, m)) continue;
      bumpLedger();
      const coins = LOVE_FLAME_MILESTONE_COINS[m as keyof typeof LOVE_FLAME_MILESTONE_COINS];
      grantReward(
        { heart: 0, compatibility: 0, xp: 0, houseworkPoints: 0, loveCoins: coins },
        `愛情火苗連續 ${m} 天`,
        { source: 'task', title: `連續互動 ${m} 天`, emoji: '🔥' },
        loveFlameMilestoneKey(m)
      );
    }
  }, [applyExpGrant, grantReward, ledgerCtx, bumpLedger]);

  useEffect(() => {
    setRpg((prev) => {
      const { state: next, isNewDay } = processDailyLogin(prev);
      if (!isNewDay) return prev;
      const normalized = normalizeRpgState(next);
      const withBonus = applyReward(normalized, { ...REWARDS.loginBonus, xp: 0 });
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
      const day = todayKey();
      const claim = tryClaimMiniGameReward(ledgerCtx, day, isPro);
      bumpLedger();
      if (!claim.ok) return false;

      const slotNum = claim.slotNum;
      setRpg((prev) => {
        const rolled = rollDailyGuardForToday(normalizeRpgState(prev));
        const g = rolled.dailyGuard ?? defaultDailyGuard();
        const out: RpgState = {
          ...rolled,
          dailyGuard: {
            ...g,
            miniGamesRewardCount: slotNum,
          },
        };
        saveRpg(out);
        return out;
      });

      grantReward(
        {
          heart: 0,
          compatibility: 0,
          xp: 0,
          houseworkPoints: 0,
          loveCoins: REWARDS.miniGameComplete.loveCoins,
        },
        '完成情侶小遊戲',
        {
          source: 'game',
          title: '情侶小遊戲',
          emoji: '🎲',
        },
        miniGameCoinKey(day, slotNum),
        { skipRpg: true }
      );
      applyExpGrant({ type: 'mini_game', claimIndex: slotNum - 1 });
      addCompletion('game', '情侶小遊戲', '🎲', detail ? { detail } : undefined);
      logTodayActivity({ actionType: 'complete', targetType: 'mini_game' });
      recordValidInteractionToday();
      return true;
    },
    [
      addCompletion,
      applyExpGrant,
      bumpLedger,
      canSyncWallet,
      grantReward,
      isPro,
      ledgerCtx,
      logTodayActivity,
      recordValidInteractionToday,
    ]
  );

  const rpgView = useMemo(() => {
    const day = todayKey();
    const snap = rpgSnapshot(rpg);
    const exp = coupleExpView;
    return {
      ...snap,
      xp: exp.totalExp,
      level: exp.level,
      title: exp.title,
      xpNext: exp.expNeeded > 0 ? exp.expNeeded : 1,
      levelSegmentXp: exp.expInLevel,
      xpPct: exp.progressPct,
      miniGamesRewardCap: getMiniGameDailyRewardCap(isPro),
      miniGamesRewardsToday: getMiniGameRewardCount(ledgerCtx, day),
    };
  }, [rpg, coupleExpView, isPro, ledgerCtx, ledgerRevision]);

  const pullDinnerFromCloud = useCallback(async () => {
    if (coupleSpaceLoading) return;
    await dinnerSchedulerRef.current?.pullFromRemoteIfIdle();
  }, [coupleSpaceLoading]);

  const syncDinnerFoodOptions = useCallback(async () => {
    await dinnerSchedulerRef.current?.flushDinnerSync();
  }, []);

  const retryDinnerSync = useCallback(() => {
    dinnerSchedulerRef.current?.retryDinnerSync();
  }, []);

  const addDinnerOption = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const newId = makeId();
      setDinner((prev) => {
        const next: DinnerData = {
          ...prev,
          options: [
            ...prev.options,
            touchDinnerOption({ id: newId, label: trimmed, isActive: true }),
          ],
        };
        saveDinner(next);
        return next;
      });
      scheduleDinnerSync('add-option');
      logTodayActivity({
        actionType: 'create',
        targetType: 'dinner',
        targetTitle: trimmed,
      });
    },
    [logTodayActivity, scheduleDinnerSync]
  );

  const removeDinnerOption = useCallback(
    (id: string) => {
      const removed = dinner.options.find((o) => o.id === id);
      const title = removed?.label?.trim();
      setDinner((prev) => {
        const next = softRemoveDinnerOption(prev, id);
        saveDinner(next);
        return next;
      });
      scheduleDinnerSync('remove-option');
      if (title) {
        logTodayActivity({
          actionType: 'delete',
          targetType: 'dinner',
          targetTitle: title,
        });
      }
    },
    [dinner.options, logTodayActivity, scheduleDinnerSync]
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
      const hadToday = Boolean(getTodayDinner(dinner.history));
      const matchedOption = dinner.options.find(
        (o) => o.isActive !== false && o.label.trim().toLowerCase() === choice.toLowerCase()
      );
      setDinner((prev) => {
        const next = saveTodayResult(prev, choice, {
          selectedFoodLocalId: matchedOption?.id ?? null,
          decidedBy: currentUserId,
        });
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
        const after = applyReward(rolled, { ...REWARDS.dinnerSaved, xp: 0 });
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
        actionType: hadToday ? 'update' : 'complete',
        targetType: 'dinner',
        targetTitle: choice,
        message: hadToday ? `重新決定今晚吃「${choice}」` : undefined,
      });
      applyExpGrant({ type: 'dinner' });
      recordValidInteractionToday();
    },
    [
      applyExpGrant,
      currentUserId,
      dinner.history,
      dinner.options,
      draftPick,
      logTodayActivity,
      recordValidInteractionToday,
    ]
  );

  const clearTodayDinnerResultFn = useCallback(() => {
    const hadToday = Boolean(getTodayDinner(dinner.history));
    if (!hadToday) return;
    setDinner((prev) => {
      const next = clearTodayDinnerResult(prev);
      saveDinner(next);
      return next;
    });
    setDraftPick(null);
    logTodayActivity({
      actionType: 'delete',
      targetType: 'dinner',
      message: '清除了今日晚餐結果',
    });
  }, [dinner.history, logTodayActivity]);

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
      const removed = housework.items.find((i) => i.id === id);
      const title = removed?.label?.trim();
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
      if (title) {
        logTodayActivity({
          actionType: 'delete',
          targetType: 'chore',
          targetTitle: title,
        });
      }
    },
    [housework.items, logTodayActivity, scheduleChoreSync]
  );

  const setHouseworkSelectedTaskIdsFn = useCallback((taskIds: string[]) => {
    setHousework((prev) => {
      const next = setSelectedTaskIds(prev, taskIds);
      saveHousework(next);
      return next;
    });
  }, []);

  const startHouseworkAssignmentFn = useCallback((): boolean => {
    let ok = false;
    let count = 0;
    setHousework((prev) => {
      const next = startTodayAssignment(prev);
      if (!next) return prev;
      ok = true;
      count =
        next.todayAssignment?.chores.length ?? next.todayAssignment?.selectedTaskIds.length ?? 0;
      saveHousework(next);
      return next;
    });
    if (ok) {
      logTodayActivity({
        actionType: 'create',
        targetType: 'chore',
        message: `建立了今日家事分配，共 ${count} 項`,
      });
    }
    return ok;
  }, [logTodayActivity]);

  const houseworkCompleteLocksRef = useRef<Set<string>>(new Set());

  const completeHouseworkChoreFn = useCallback(
    (taskId: string): {
      granted: boolean;
      rewardAlreadyClaimed: boolean;
      dailyLimitReached: boolean;
    } => {
      if (houseworkCompleteLocksRef.current.has(taskId)) {
        return { granted: false, rewardAlreadyClaimed: true, dailyLimitReached: false };
      }
      houseworkCompleteLocksRef.current.add(taskId);

      try {
        const today = todayKey();
        const prev = loadHousework();
        backfillChoreRewardClaimsFromHousework(prev, today);

        const item = prev.items.find((i) => i.id === taskId) ?? null;
        const cur = getTodayAssignment(prev, today);
        const chore = cur?.chores.find((c) => c.taskId === taskId);
        if (!item || !cur?.assignedAt || !chore || chore.completed) {
          return {
            granted: false,
            rewardAlreadyClaimed: hasChoreRewardClaim(today, taskId),
            dailyLimitReached: false,
          };
        }

        const grantReason = evaluateChoreRewardGrant(today, taskId, isPro);
        const alreadyClaimed = grantReason === 'already_claimed';
        const dailyLimitReached = grantReason === 'daily_limit';
        const grantNow = grantReason === 'grant' && tryClaimChoreReward(today, taskId, isPro);

        const { data: next, granted, item: doneItem } = completeAssignedChore(
          prev,
          taskId,
          today,
          currentUserId,
          { grantReward: grantNow, rewardAlreadyClaimed: alreadyClaimed }
        );

        if (granted && doneItem) {
          const assignee =
            next.todayAssignment?.chores.find((c) => c.taskId === taskId)?.assignee ?? 'A';
          const assigneeName = assignee === 'A' ? displayNames.me : displayNames.partner;
          grantReward(
            REWARDS.houseworkChoreComplete,
            `${assigneeName} 完成「${doneItem.label}」`,
            {
              source: 'housework',
              title: doneItem.label,
              emoji: doneItem.emoji,
            },
            choreCoinKey(today, taskId)
          );
          applyExpGrant({ type: 'chore', taskId });
        }

        saveHousework(next);
        setHousework(next);

        if (doneItem) {
          logTodayActivity({
            actionType: 'complete',
            targetType: 'chore',
            targetTitle: doneItem.label,
          });
          recordValidInteractionToday();
        }

        return {
          granted: Boolean(granted),
          rewardAlreadyClaimed: alreadyClaimed,
          dailyLimitReached,
        };
      } finally {
        houseworkCompleteLocksRef.current.delete(taskId);
      }
    },
    [
      applyExpGrant,
      currentUserId,
      displayNames.me,
      displayNames.partner,
      grantReward,
      isPro,
      logTodayActivity,
      recordValidInteractionToday,
    ]
  );

  const clearTodayHouseworkFn = useCallback(() => {
    setHousework((prev) => {
      const next = clearTodayAssignment(prev);
      saveHousework(next);
      return next;
    });
    logTodayActivity({
      actionType: 'delete',
      targetType: 'chore',
      message: '清除了今日家事分配',
    });
  }, [logTodayActivity]);

  const reassignTodayHouseworkFn = useCallback((): boolean => {
    let ok = false;
    setHousework((prev) => {
      const next = reassignToday(prev);
      if (!next) return prev;
      ok = true;
      saveHousework(next);
      return next;
    });
    if (ok) {
      logTodayActivity({
        actionType: 'update',
        targetType: 'chore',
        message: '重新分配了今日家事',
      });
    }
    return ok;
  }, [logTodayActivity]);

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
        if (!currentUserId) return;
        const result = await pushCoupleProfileToRemote(
          sb,
          coupleId,
          profile,
          currentUserId,
          serverUpdatedAt
        );
        if (result.conflict) {
          const row = await pullCoupleProfileFromRemote(sb, coupleId);
          const merged = mergeCoupleExtendedProfile(profile, row.profile, coupleProfileSyncCtx);
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
    [auth.configured, auth.supabase, coupleId, coupleProfileSyncCtx, currentUserId, isFullyBound, isOnline]
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
      const result = await syncCoupleProfile(sb, coupleId, coupleProfileSyncCtx);
      setCoupleExtendedState(result.merged);
      setCoupleProfileSyncStatus('synced');
    } catch (err) {
      console.error('[couple-profile-sync] sync failed:', err);
      setCoupleProfileSyncStatus('error');
      setCoupleProfileSyncError('同步失敗，稍後再試');
    }
  }, [auth.configured, auth.supabase, coupleId, coupleProfileSyncCtx, currentUserId, isFullyBound, isOnline]);

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
        const merged = mergeCoupleExtendedProfile(local, row.profile, coupleProfileSyncCtx);
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
  }, [
    auth.configured,
    auth.supabase,
    coupleId,
    coupleProfileSyncCtx,
    currentUserId,
    isFullyBound,
    isOnline,
  ]);

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

  const rerollLoveTaskFn = useCallback(
    (taskId: string) => {
      if (!canRerollLoveTask(tasks, taskId, isPro)) return;
      setTasks((prev) => {
        if (!canRerollLoveTask(prev, taskId, isPro)) return prev;
        const next = replaceLoveTask(prev, taskId, isPro, coupleExpView.level);
        saveTasks(next);
        return next;
      });
    },
    [isPro, tasks, coupleExpView.level]
  );

  const toggleDailyTaskFn = useCallback(
    (id: string) => {
      const day = todayKey();
      setTasks((prev) => {
        const slotIndex = prev.dailyTasks.findIndex((t) => t.id === id);
        if (slotIndex >= 0 && isLoveTaskSlotClaimed(ledgerCtx, day, slotIndex)) {
          return prev;
        }
        const wasDone = prev.dailyTasks.find((t) => t.id === id)?.done ?? false;
        const { data: nextBase, task } = toggleDailyTask(prev, id);
        let next = nextBase;

        if (task?.done && !wasDone && slotIndex >= 0) {
          if (tryClaimLoveTaskSlot(ledgerCtx, day, slotIndex)) {
            bumpLedger();
            grantReward(
              REWARDS.dailyLoveTaskComplete,
              `完成戀愛任務「${task.label}」`,
              {
                source: 'task',
                title: task.label,
                emoji: task.emoji,
              },
              taskCoinKey(day, slotIndex)
            );
            applyExpGrant({ type: 'love_task_slot', slotIndex });
            addCompletion('task', task.label, task.emoji);
          }

          const progress = getLoveTaskProgressFromLedger(ledgerCtx, day);
          const allComplete =
            progress.total >= 2 && progress.done === progress.total;
          if (allComplete && tryClaimLoveTaskAllComplete(ledgerCtx, day)) {
            bumpLedger();
            grantReward(
              REWARDS.dailyLoveTaskAllComplete,
              '完成今日全部戀愛任務',
              { source: 'task', title: '今日戀愛任務 2/2', emoji: '💌' },
              loveTaskAllCompleteKey(day)
            );
            applyExpGrant({ type: 'love_task_all_complete' });

            const comboLevel = getCoupleExpView(ledgerCtx).level;
            if (
              comboLevel >= MIN_COUPLE_LEVEL_FOR_COMBO &&
              tryClaimLevel3Combo(ledgerCtx, day)
            ) {
              bumpLedger();
              const expResult = applyExpGrant({ type: 'level3_combo' });
              grantReward(
                {
                  heart: 0,
                  compatibility: 0,
                  xp: 0,
                  houseworkPoints: 0,
                  loveCoins: LEVEL3_COMBO_LOVE_COINS,
                },
                '甜蜜連擊完成',
                { source: 'task', title: '甜蜜連擊加成', emoji: '💕' },
                level3ComboCoinKey(day)
              );
              const expGranted = expResult.granted;
              queueMicrotask(() =>
                setLevel3ComboNotice({ coins: LEVEL3_COMBO_LOVE_COINS, expGranted })
              );
            }
          }

          next = syncTasksRewardFlagsFromLedger(ledgerCtx, next, day);
          logTodayActivity({ actionType: 'complete', targetType: 'love_task', targetTitle: task.label });
          saveTasks(next);
          queueMicrotask(() => recordValidInteractionToday());
        } else {
          saveTasks(nextBase);
        }
        return next;
      });
    },
    [
      applyExpGrant,
      grantReward,
      addCompletion,
      logTodayActivity,
      recordValidInteractionToday,
      ledgerCtx,
      bumpLedger,
    ]
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
        grantReward(
          REWARDS.flirtGameComplete,
          `完成小遊戲「${def?.title ?? gameId}」`,
          {
            source: 'game',
            title: def?.title ?? '曖昧小遊戲',
            emoji: def?.emoji ?? '🎮',
          },
          flirtGameCoinKey(todayKey(), gameId)
        );
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
      const suggestion = pickRandomDateIdea(prev.filters, isPro);
      if (!suggestion) return prev;
      ok = true;
      const next: DatePlannerData = { ...prev, current: suggestion };
      saveDatePlanner(next);
      return next;
    });
    if (ok) {
      applyExpGrant({ type: 'date_idea' });
      recordValidInteractionToday();
    }
    return ok;
  }, [applyExpGrant, isPro, recordValidInteractionToday]);

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
          const after = applyReward(rolled, {
            ...REWARDS.dateComplete,
            loveCoins: 0,
          });
          const out = {
            ...after,
            dailyGuard: { ...g, dateRewardClaimed: true, anchorDate: todayKey() },
          };
          saveRpg(out);
          return out;
        });
        if (grantRpg) {
          grantReward(
            REWARDS.dateComplete,
            `完成約會「${captured.title}」`,
            {
              source: 'date',
              title: captured.title,
              emoji: captured.emoji,
            },
            dateCompleteCoinKey(todayKey(), captured.ideaId),
            { skipRpg: true }
          );
          addCompletion('date', captured.title, captured.emoji);
          logTodayActivity({
            actionType: 'complete',
            targetType: 'date_idea',
            targetTitle: captured.title,
          });
          recordValidInteractionToday();
        }
      });
      return next;
    });
  }, [addCompletion, grantReward, logTodayActivity, recordValidInteractionToday]);

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

  const importantDateReminderBuckets = useMemo(
    () => computeImportantDateReminderBuckets(coupleExtended, importantDateReminders),
    [coupleExtended, importantDateReminders]
  );

  const rescheduleImportantDatePushFn = useCallback(async () => {
    await rescheduleLoveQuestImportantDateNotifications(coupleExtended, importantDateReminders);
  }, [coupleExtended, importantDateReminders]);

  useEffect(() => {
    void rescheduleImportantDatePushFn();
  }, [rescheduleImportantDatePushFn]);

  const dismissImportantDateReminderFn = useCallback((reminderId: string) => {
    setImportantDateReminders((prev) => {
      const next = acknowledgeImportantDateReminder(prev, reminderId);
      saveImportantDateReminders(next);
      return next;
    });
  }, []);

  const pushCouponBackground = useCallback(
    (coupon: NonNullable<ReturnType<typeof redeemCoupon>['coupon']>) => {
      if (
        !canSyncRewardCards({
          configured: auth.configured,
          userId: currentUserId,
          online: isOnline,
        }) ||
        !auth.supabase ||
        !currentUserId
      ) {
        setRewardCardSyncStatus('local');
        return;
      }
      setRewardCardSyncStatus('syncing');
      setRewardCardSyncError(null);
      void redeemRewardCard(auth.supabase, currentUserId, coupleId, coupon)
        .then((synced) => {
          setRewards((prev) => {
            const next = {
              ...prev,
              coupons: prev.coupons.map((c) =>
                c.id === synced.id ? normalizeOwnedCoupon(synced) : c
              ),
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
          setRewards((prev) => {
            const next = {
              ...prev,
              coupons: prev.coupons.map((c) =>
                c.id === coupon.id
                  ? { ...c, syncPending: true, syncError: '同步失敗，稍後再試' }
                  : c
              ),
            };
            saveRewards(next);
            return next;
          });
          setRewardCardSyncStatus('error');
          setRewardCardSyncError('同步失敗，稍後再試');
        });
    },
    [auth.configured, auth.supabase, coupleId, currentUserId, isOnline]
  );

  const redeemRewardItemFn = useCallback(
    async (itemId: ShopItemId): Promise<RewardRedeemResult> => {
      const item = getShopItem(itemId);
      if (!item) return { ok: false };

      const coinIdempotencyKey = makeId();
      let balance = canSyncWallet ? getCachedCoinBalance() : loadRpg().loveCoins;

      if (canSyncWallet && coupleId) {
        const spend = await recordGrowthEvent(auth.supabase, true, {
          coupleId,
          userId: currentUserId,
          txType: 'spend',
          source: 'redeem',
          idempotencyKey: redeemCoinKey(coinIdempotencyKey),
          note: item.title,
          emoji: item.emoji,
          loveCoinDelta: -item.cost,
        });
        if (!spend.ok) return { ok: false };
        balance = spend.snapshot.loveCoinBalance;
        applyGrowthSnapshot(spend.snapshot);
      } else if (balance < item.cost) {
        return { ok: false };
      }

      const rewPrev = loadRewards();
      const result = redeemCoupon(rewPrev, itemId, balance, currentUserId);
      if (result.error || !result.coupon) return { ok: false };

      if (!canSyncWallet) {
        const nextRpg = normalizeRpgState({
          ...loadRpg(),
          loveCoins: balance - item.cost,
        });
        saveRpg(nextRpg);
        setRpg(nextRpg);
      }

      saveRewards(result.rewards);
      setRewards(result.rewards);
      setHighlightCouponId(result.coupon.id);
      const name = actorDisplayName(currentUserId);
      setActivity(appendActivity(formatRedeemFeedLine(name, result.coupon.cardTitle)));
      logTodayActivity({
        actionType: 'redeem',
        targetType: 'reward_card',
        targetTitle: result.coupon.cardTitle,
        message: formatLoveCoinActivityMessage(-item.cost, result.coupon.cardTitle),
      });
      pushCouponBackground(result.coupon);
      coinWalletSchedulerRef.current?.scheduleSync();
      recordValidInteractionToday();
      return { ok: true, couponId: result.coupon.id };
    },
    [
      actorDisplayName,
      applyGrowthSnapshot,
      auth.supabase,
      canSyncWallet,
      coupleId,
      currentUserId,
      formatLoveCoinActivityMessage,
      logTodayActivity,
      pushCouponBackground,
      recordValidInteractionToday,
    ]
  );

  const redeemCustomRewardItemFn = useCallback(
    async (input: CustomRewardCardInput): Promise<RewardRedeemResult> => {
      const normalized = normalizeCustomRewardInput(input);
      if (!normalized) return { ok: false };

      const coinIdempotencyKey = makeId();
      let balance = canSyncWallet ? getCachedCoinBalance() : loadRpg().loveCoins;

      if (canSyncWallet && coupleId) {
        const spend = await recordGrowthEvent(auth.supabase, true, {
          coupleId,
          userId: currentUserId,
          txType: 'spend',
          source: 'redeem',
          idempotencyKey: redeemCoinKey(coinIdempotencyKey),
          note: normalized.title,
          emoji: normalized.emoji,
          loveCoinDelta: -normalized.cost,
        });
        if (!spend.ok) return { ok: false };
        balance = spend.snapshot.loveCoinBalance;
        applyGrowthSnapshot(spend.snapshot);
      } else if (balance < normalized.cost) {
        return { ok: false };
      }

      const rewPrev = loadRewards();
      const result = redeemCustomCoupon(rewPrev, input, balance, currentUserId);
      if (result.error || !result.coupon) return { ok: false };

      if (!canSyncWallet) {
        const nextRpg = normalizeRpgState({
          ...loadRpg(),
          loveCoins: balance - normalized.cost,
        });
        saveRpg(nextRpg);
        setRpg(nextRpg);
      }

      saveRewards(result.rewards);
      setRewards(result.rewards);
      setHighlightCouponId(result.coupon.id);
      const name = actorDisplayName(currentUserId);
      setActivity(appendActivity(formatRedeemFeedLine(name, result.coupon.cardTitle)));
      logTodayActivity({
        actionType: 'redeem',
        targetType: 'reward_card',
        targetTitle: result.coupon.cardTitle,
        message: formatLoveCoinActivityMessage(-normalized.cost, result.coupon.cardTitle),
      });
      pushCouponBackground(result.coupon);
      recordValidInteractionToday();
      return { ok: true, couponId: result.coupon.id };
    },
    [
      actorDisplayName,
      applyGrowthSnapshot,
      auth.supabase,
      canSyncWallet,
      coupleId,
      currentUserId,
      formatLoveCoinActivityMessage,
      logTodayActivity,
      pushCouponBackground,
      recordValidInteractionToday,
    ]
  );

  const useCouponFn = useCallback(
    (couponId: string) => {
      let used = false;
      setRewards((prev) => {
        const r = useRewardCardLocal(prev, couponId, currentUserId);
        if (r.error || !r.coupon) return prev;
        used = true;
        saveRewards(r.rewards);
        const name = actorDisplayName(currentUserId);
        setActivity(appendActivity(formatUseFeedLine(name, r.coupon.cardTitle)));
        logTodayActivity({
          actionType: 'use',
          targetType: 'reward_card',
          targetTitle: r.coupon.cardTitle,
        });
        if (
          canSyncRewardCards({
            configured: auth.configured,
            userId: currentUserId,
            online: isOnline,
          }) &&
          auth.supabase &&
          currentUserId
        ) {
          setRewardCardSyncStatus('syncing');
          void pushUseRewardCardRemote(auth.supabase, currentUserId, coupleId, r.coupon)
            .then((synced) => {
              setRewards((p) => {
                const n = {
                  ...p,
                  coupons: p.coupons.map((c) =>
                    c.id === synced.id ? normalizeOwnedCoupon(synced) : c
                  ),
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
      if (used) recordValidInteractionToday();
    },
    [
      actorDisplayName,
      auth.configured,
      auth.supabase,
      coupleId,
      currentUserId,
      isOnline,
      logTodayActivity,
      recordValidInteractionToday,
    ]
  );

  const cancelRewardCardUseFn = useCallback(
    (couponId: string) => {
      setRewards((prev) => {
        const r = cancelUseRewardCardLocal(prev, couponId, currentUserId);
        if (r.error || !r.coupon) return prev;
        saveRewards(r.rewards);
        if (
          canSyncRewardCards({
            configured: auth.configured,
            userId: currentUserId,
            online: isOnline,
          }) &&
          auth.supabase &&
          currentUserId
        ) {
          setRewardCardSyncStatus('syncing');
          void pushUseRewardCardRemote(auth.supabase, currentUserId, coupleId, r.coupon)
            .then((synced) => {
              setRewards((p) => {
                const n = {
                  ...p,
                  coupons: p.coupons.map((c) =>
                    c.id === synced.id ? normalizeOwnedCoupon(synced) : c
                  ),
                };
                saveRewards(n);
                return n;
              });
              setRewardCardSyncStatus('synced');
              setRewardCardSyncError(null);
            })
            .catch((e) => {
              const msg = e instanceof Error ? e.message : String(e);
              console.error('[user-reward-card-sync] cancel push failed:', msg);
              setRewardCardSyncStatus('error');
              setRewardCardSyncError('同步失敗，稍後再試');
            });
        }
        return r.rewards;
      });
    },
    [auth.configured, auth.supabase, coupleId, currentUserId, isOnline]
  );

  const completeRewardCardFn = useCallback(
    (couponId: string) => {
      setRewards((prev) => {
        const r = completeRewardCardLocal(prev, couponId, currentUserId);
        if (r.error || !r.coupon) return prev;
        saveRewards(r.rewards);
        const name = displayNameForUser(currentUserId);
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
            online: isOnline,
          }) &&
          auth.supabase &&
          currentUserId
        ) {
          setRewardCardSyncStatus('syncing');
          void pushCompleteRewardCardRemote(auth.supabase, currentUserId, coupleId, r.coupon)
            .then((synced) => {
              setRewards((p) => {
                const n = {
                  ...p,
                  coupons: p.coupons.map((c) =>
                    c.id === synced.id ? normalizeOwnedCoupon(synced) : c
                  ),
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
    [displayNameForUser, auth.configured, auth.supabase, coupleId, currentUserId, isOnline, logTodayActivity]
  );

  const runRewardCardCleanup = useCallback(
    async (syncRemote: boolean) => {
      const canRemote = syncRemote && Boolean(auth.supabase && currentUserId);
      const { removedCount, rewards: cleaned } = await cleanupOldCompletedRewardCards(
        canRemote ? auth.supabase : null,
        currentUserId,
        coupleId,
        { syncRemote: canRemote }
      );
      if (removedCount > 0) {
        setRewards(cleaned);
      }
      return removedCount;
    },
    [auth.supabase, coupleId, currentUserId]
  );

  const cleanupOldCompletedRewardCardsFn = useCallback(async () => {
    const canRemote = canSyncRewardCards({
      configured: auth.configured,
      userId: currentUserId,
      online: isOnline,
    });
    return runRewardCardCleanup(canRemote);
  }, [auth.configured, currentUserId, isOnline, runRewardCardCleanup]);

  const pullRewardCardsFromCloud = useCallback(async () => {
    const canRemote = canSyncRewardCards({
      configured: auth.configured,
      userId: currentUserId,
      online: isOnline,
    });
    await runRewardCardCleanup(canRemote);

    if (!canRemote) {
      setRewardCardSyncStatus('local');
      return;
    }
    if (!auth.supabase || !currentUserId) return;
    setRewardCardSyncStatus('syncing');
    setRewardCardSyncError(null);
    try {
      const rows = await getRemoteRewardCards(auth.supabase, currentUserId);
      setRewards((prev) => {
        const merged = applyRemoteRewardRowsToRewards(prev, currentUserId, rows);
        saveRewards(merged);
        return merged;
      });
      setRewardCardSyncStatus('synced');
      setRewardCardSyncError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[reward-card-sync] pull failed:', msg);
      setRewardCardSyncStatus('error');
      setRewardCardSyncError('同步失敗，稍後再試');
    }
  }, [auth.configured, auth.supabase, currentUserId, isOnline, runRewardCardCleanup]);

  const syncRewardCards = useCallback(async () => {
    if (
      !canSyncRewardCards({
        configured: auth.configured,
        userId: currentUserId,
        online: isOnline,
      })
    ) {
      setRewardCardSyncStatus('local');
      setRewardCardSyncError('需要登入並連上網路才能同步卡券');
      return;
    }
    if (!auth.supabase || !currentUserId) return;
    setRewardCardSyncStatus('syncing');
    setRewardCardSyncError(null);
    try {
      const merged = await syncRewardCardsRemote(auth.supabase, currentUserId, coupleId);
      setRewards(merged);
      setRewardCardSyncStatus('synced');
      setRewardCardSyncError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[user-reward-card-sync] sync failed:', msg);
      setRewardCardSyncStatus('error');
      setRewardCardSyncError('同步失敗，稍後再試');
    }
  }, [auth.configured, auth.supabase, coupleId, currentUserId, isOnline]);

  useEffect(() => {
    if (
      !canSyncRewardCards({
        configured: auth.configured,
        userId: currentUserId,
        online: isOnline,
      })
    ) {
      setRewardCardSyncStatus('local');
      void runRewardCardCleanup(false);
      return;
    }
    if (!auth.supabase || !currentUserId) return;

    let cancelled = false;
    void (async () => {
      try {
        if (!cancelled) {
          await runRewardCardCleanup(true);
        }
        const rows = await getRemoteRewardCards(auth.supabase!, currentUserId);
        if (cancelled) return;
        setRewards((prev) => {
          const merged = applyRemoteRewardRowsToRewards(prev, currentUserId, rows);
          saveRewards(merged);
          return merged;
        });
        setRewardCardSyncStatus('synced');
        setRewardCardSyncError(null);
      } catch (e) {
        if (cancelled) return;
        console.error('[user-reward-card-sync] auto pull failed:', e);
        setRewardCardSyncStatus('error');
        setRewardCardSyncError('同步失敗，稍後再試');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth.configured, auth.supabase, currentUserId, isOnline, runRewardCardCleanup]);

  const myCoupons = useMemo(
    () => filterMyCoupons(rewards, currentUserId),
    [rewards, currentUserId]
  );

  const myRewardsView = useMemo(
    () => ({ ...rewards, coupons: myCoupons }),
    [rewards, myCoupons]
  );

  const completedCouponsSorted = useMemo(
    () => sortCompletedCoupons(getCouponsByStatus(myRewardsView, 'completed')),
    [myRewardsView]
  );

  const pullHouseworkFromCloud = useCallback(async () => {
    if (coupleSpaceLoading) return;
    await choreSchedulerRef.current?.pullFromRemoteIfIdle();
  }, [coupleSpaceLoading]);

  const syncHousework = useCallback(async () => {
    if (
      !canSyncChoreItems({
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
      coupleExpView,
      weeklyChallengeView,
      claimWeeklyChallengeReward,
      coupleWeeklyRecapView,
      dinner,
      dinnerOptions,
      todayDinner: getTodayDinner(dinner.history),
      dinnerHistory: getRecentHistory(dinner.history),
      dinnerHomeStatus,
      dinnerSyncStatus,
      dinnerSyncError,
      dinnerCanSyncOptions,
      housework,
      houseworkHomeStatus,
      weeklyStats,
      tasks,
      taskProgress,
      loveFlameView,
      canRerollLoveTaskFor,
      isLoveTaskSlotRewardClaimed,
      isLoveTaskAllCompleteRewardClaimed,
      isLevel3ComboClaimedToday,
      level3ComboNotice,
      clearLevel3ComboNotice,
      canEarnDailyRewards,
      coupleExtended,
      displayNames,
      displayNameForUser,
      setCoupleExtendedProfile: setCoupleExtendedProfileFn,
      coupleProfileSyncStatus,
      coupleProfileSyncError,
      syncCoupleProfile: syncCoupleProfileFn,
      importantDateReminders,
      patchImportantDateReminder: patchImportantDateReminderFn,
      rescheduleImportantDatePush: rescheduleImportantDatePushFn,
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
      clearTodayDinnerResult: clearTodayDinnerResultFn,
      pullDinnerFromCloud,
      syncDinnerFoodOptions,
      retryDinnerSync,
      addHouseworkItem,
      removeHouseworkItem,
      setHouseworkSelectedTaskIds: setHouseworkSelectedTaskIdsFn,
      startHouseworkAssignment: startHouseworkAssignmentFn,
      completeHouseworkChore: completeHouseworkChoreFn,
      clearTodayHousework: clearTodayHouseworkFn,
      reassignTodayHousework: reassignTodayHouseworkFn,
      choreSyncStatus,
      choreSyncError,
      choreCanSyncItems,
      pullHouseworkFromCloud,
      syncHousework,
      retryChoreSync,
      pullActivityLogsFromCloud,
      toggleDailyTask: toggleDailyTaskFn,
      startFlirtGame,
      rerollFlirtPrompt,
      completeFlirtGame,
      claimMiniGameReward,
      cancelFlirtGame,
      isFlirtGameDoneToday: isFlirtGameDoneTodayFn,
      datePlanner,
      dateHistory: getRecentDateHistory(datePlanner.history),
      favoriteIdeas: getFavoriteIdeas(datePlanner.favoriteIds, isPro),
      setDateFilter,
      clearDateFilters,
      generateDateIdea,
      toggleDateFavorite: toggleDateFavoriteFn,
      completeCurrentDate: completeCurrentDateFn,
      anniversaries,
      upcomingAnniversaries: getUpcomingEvents(anniversaries.events, 20),
      nextAnniversary: getNextImportant(anniversaries.events),
      todayImportantDateReminders: importantDateReminderBuckets.today,
      futureImportantDateReminders: importantDateReminderBuckets.future,
      activeAnniversaryReminders: importantDateReminderBuckets.today,
      addAnniversary: addAnniversaryFn,
      updateAnniversary: updateAnniversaryFn,
      removeAnniversary: removeAnniversaryFn,
      generateAnniversaryPlan: generateAnniversaryPlanFn,
      completeAnniversaryPlan: completeAnniversaryPlanFn,
      markAnniversaryCelebrated: markAnniversaryCelebratedFn,
      updateGiftPrefs: updateGiftPrefsFn,
      generateGiftSuggestions: generateGiftSuggestionsFn,
      dismissImportantDateReminder: dismissImportantDateReminderFn,
      dismissAnniversaryReminder: dismissImportantDateReminderFn,
      rewards,
      todayCoinEarned: rewards.todayEarnedDate === todayKey() ? rewards.todayEarnedCoins : 0,
      recentCoinEarns: getRecentEarns(rewards),
      weeklyTitles,
      activeCoupons: getActiveCoupons(myRewardsView),
      usedCoupons: getUsedCoupons(myRewardsView),
      redeemedCoupons: getCouponsByStatus(myRewardsView, 'redeemed'),
      inProgressCoupons: getCouponsByStatus(myRewardsView, 'used'),
      completedCoupons: getCouponsByStatus(myRewardsView, 'completed'),
      completedCouponsSorted,
      rewardCardSyncStatus,
      rewardCardSyncError,
      highlightCouponId,
      clearHighlightCoupon,
      redeemRewardItem: redeemRewardItemFn,
      redeemCustomRewardItem: redeemCustomRewardItemFn,
      useCoupon: useCouponFn,
      cancelRewardCardUse: cancelRewardCardUseFn,
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
      coupleExpView,
      weeklyChallengeView,
      claimWeeklyChallengeReward,
      coupleWeeklyRecapView,
      dinner,
      dinnerOptions,
      dinnerHomeStatus,
      dinnerSyncStatus,
      dinnerSyncError,
      dinnerCanSyncOptions,
      housework,
      houseworkHomeStatus,
      weeklyStats,
      tasks,
      taskProgress,
      ledgerRevision,
      loveFlameView,
      canRerollLoveTaskFor,
      isLoveTaskSlotRewardClaimed,
      isLoveTaskAllCompleteRewardClaimed,
      isLevel3ComboClaimedToday,
      level3ComboNotice,
      clearLevel3ComboNotice,
      canEarnDailyRewards,
      coupleExtended,
      displayNames,
      displayNameForUser,
      importantDateReminders,
      setCoupleExtendedProfileFn,
      coupleProfileSyncStatus,
      coupleProfileSyncError,
      syncCoupleProfileFn,
      patchImportantDateReminderFn,
      rescheduleImportantDatePushFn,
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
      clearTodayDinnerResultFn,
      pullDinnerFromCloud,
      syncDinnerFoodOptions,
      retryDinnerSync,
      addHouseworkItem,
      removeHouseworkItem,
      setHouseworkSelectedTaskIdsFn,
      startHouseworkAssignmentFn,
      completeHouseworkChoreFn,
      clearTodayHouseworkFn,
      reassignTodayHouseworkFn,
      choreSyncStatus,
      choreSyncError,
      choreCanSyncItems,
      pullHouseworkFromCloud,
      syncHousework,
      retryChoreSync,
      pullActivityLogsFromCloud,
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
      dismissImportantDateReminderFn,
      redeemRewardItemFn,
      redeemCustomRewardItemFn,
      myRewardsView,
      useCouponFn,
      cancelRewardCardUseFn,
      completeRewardCardFn,
      pullRewardCardsFromCloud,
      syncRewardCards,
      cleanupOldCompletedRewardCardsFn,
      completedCouponsSorted,
      rewardCardSyncStatus,
      rewardCardSyncError,
      highlightCouponId,
      clearHighlightCoupon,
      isPro,
      partnerName,
      partnerEmoji,
    ]
  );

  return (
    <LoveQuestContext.Provider value={value}>
      {pendingLevelUp != null ? (
        <LevelUpModal
          level={pendingLevelUp}
          onDismiss={() => setPendingLevelUp(null)}
        />
      ) : null}
      {children}
    </LoveQuestContext.Provider>
  );
}

export function useLoveQuest(): LoveQuestContextValue {
  const ctx = useContext(LoveQuestContext);
  if (!ctx) throw new Error('useLoveQuest must be used within LoveQuestProvider');
  return ctx;
}

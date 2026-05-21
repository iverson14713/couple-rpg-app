export type PartnerId = 'A' | 'B';

export type CoupleProfile = {
  nameA: string;
  nameB: string;
  emojiA: string;
  emojiB: string;
};

export type DailyRpgGuard = {
  /** 與下列計數對齊的曆日 YYYY-MM-DD；換日時重置 */
  anchorDate: string;
  /** 當日「決定晚餐」可領 RPG 次數上限 2 */
  dinnerRewardCount: number;
  /** 當日完成約會 RPG 是否已領 */
  dateRewardClaimed: boolean;
  /** 當日完成情侶重要日資料是否已領 RPG */
  coupleProfileImportantRewardClaimed: boolean;
  /** 當日情侶小遊戲可領 RPG／LoveCoin 次數上限 3 */
  miniGamesRewardCount: number;
};

export type RpgState = {
  heartPoints: number;
  compatibility: number;
  /**
   * 累積總 EXP（v2）。等級公式：level = floor(xp / 100) + 1；當前環為 xp % 100 / 100。
   * v1 舊存檔會在載入時換算成總量。
   */
  xp: number;
  level: number;
  houseworkPoints: number;
  /** 累計完成的約會次數 */
  dateAchievements: number;
  /** 累計紀念日相關成就 */
  anniversaryAchievements: number;
  /** 愛心幣（可兌換獎勵） */
  loveCoins: number;
  loginStreak: number;
  /** YYYY-MM-DD */
  lastLoginDate: string;
  /** 每日 RPG／LoveCoin 防刷（換日自動重置） */
  dailyGuard?: DailyRpgGuard | null;
  /** 2 = 總 EXP 制；缺省視為 1 並遷移 */
  rpgSchemaVersion?: number;
};

export type DinnerOption = {
  id: string;
  label: string;
  emoji?: string;
  remoteId?: string | null;
  isActive?: boolean;
  updatedAt?: string;
  localVersion?: number;
};

export type DinnerHistoryEntry = {
  id: string;
  date: string;
  label: string;
  savedAt: string;
  selectedFoodLocalId?: string | null;
  decidedBy?: string | null;
  remoteId?: string | null;
  updatedAt?: string;
  localVersion?: number;
};

export type DinnerData = {
  options: DinnerOption[];
  history: DinnerHistoryEntry[];
  updatedAt?: string;
  syncRevision?: number;
};

export type DinnerHomeStatus = {
  badge: string;
  summaryPart?: string;
};

export type HouseworkItem = {
  id: string;
  label: string;
  emoji: string;
  remoteId?: string | null;
  isActive?: boolean;
  syncPending?: boolean;
  updatedAt?: string;
  localVersion?: number;
};

export type HouseworkCompletion = {
  id: string;
  taskId: string;
  taskLabel: string;
  emoji: string;
  partner: PartnerId;
  completedAt: string;
  points: number;
  /** 若已領過此筆完成所觸發的 RPG／LoveCoin 獎勵，避免重複發放 */
  rpgRewardGranted?: boolean;
};

/** 今日已分配的家事（localStorage） */
export type HouseworkAssignedChore = {
  taskId: string;
  /** A = 我（myNickname），B = 另一半（partnerNickname） */
  assignee: PartnerId;
  completed: boolean;
  rewarded: boolean;
  remoteId?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  updatedAt?: string;
  localVersion?: number;
};

export type HouseworkTodayAssignment = {
  /** YYYY-MM-DD */
  date: string;
  /** Step 1：今日要做的家事 id */
  selectedTaskIds: string[];
  /** 已按下「開始分配」的時間；null 表示尚未分配 */
  assignedAt: string | null;
  chores: HouseworkAssignedChore[];
  updatedAt?: string;
};

export type HouseworkData = {
  items: HouseworkItem[];
  completions: HouseworkCompletion[];
  /** 舊版轉盤；新流程不再使用，載入時清除 */
  pendingSpin: PendingHouseworkSpin | null;
  todayAssignment: HouseworkTodayAssignment | null;
  /** 奇數分配時多一項的一方，下次輪流 */
  lastExtraAssignee: PartnerId | null;
  /** 本地同步版本（每次變更 +1） */
  syncRevision?: number;
  updatedAt?: string;
};

export type PendingHouseworkSpin = {
  taskId: string;
  taskLabel: string;
  emoji: string;
  partner: PartnerId;
  spunAt: string;
};

export type LoveTask = {
  id: string;
  templateId: string;
  label: string;
  emoji: string;
  done: boolean;
};

export type TasksData = {
  /** Date key when dailyTasks were generated. */
  date: string;
  dailyTasks: LoveTask[];
  /**
   * Legacy: per-instance ids from older builds; kept for migration only.
   * LoveCoin for daily tasks is gated by `dailyRewardClaimedDate`, not this array.
   */
  rewardedTaskIds: string[];
  /**
   * YYYY-MM-DD when LoveQuest daily love-task LoveCoin was last claimed, or null.
   * At most one LoveCoin grant per calendar day for this feature (reroll-safe).
   */
  dailyRewardClaimedDate: string | null;
};

export type FlirtGameId = 'dice' | 'truth' | 'coquettish' | 'stare' | 'massage';

export type CompletionRecord = {
  id: string;
  kind: 'task' | 'game' | 'date' | 'anniversary';
  date: string;
  time: string;
  title: string;
  emoji: string;
  gameId?: FlirtGameId;
  detail?: string;
};

export type FlirtGameSession = {
  gameId: FlirtGameId;
  prompt: string;
  startedAt: string;
};

export type FlirtGamesData = {
  completedToday: Partial<Record<FlirtGameId, string>>;
  activeSession: FlirtGameSession | null;
};

export type ActivityLogEntry = {
  id: string;
  date: string;
  time: string;
  summary: string;
};

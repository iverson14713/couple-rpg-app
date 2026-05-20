export type PartnerId = 'A' | 'B';

export type CoupleProfile = {
  nameA: string;
  nameB: string;
  emojiA: string;
  emojiB: string;
};

export type RpgState = {
  heartPoints: number;
  compatibility: number;
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
};

export type DinnerOption = {
  id: string;
  label: string;
};

export type DinnerHistoryEntry = {
  id: string;
  date: string;
  label: string;
  savedAt: string;
};

export type DinnerData = {
  options: DinnerOption[];
  history: DinnerHistoryEntry[];
};

export type HouseworkItem = {
  id: string;
  label: string;
  emoji: string;
};

export type HouseworkCompletion = {
  id: string;
  taskId: string;
  taskLabel: string;
  emoji: string;
  partner: PartnerId;
  completedAt: string;
  points: number;
};

export type HouseworkData = {
  items: HouseworkItem[];
  completions: HouseworkCompletion[];
  pendingSpin: PendingHouseworkSpin | null;
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

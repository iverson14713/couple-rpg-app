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
  label: string;
  emoji: string;
  done: boolean;
  rewardedAt?: string;
};

export type TasksData = {
  loveTasks: LoveTask[];
  lastResetDate: string;
};

export type ActivityLogEntry = {
  id: string;
  date: string;
  time: string;
  summary: string;
};

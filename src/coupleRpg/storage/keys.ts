export const LQ_KEYS = {
  rpg: 'lovequest-rpg',
  couple: 'lovequest-couple',
  /** Local-only extended couple profile (birthdays, anniversaries); no Supabase yet */
  coupleExtended: 'lovequest-couple-profile',
  dinner: 'lovequest-dinner',
  housework: 'lovequest-housework',
  /** 每日家事 LoveCoin/RPG 領獎紀錄（dateKey::taskId，不受重新分配影響） */
  choreRewardClaims: 'lovequest-chore-reward-claims',
  tasks: 'lovequest-tasks',
  flirtGames: 'lovequest-flirt-games',
  completionHistory: 'lovequest-completion-history',
  activity: 'lovequest-activity',
  /** 首頁「今日動態」操作紀錄（local；預留 remote 同步） */
  activityLog: 'lovequest-activity-log',
  datePlanner: 'lovequest-date-planner',
  /** 最近一次 AI 約會行程（local only；免費版單筆） */
  lastDateItineraryAi: 'lovequest-last-date-itinerary-ai',
  /** Pro：AI 約會行程歷史（local） */
  dateItineraryAiHistory: 'lovequest-date-itinerary-ai-history',
  /** 最近一次 AI 重要日子安排（local only；免費版單筆） */
  lastImportantDateAi: 'lovequest-last-important-date-ai',
  /** Pro：AI 重要日子歷史（local） */
  importantDateAiHistory: 'lovequest-important-date-ai-history',
  /** Pro：AI 紀錄收藏 id 列表（local） */
  aiFavorites: 'lovequest-ai-favorites',
  anniversaries: 'lovequest-anniversaries',
  rewards: 'lovequest-rewards',
  /** Set after Phase 7 couple bind; until then bind reminder shows on home */
  coupleSpaceId: 'lovequest-couple-space-id',
  /** 首頁「今天想對你說」每日一句（local only） */
  dailyMessage: 'lovequest-daily-message',
  /** 首頁「今天想對你說」展開狀態（local only） */
  dailyMessageExpanded: 'lovequest-daily-message-expanded',
  /** 首頁「情侶生活總控台」展開狀態（local only） */
  homeConsoleExpanded: 'lovequest-home-console-expanded',
  /** 首頁「重要日子」展開狀態（local only） */
  homeDatesExpanded: 'lovequest-home-dates-expanded',
  /** 重要日子提醒設定（local only） */
  importantDateReminders: 'lovequest-important-date-reminders',
  /** 使用者方案：free | pro（local 模擬，尚未接金流） */
  userPlan: 'lovequest-user-plan',
  /** LoveCoin 雲端錢包快取（非 source of truth） */
  coinWalletCache: 'lovequest-coin-wallet-cache',
} as const;

/** Keys persisted per Supabase user: `lovequest-*-{userId}` */
export const USER_SCOPED_STORAGE_KEYS: readonly string[] = Object.values(LQ_KEYS);

/** Device / UI prefs kept across logout (not user-scoped). */
export const DEVICE_PREF_STORAGE_KEYS: readonly string[] = [
  LQ_KEYS.homeConsoleExpanded,
  LQ_KEYS.homeDatesExpanded,
  LQ_KEYS.dailyMessageExpanded,
];

const USER_SCOPED_SET = new Set<string>(USER_SCOPED_STORAGE_KEYS);

export function isUserScopedStorageKey(key: string): boolean {
  return USER_SCOPED_SET.has(key);
}


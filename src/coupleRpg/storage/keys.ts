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
} as const;

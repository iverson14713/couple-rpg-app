import type { DailyRpgGuard, RpgState } from './types';
import { todayKey } from '../lib/dates';

export const HEART_MAX = 100;
export const COMPAT_MAX = 100;
export const RPG_SCHEMA_VERSION = 2;
export const EXP_PER_LEVEL_SEGMENT = 100;

export type RpgReward = {
  heart: number;
  compatibility: number;
  xp: number;
  houseworkPoints: number;
  dateAchievements?: number;
  anniversaryAchievements?: number;
  loveCoins?: number;
};

/** v1：每等級所需 XP（僅用於舊存檔換算總 EXP） */
function xpToNextLevelLegacy(level: number): number {
  return 80 + level * 40;
}

/** 將舊版「等級 + 當段 XP」換算成 v2 總累積 EXP */
export function estimateTotalExpFromLegacyState(level: number, segmentXp: number): number {
  const L = Math.max(1, Math.floor(level) || 1);
  let total = 0;
  for (let lv = 1; lv < L; lv++) {
    total += xpToNextLevelLegacy(lv);
  }
  const cap = xpToNextLevelLegacy(L);
  total += Math.min(Math.max(0, segmentXp), cap);
  return total;
}

export function defaultDailyGuard(anchor: string = todayKey()): DailyRpgGuard {
  return {
    anchorDate: anchor,
    dinnerRewardCount: 0,
    dateRewardClaimed: false,
    coupleProfileImportantRewardClaimed: false,
    miniGamesRewardCount: 0,
  };
}

/** 換日時重置 dailyGuard 計數 */
export function rollDailyGuardForToday(state: RpgState, today: string = todayKey()): RpgState {
  const g = state.dailyGuard;
  if (!g || g.anchorDate !== today) {
    return { ...state, dailyGuard: defaultDailyGuard(today) };
  }
  return state;
}

export const REWARDS = {
  houseworkComplete: { heart: 0, compatibility: 3, xp: 10, houseworkPoints: 10, loveCoins: 3 },
  /** 今日家事分配：完成單一項目（每項僅一次） */
  houseworkChoreComplete: { heart: 0, compatibility: 3, xp: 10, houseworkPoints: 0, loveCoins: 3 },
  loveTaskComplete: { heart: 10, compatibility: 1, xp: 20, houseworkPoints: 0, loveCoins: 5 },
  flirtGameComplete: { heart: 2, compatibility: 2, xp: 12, houseworkPoints: 0, loveCoins: 8 },
  dinnerSaved: { heart: 3, compatibility: 2, xp: 5, houseworkPoints: 0, loveCoins: 0 },
  dateComplete: { heart: 15, compatibility: 5, xp: 30, houseworkPoints: 0, dateAchievements: 1, loveCoins: 10 },
  coupleProfileImportant: { heart: 5, compatibility: 0, xp: 10, houseworkPoints: 0, loveCoins: 0 },
  /** 情侶小遊戲頁「完成」一次（受每日 3 次上限） */
  miniGameComplete: { heart: 3, compatibility: 1, xp: 5, houseworkPoints: 0, loveCoins: 2 },
  anniversaryPlanComplete: {
    heart: 3,
    compatibility: 2,
    xp: 15,
    houseworkPoints: 0,
    anniversaryAchievements: 1,
    loveCoins: 12,
  },
  anniversaryCelebrated: {
    heart: 5,
    compatibility: 4,
    xp: 22,
    houseworkPoints: 0,
    anniversaryAchievements: 1,
    loveCoins: 18,
  },
  /** 每日登入（不含 LoveCoin） */
  loginBonus: { heart: 2, compatibility: 0, xp: 5, houseworkPoints: 0, loveCoins: 0 },
} as const;

export function xpToNextLevel(_level: number): number {
  return EXP_PER_LEVEL_SEGMENT;
}

export function levelTitle(level: number): string {
  if (level >= 13) return '傳奇情侶';
  if (level >= 8) return '戀愛達人';
  if (level >= 4) return '默契搭檔';
  return '甜蜜新手';
}

export function defaultRpgState(): RpgState {
  return {
    heartPoints: 50,
    compatibility: 60,
    xp: 0,
    level: 1,
    houseworkPoints: 0,
    dateAchievements: 0,
    anniversaryAchievements: 0,
    loveCoins: 0,
    loginStreak: 0,
    lastLoginDate: '',
    dailyGuard: defaultDailyGuard(),
    rpgSchemaVersion: RPG_SCHEMA_VERSION,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** 僅本機累積欄位（非雲端同步的成就／家事點數） */
export function localOnlyRewardFields(reward: RpgReward): RpgReward {
  return {
    heart: 0,
    compatibility: 0,
    xp: 0,
    loveCoins: 0,
    houseworkPoints: reward.houseworkPoints,
    dateAchievements: reward.dateAchievements,
    anniversaryAchievements: reward.anniversaryAchievements,
  };
}

export function applyReward(state: RpgState, reward: RpgReward): RpgState {
  let {
    heartPoints,
    compatibility,
    xp,
    houseworkPoints,
    dateAchievements,
    anniversaryAchievements,
    loveCoins,
    loginStreak,
    lastLoginDate,
    dailyGuard,
  } = normalizeRpgState(state);

  heartPoints = clamp(heartPoints + reward.heart, 0, HEART_MAX);
  compatibility = clamp(compatibility + reward.compatibility, 0, COMPAT_MAX);
  houseworkPoints += reward.houseworkPoints;
  dateAchievements += reward.dateAchievements ?? 0;
  anniversaryAchievements += reward.anniversaryAchievements ?? 0;
  loveCoins += reward.loveCoins ?? 0;
  xp = Math.max(0, xp + reward.xp);

  const level = Math.floor(xp / EXP_PER_LEVEL_SEGMENT) + 1;

  return {
    heartPoints,
    compatibility,
    xp,
    level,
    houseworkPoints,
    dateAchievements,
    anniversaryAchievements,
    loveCoins,
    loginStreak,
    lastLoginDate,
    dailyGuard,
    rpgSchemaVersion: RPG_SCHEMA_VERSION,
  };
}

export function normalizeRpgState(raw: Partial<RpgState> & Record<string, unknown>): RpgState {
  const base: RpgState = {
    ...defaultRpgState(),
    ...raw,
    dateAchievements: raw.dateAchievements ?? 0,
    anniversaryAchievements: raw.anniversaryAchievements ?? 0,
    loveCoins: raw.loveCoins ?? 0,
    loginStreak: raw.loginStreak ?? 0,
    lastLoginDate: raw.lastLoginDate ?? '',
    dailyGuard: (raw.dailyGuard as DailyRpgGuard | null | undefined) ?? null,
    rpgSchemaVersion: (raw.rpgSchemaVersion as number | undefined) ?? 1,
  };

  let xpTotal = Math.max(0, Number(base.xp) || 0);
  const schema = base.rpgSchemaVersion ?? 1;
  if (schema < RPG_SCHEMA_VERSION) {
    xpTotal = estimateTotalExpFromLegacyState(base.level ?? 1, base.xp ?? 0);
  }

  const level = Math.floor(xpTotal / EXP_PER_LEVEL_SEGMENT) + 1;

  const today = todayKey();
  let dailyGuard: DailyRpgGuard;
  const g0 = base.dailyGuard;
  if (!g0 || g0.anchorDate !== today) {
    dailyGuard = defaultDailyGuard(today);
  } else {
    dailyGuard = {
      anchorDate: today,
      dinnerRewardCount: g0.dinnerRewardCount ?? 0,
      dateRewardClaimed: g0.dateRewardClaimed ?? false,
      coupleProfileImportantRewardClaimed: g0.coupleProfileImportantRewardClaimed ?? false,
      miniGamesRewardCount: g0.miniGamesRewardCount ?? 0,
    };
  }

  return {
    ...base,
    xp: xpTotal,
    level,
    heartPoints: clamp(Number(base.heartPoints) || 0, 0, HEART_MAX),
    compatibility: clamp(Number(base.compatibility) || 0, 0, COMPAT_MAX),
    dailyGuard,
    rpgSchemaVersion: RPG_SCHEMA_VERSION,
  };
}

export function rpgSnapshot(state: RpgState) {
  const s = normalizeRpgState(state);
  const segXp = s.xp % EXP_PER_LEVEL_SEGMENT;
  const xpPct = Math.round((segXp / EXP_PER_LEVEL_SEGMENT) * 100);
  return {
    ...s,
    dateAchievements: s.dateAchievements ?? 0,
    anniversaryAchievements: s.anniversaryAchievements ?? 0,
    loveCoins: s.loveCoins ?? 0,
    loginStreak: s.loginStreak ?? 0,
    heartMax: HEART_MAX,
    xpNext: EXP_PER_LEVEL_SEGMENT,
    title: levelTitle(s.level),
    xpPct,
    /** 當前等級環內已累積 EXP（0～99），UI 用 */
    levelSegmentXp: segXp,
    miniGamesRewardsToday: s.dailyGuard?.miniGamesRewardCount ?? 0,
    currentSegmentXp: segXp,
  };
}

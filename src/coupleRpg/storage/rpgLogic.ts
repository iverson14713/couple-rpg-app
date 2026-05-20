import type { RpgState } from './types';

export const HEART_MAX = 100;
export const COMPAT_MAX = 100;

export type RpgReward = {
  heart: number;
  compatibility: number;
  xp: number;
  houseworkPoints: number;
  dateAchievements?: number;
  anniversaryAchievements?: number;
};

export const REWARDS = {
  houseworkComplete: { heart: 3, compatibility: 2, xp: 20, houseworkPoints: 10 },
  loveTaskComplete: { heart: 2, compatibility: 1, xp: 12, houseworkPoints: 0 },
  flirtGameComplete: { heart: 3, compatibility: 2, xp: 15, houseworkPoints: 0 },
  dinnerSaved: { heart: 2, compatibility: 1, xp: 8, houseworkPoints: 0 },
  dateComplete: { heart: 4, compatibility: 3, xp: 18, houseworkPoints: 0, dateAchievements: 1 },
  anniversaryPlanComplete: {
    heart: 3,
    compatibility: 2,
    xp: 15,
    houseworkPoints: 0,
    anniversaryAchievements: 1,
  },
  anniversaryCelebrated: {
    heart: 5,
    compatibility: 4,
    xp: 22,
    houseworkPoints: 0,
    anniversaryAchievements: 1,
  },
} as const;

export function xpToNextLevel(level: number): number {
  return 80 + level * 40;
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
  };
}

export function applyReward(state: RpgState, reward: RpgReward): RpgState {
  let { heartPoints, compatibility, xp, level, houseworkPoints, dateAchievements, anniversaryAchievements } =
    state;

  heartPoints = Math.min(HEART_MAX, heartPoints + reward.heart);
  compatibility = Math.min(COMPAT_MAX, compatibility + reward.compatibility);
  houseworkPoints += reward.houseworkPoints;
  dateAchievements += reward.dateAchievements ?? 0;
  anniversaryAchievements += reward.anniversaryAchievements ?? 0;
  xp += reward.xp;

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
  }

  return {
    heartPoints,
    compatibility,
    xp,
    level,
    houseworkPoints,
    dateAchievements,
    anniversaryAchievements,
  };
}

export function rpgSnapshot(state: RpgState) {
  return {
    ...state,
    dateAchievements: state.dateAchievements ?? 0,
    anniversaryAchievements: state.anniversaryAchievements ?? 0,
    heartMax: HEART_MAX,
    xpNext: xpToNextLevel(state.level),
    title: levelTitle(state.level),
    xpPct: Math.round((state.xp / xpToNextLevel(state.level)) * 100),
  };
}

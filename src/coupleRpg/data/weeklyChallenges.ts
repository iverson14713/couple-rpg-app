/** Phase 3C：每週情侶挑戰定義（規則型，非 AI） */
export type WeeklyChallengeProgressType =
  | 'love_tasks'
  | 'mini_games'
  | 'chores'
  | 'date_ideas'
  | 'flame_days';

export type WeeklyChallengeDef = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  progressType: WeeklyChallengeProgressType;
  target: number;
  loveCoins: number;
  exp: number;
};

export const MIN_COUPLE_LEVEL_WEEKLY_CHALLENGE = 4;

export const WEEKLY_CHALLENGE_UNLOCK_HINT =
  '升到 Lv.4 靈魂隊友後，即可解鎖每週情侶挑戰。';

export const WEEKLY_CHALLENGE_DEFS: WeeklyChallengeDef[] = [
  {
    id: 'chemistry_week',
    title: '默契升溫週',
    emoji: '💌',
    description: '完成今日戀愛任務 5 個',
    progressType: 'love_tasks',
    target: 5,
    loveCoins: 120,
    exp: 80,
  },
  {
    id: 'mini_game_week',
    title: '小遊戲互動週',
    emoji: '🎲',
    description: '完成情侶小遊戲獎勵 5 次',
    progressType: 'mini_games',
    target: 5,
    loveCoins: 100,
    exp: 70,
  },
  {
    id: 'chore_week',
    title: '家事合作週',
    emoji: '🧹',
    description: '完成家事 5 件',
    progressType: 'chores',
    target: 5,
    loveCoins: 120,
    exp: 80,
  },
  {
    id: 'date_idea_week',
    title: '約會靈感週',
    emoji: '💑',
    description: '產生約會想法 2 次',
    progressType: 'date_ideas',
    target: 2,
    loveCoins: 100,
    exp: 70,
  },
  {
    id: 'flame_week',
    title: '穩定互動週',
    emoji: '🔥',
    description: '延續愛情火苗 5 天',
    progressType: 'flame_days',
    target: 5,
    loveCoins: 150,
    exp: 90,
  },
];

export function getWeeklyChallengeDef(id: string): WeeklyChallengeDef | null {
  return WEEKLY_CHALLENGE_DEFS.find((c) => c.id === id) ?? null;
}

/** 依週一起日穩定輪替挑戰 */
export function challengeIdForWeek(weekStartDate: string): string {
  let h = 0;
  for (let i = 0; i < weekStartDate.length; i++) {
    h = (h * 31 + weekStartDate.charCodeAt(i)) >>> 0;
  }
  const idx = h % WEEKLY_CHALLENGE_DEFS.length;
  return WEEKLY_CHALLENGE_DEFS[idx]!.id;
}

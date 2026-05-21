/**
 * 情侶小遊戲題庫（Free / Pro 分級）
 * App Store 安全：甜蜜、生活化、不露骨
 */
import {
  buildPromptRows,
  FREE_COUPLE_CHALLENGE,
  FREE_COUPLE_DICE,
  FREE_SYNC_QUIZ,
  FREE_SWEET_TALK,
  FREE_TRUTH,
  PRO_COUPLE_CHALLENGE,
  PRO_COUPLE_DICE,
  PRO_DATE_ICEBREAKER,
  PRO_SURPRISE_TASK,
  PRO_SYNC_QUIZ,
  PRO_SWEET_TALK,
  PRO_TRUTH,
  type RawPromptRow,
} from './coupleGamePromptsData';

export type CoupleGameModeId =
  | 'coupleDice'
  | 'truth'
  | 'syncQuiz'
  | 'sweetTalk'
  | 'coupleChallenge'
  | 'dateIcebreaker'
  | 'surpriseTask';

export type PromptTier = 'free' | 'pro';

export type CoupleGameTone = 'sweet' | 'chat' | 'life' | 'date' | 'surprise';

export type CoupleGamePrompt = {
  id: string;
  mode: CoupleGameModeId;
  tier: PromptTier;
  title: string;
  description?: string;
  category: string;
  emoji: string;
  tone?: CoupleGameTone;
  safetyLevel?: 'wholesome';
};

export type CoupleGameModeDef = {
  id: CoupleGameModeId;
  title: string;
  emoji: string;
  description: string;
  actionLabel: string;
  /** 整個模式僅 Pro 可進入 */
  proOnly?: boolean;
};

function rows(mode: CoupleGameModeId, tier: PromptTier, raw: RawPromptRow[]): CoupleGamePrompt[] {
  return raw.map((r, i) => ({
    id: `${mode}-${tier}-${String(i + 1).padStart(2, '0')}`,
    mode,
    tier,
    safetyLevel: 'wholesome' as const,
    ...r,
  }));
}

export const COUPLE_GAME_PROMPTS: CoupleGamePrompt[] = [
  ...rows('coupleDice', 'free', FREE_COUPLE_DICE),
  ...rows('coupleDice', 'pro', PRO_COUPLE_DICE),
  ...rows('truth', 'free', FREE_TRUTH),
  ...rows('truth', 'pro', PRO_TRUTH),
  ...rows('syncQuiz', 'free', FREE_SYNC_QUIZ),
  ...rows('syncQuiz', 'pro', PRO_SYNC_QUIZ),
  ...rows('sweetTalk', 'free', FREE_SWEET_TALK),
  ...rows('sweetTalk', 'pro', PRO_SWEET_TALK),
  ...rows('coupleChallenge', 'free', FREE_COUPLE_CHALLENGE),
  ...rows('coupleChallenge', 'pro', PRO_COUPLE_CHALLENGE),
  ...rows('dateIcebreaker', 'pro', PRO_DATE_ICEBREAKER),
  ...rows('surpriseTask', 'pro', PRO_SURPRISE_TASK),
];

export const COUPLE_GAME_MODES: CoupleGameModeDef[] = [
  {
    id: 'coupleDice',
    title: '情侶骰子',
    emoji: '🎲',
    description: '今天玩點甜的',
    actionLabel: '擲骰子',
  },
  {
    id: 'truth',
    title: '真心話',
    emoji: '💬',
    description: '更懂彼此',
    actionLabel: '抽一題',
  },
  {
    id: 'syncQuiz',
    title: '默契問答',
    emoji: '🤝',
    description: '默契挑戰',
    actionLabel: '抽默契題',
  },
  {
    id: 'sweetTalk',
    title: '今日情話',
    emoji: '💕',
    description: '說句心動的',
    actionLabel: '抽情話',
  },
  {
    id: 'coupleChallenge',
    title: '情侶挑戰',
    emoji: '🎯',
    description: '一起完成',
    actionLabel: '抽挑戰',
  },
  {
    id: 'dateIcebreaker',
    title: '約會破冰',
    emoji: '💑',
    description: '約會靈感',
    actionLabel: '抽約會',
    proOnly: true,
  },
  {
    id: 'surpriseTask',
    title: '驚喜任務',
    emoji: '🎁',
    description: '小驚喜',
    actionLabel: '抽任務',
    proOnly: true,
  },
];

/** @deprecated 使用 COUPLE_GAME_MODES */
export type MiniGameModeId = CoupleGameModeId;

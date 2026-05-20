/** App Store–safe prompts: sweet, wholesome, non-explicit. */

export type MiniGameModeId = 'coupleDice' | 'truth' | 'syncQuiz' | 'dateDice';

export const COUPLE_DICE_PROMPTS: string[] = [
  '抱抱 10 秒',
  '稱讚對方一句',
  '幫對方按摩 3 分鐘',
  '說一個今天感謝對方的地方',
  '一起拍一張照片',
  '幫對方倒一杯水',
  '親一下額頭',
  '給對方一個 30 秒擁抱',
];

export const TRUTH_PROMPTS: string[] = [
  '你第一次覺得我可愛是什麼時候？',
  '最近有什麼事想謝謝我？',
  '你最喜歡我們哪一次約會？',
  '如果週末只能做一件事，你想跟我做什麼？',
  '你覺得我最需要被照顧的是哪一點？',
];

export const SYNC_QUIZ_PROMPTS: string[] = [
  '對方今天比較想吃甜的還鹹的？',
  '對方比較想看電影還是散步？',
  '對方現在心情是幾分？',
  '對方最想收到什麼小驚喜？',
  '對方最喜歡哪種約會？',
];

export const DATE_DICE_PROMPTS: string[] = [
  '咖啡廳約會',
  '夜市小吃',
  '看電影',
  '公園散步',
  '在家追劇',
  '一起做飯',
  '去超商買彼此喜歡的零食',
  '一起散步 20 分鐘',
];

export const MINI_GAME_MODES: {
  id: MiniGameModeId;
  title: string;
  emoji: string;
  description: string;
  actionLabel: string;
  pool: string[];
}[] = [
  {
    id: 'coupleDice',
    title: '情侶骰子',
    emoji: '🎲',
    description: '隨機甜蜜小任務，今天換誰主動？',
    actionLabel: '擲骰子',
    pool: COUPLE_DICE_PROMPTS,
  },
  {
    id: 'truth',
    title: '真心話',
    emoji: '💬',
    description: '輕鬆聊聊，更懂彼此的心。',
    actionLabel: '抽一題',
    pool: TRUTH_PROMPTS,
  },
  {
    id: 'syncQuiz',
    title: '默契問答',
    emoji: '🤝',
    description: '猜猜看，默契有幾分？',
    actionLabel: '抽默契題',
    pool: SYNC_QUIZ_PROMPTS,
  },
  {
    id: 'dateDice',
    title: '約會骰子',
    emoji: '💑',
    description: '不知道去哪？交給約會骰子。',
    actionLabel: '抽約會',
    pool: DATE_DICE_PROMPTS,
  },
];

export function pickFromPool(pool: string[], exclude?: string | null): string {
  if (pool.length === 0) return '';
  const candidates = exclude ? pool.filter((p) => p !== exclude) : [...pool];
  const list = candidates.length > 0 ? candidates : [...pool];
  return list[Math.floor(Math.random() * list.length)] ?? list[0]!;
}

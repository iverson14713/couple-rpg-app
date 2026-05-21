export type ChecklistItem = {
  id: string;
  label: string;
  emoji: string;
  done: boolean;
};

export type CoupleStats = {
  heartPoints: number;
  heartMax: number;
  compatibility: number;
};

export type MemoryEntry = {
  id: string;
  date: string;
  title: string;
  note: string;
  emoji: string;
};

export type HistoryEntry = {
  id: string;
  date: string;
  time: string;
  actor: string;
  summary: string;
};

export type ReminderItem = {
  id: string;
  title: string;
  dueLabel: string;
  enabled: boolean;
  emoji: string;
};

export const MOCK_STATS: CoupleStats = {
  heartPoints: 72,
  heartMax: 100,
  compatibility: 88,
};

export const MOCK_DINNER: ChecklistItem[] = [
  { id: 'd1', label: '決定今晚菜色', emoji: '🍽️', done: true },
  { id: 'd2', label: '一起買菜／訂外送', emoji: '🛒', done: true },
  { id: 'd3', label: '擺盤＋拍照留念', emoji: '📸', done: false },
  { id: 'd4', label: '飯後甜點時間', emoji: '🍰', done: false },
];

export const MOCK_HOUSEWORK: ChecklistItem[] = [
  { id: 'h1', label: '洗碗／收碗', emoji: '🧽', done: true },
  { id: 'h2', label: '倒垃圾', emoji: '🗑️', done: false },
  { id: 'h3', label: '整理客廳', emoji: '🛋️', done: false },
  { id: 'h4', label: '洗衣服／晾衣', emoji: '👕', done: false },
];

export const MOCK_LOVE_TASKS: ChecklistItem[] = [
  { id: 'l1', label: '傳一則甜蜜訊息', emoji: '💌', done: true },
  { id: 'l2', label: '說一句稱讚的話', emoji: '✨', done: true },
  { id: 'l3', label: '牽手散步 10 分鐘', emoji: '🚶', done: false },
  { id: 'l4', label: '規劃週末小約會', emoji: '📅', done: false },
];

export const MOCK_QUESTS: ChecklistItem[] = [
  { id: 'q1', label: '完成今日晚餐任務', emoji: '🎯', done: false },
  { id: 'q2', label: '完成 2 項家事', emoji: '🏠', done: false },
  { id: 'q3', label: '愛心值 +5', emoji: '💖', done: false },
];

export const MOCK_RPG = {
  level: 12,
  title: '默契搭檔',
  xp: 340,
  xpNext: 500,
  perks: ['週末約會加成', '家事分工 Buff', '甜蜜對話 +1'],
};

export const MOCK_MEMORIES: MemoryEntry[] = [
  { id: 'm1', date: '2026-05-18', title: '第一次一起下廚', note: '做了奶油燉飯，雖然有點鹹但很好笑。', emoji: '👩‍🍳' },
  { id: 'm2', date: '2026-05-12', title: '河濱夜跑', note: '跑不動就改成散步吃冰。', emoji: '🌙' },
  { id: 'm3', date: '2026-05-01', title: '交往紀念日', note: '交換了小卡片。', emoji: '💝' },
];

export const MOCK_HISTORY: HistoryEntry[] = [
  { id: 'hi1', date: '2026-05-20', time: '19:30', actor: '你', summary: '完成「傳甜蜜訊息」戀愛任務' },
  { id: 'hi2', date: '2026-05-20', time: '18:10', actor: '另一半', summary: '完成「洗碗」家事' },
  { id: 'hi3', date: '2026-05-19', time: '21:00', actor: '你們', summary: '愛心值 +3 · 默契度提升' },
  { id: 'hi4', date: '2026-05-19', time: '12:20', actor: '你', summary: '新增回憶「河濱夜跑」' },
];

export const MOCK_REMINDERS: ReminderItem[] = [
  { id: 'r1', title: '週五電影之夜', dueLabel: '每週五 20:00', enabled: true, emoji: '🎬' },
  { id: 'r2', title: '紀念日倒數', dueLabel: '每月 1 日', enabled: true, emoji: '📆' },
  { id: 'r3', title: '一起運動', dueLabel: '每週三、日', enabled: false, emoji: '🏃' },
];

export const MOCK_COUPLE = {
  nameA: '我',
  nameB: '另一半',
  emojiA: '💗',
  emojiB: '💙',
  togetherSince: '2024-08-15',
};

import type { RewardShopCategory, ShopItem } from '../storage/rewardTypes';

/** 商城分類顯示名（key 不變，相容既有卡券資料） */
export const REWARD_CATEGORY_LABEL: Record<RewardShopCategory, { label: string; emoji: string }> = {
  massage: { label: '放鬆照顧', emoji: '💆' },
  royal: { label: '任性特權', emoji: '👑' },
  date: { label: '約會生活', emoji: '💑' },
  flirt: { label: '甜蜜互動', emoji: '💕' },
};

/** 完成每日互動可累積 LoveCoin，兌換小獎勵 */
export const REWARD_SHOP_EARN_HINT =
  '完成每日任務、小遊戲與家事互動可累積 LoveCoin，兌換你們的小獎勵。';

export const REWARD_SHOP_INSUFFICIENT_MSG =
  'LoveCoin 不足，完成今日戀愛任務、小遊戲或家事互動可繼續累積。';

/**
 * 獎勵商城定價（Phase 2.5）
 * 平衡基準：Free 每日約 70 · Pro 每日約 105 LoveCoin
 * 小獎勵 80～140（Free 約 1～2 天）· 中獎勵 180～350（3～5 天）· 大獎勵 400～750（6～10 天）
 */
export const REWARD_SHOP_ITEMS: ShopItem[] = [
  // —— 甜蜜互動 ——
  {
    id: 'flirt-hug',
    category: 'flirt',
    title: '抱抱券',
    description: '隨時可兌換一個大大的擁抱',
    emoji: '🤗',
    cost: 80,
  },
  {
    id: 'flirt-coquettish',
    category: 'flirt',
    title: '撒嬌券',
    description: '對方要撒嬌 3 分鐘，你負責寵',
    emoji: '🥺',
    cost: 100,
  },
  {
    id: 'flirt-praise',
    category: 'flirt',
    title: '稱讚券',
    description: '對方要真心稱讚你 3 句',
    emoji: '👏',
    cost: 100,
  },
  {
    id: 'flirt-kiss',
    category: 'flirt',
    title: '親親券',
    description: '甜蜜親親一次，害羞也要兌現',
    emoji: '😘',
    cost: 120,
  },
  {
    id: 'flirt-goodnight-voice',
    category: 'flirt',
    title: '晚安語音券',
    description: '睡前傳一段晚安語音',
    emoji: '🌙',
    cost: 120,
  },
  {
    id: 'flirt-obey',
    category: 'flirt',
    title: '今日聽話卡',
    description: '小事聽你的，今日超乖模式',
    emoji: '🎀',
    cost: 180,
  },
  {
    id: 'flirt-no-phone-chat',
    category: 'flirt',
    title: '不滑手機聊天券',
    description: '睡前聊天 10 分鐘，不滑手機',
    emoji: '💬',
    cost: 320,
  },
  // —— 約會生活 ——
  {
    id: 'date-bubble-tea',
    category: 'date',
    title: '奶茶券',
    description: '請喝一杯喜歡的奶茶或飲料',
    emoji: '🧋',
    cost: 130,
  },
  {
    id: 'date-late-snack',
    category: 'date',
    title: '宵夜券',
    description: '半夜餓了，一起出動買宵夜',
    emoji: '🌙',
    cost: 220,
  },
  {
    id: 'date-movie-pick',
    category: 'date',
    title: '電影選擇券',
    description: '今晚看什麼由我決定',
    emoji: '🎬',
    cost: 280,
  },
  {
    id: 'date-pick',
    category: 'date',
    title: '指定約會券',
    description: '由你決定週末約會內容，對方配合',
    emoji: '💑',
    cost: 650,
  },
  {
    id: 'date-weekend-priority',
    category: 'date',
    title: '週末約會優先券',
    description: '這週末約會主題由我決定',
    emoji: '🗓️',
    cost: 750,
  },
  // —— 任性特權 ——
  {
    id: 'royal-dinner-pick',
    category: 'royal',
    title: '今天晚餐由我決定',
    description: '菜單大權交給你，對方不能抱怨',
    emoji: '🍽️',
    cost: 260,
  },
  {
    id: 'royal-boss',
    category: 'royal',
    title: '今天我最大',
    description: '今日小事聽你的，甜蜜任性一下',
    emoji: '👑',
    cost: 400,
  },
  {
    id: 'royal-no-chores',
    category: 'royal',
    title: '今天不用做家事',
    description: '今日家務免單，享受寵愛',
    emoji: '🏰',
    cost: 600,
  },
  // —— 放鬆照顧 ——
  {
    id: 'massage-shoulder',
    category: 'massage',
    title: '肩頸按摩 15 分鐘',
    description: '兌換後請溫柔兌現，計時開始～',
    emoji: '💆',
    cost: 280,
  },
  {
    id: 'massage-full',
    category: 'massage',
    title: '全身按摩券',
    description: '放鬆身心，今天由對方服務',
    emoji: '🛋️',
    cost: 520,
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return REWARD_SHOP_ITEMS.find((i) => i.id === id);
}

import type { RewardShopCategory, ShopItem } from '../storage/rewardTypes';

export const REWARD_CATEGORY_LABEL: Record<RewardShopCategory, { label: string; emoji: string }> = {
  massage: { label: '按摩卡', emoji: '💆' },
  royal: { label: '皇帝 / 皇后卡', emoji: '👑' },
  date: { label: '約會券', emoji: '🎫' },
  flirt: { label: '曖昧互動券', emoji: '💕' },
};

export const REWARD_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'massage-shoulder',
    category: 'massage',
    title: '肩頸按摩 15 分鐘',
    description: '兌換後請溫柔兌現，計時開始～',
    emoji: '💆',
    cost: 40,
  },
  {
    id: 'massage-full',
    category: 'massage',
    title: '全身按摩券',
    description: '放鬆身心，今天由對方服務',
    emoji: '🛋️',
    cost: 80,
  },
  {
    id: 'royal-no-chores',
    category: 'royal',
    title: '今天不用做家事',
    description: '今日家務免單，享受寵愛',
    emoji: '🏰',
    cost: 50,
  },
  {
    id: 'royal-dinner-pick',
    category: 'royal',
    title: '今天晚餐由我決定',
    description: '菜單大權交給你，對方不能抱怨',
    emoji: '🍽️',
    cost: 35,
  },
  {
    id: 'royal-boss',
    category: 'royal',
    title: '今天我最大',
    description: '今日小事聽你的，甜蜜任性一下',
    emoji: '😂',
    cost: 60,
  },
  {
    id: 'date-bubble-tea',
    category: 'date',
    title: '奶茶券',
    description: '請喝一杯喜歡的奶茶或飲料',
    emoji: '🧋',
    cost: 25,
  },
  {
    id: 'date-late-snack',
    category: 'date',
    title: '宵夜券',
    description: '半夜餓了，一起出動買宵夜',
    emoji: '🌙',
    cost: 30,
  },
  {
    id: 'date-pick',
    category: 'date',
    title: '指定約會券',
    description: '由你決定週末約會內容，對方配合',
    emoji: '💑',
    cost: 55,
  },
  {
    id: 'flirt-hug',
    category: 'flirt',
    title: '抱抱券',
    description: '隨時可兌換一個大大的擁抱',
    emoji: '🤗',
    cost: 20,
  },
  {
    id: 'flirt-kiss',
    category: 'flirt',
    title: '親親券',
    description: '甜蜜親親一次，害羞也要兌現',
    emoji: '😘',
    cost: 35,
  },
  {
    id: 'flirt-coquettish',
    category: 'flirt',
    title: '撒嬌券',
    description: '對方要撒嬌 3 分鐘，你負責寵',
    emoji: '🥺',
    cost: 25,
  },
  {
    id: 'flirt-obey',
    category: 'flirt',
    title: '今日聽話卡',
    description: '小事聽你的，今日超乖模式',
    emoji: '🎀',
    cost: 30,
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return REWARD_SHOP_ITEMS.find((i) => i.id === id);
}

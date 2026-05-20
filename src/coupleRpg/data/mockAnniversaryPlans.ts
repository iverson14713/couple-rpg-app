import type { AnniversaryEvent } from '../storage/anniversaryTypes';
import type { AnniversaryPlan } from '../storage/anniversaryTypes';
import { typeMeta } from './anniversaryMeta';

const DATE_PLANS: Record<string, string[]> = {
  relationship: [
    '重溫第一次約會地點，拍一組「現在 vs 當時」對比照。',
    '準備手寫信與合照小冊，晚餐後一起翻看。',
  ],
  birthday: [
    '訂一間有氛圍的餐廳，準備小蛋糕與生日歌驚喜。',
    '白天安排喜歡的活動，晚上送一份實用又有心思的禮物。',
  ],
  valentine: [
    '玫瑰 + 巧克力經典組合，再加一張手寫卡片。',
    '居家浪漫晚餐：蠟燭、喜歡的菜、播放你們的歌單。',
  ],
  default: [
    '下午咖啡約會，傍晚散步，晚上簡單但用心的晚餐。',
    '一起完成一件小事（手作、料理、看展），留下照片紀念。',
  ],
};

const BUDGETS = ['經濟實惠（約 $500–1500）', '中等（約 $1500–4000）', '浪漫加碼（約 $4000+）'];
const SCHEDULES = [
  '14:00 集合 → 15:00 活動 → 18:30 晚餐 → 21:00 散步收尾',
  '11:00 早午餐 → 14:00 小驚喜 → 19:00 晚餐 → 回家電影夜',
];
const SURPRISES = [
  '偷偷準備對方提過想要的小東西，藏在包包或口袋。',
  '請朋友幫忙錄一段祝福短影片，晚餐時播放。',
  '把房間佈置成喜歡的色系，放上香氛與暖光。',
];
const BACKUPS = [
  '下雨改室內：咖啡廳 + 桌遊 / 電影之夜。',
  '餐廳客滿改 Plan B：外帶美食回家，佈置餐桌一樣浪漫。',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

export function mockAnniversaryPlan(event: AnniversaryEvent): AnniversaryPlan {
  const meta = typeMeta(event.type);
  const pool = DATE_PLANS[event.type] ?? DATE_PLANS.default!;
  const seed = event.name.length + event.date.length + event.type.length;

  return {
    datePlan: `${meta.emoji} ${pick(pool, seed)}`,
    budget: pick(BUDGETS, seed + 1),
    schedule: pick(SCHEDULES, seed + 2),
    surprises: pick(SURPRISES, seed + 3),
    backup: pick(BACKUPS, seed + 4),
    generatedAt: new Date().toISOString(),
  };
}

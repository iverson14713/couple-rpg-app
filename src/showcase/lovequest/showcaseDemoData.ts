import type { DateItineraryPlan } from '../../coupleRpg/lib/dateItineraryAiModel';
import type { SavedDateItineraryAi } from '../../coupleRpg/storage/dateItineraryAiCache';
import { todayKey } from '../../coupleRpg/lib/dates';

/** 與 App 內 AI 約會結果結構一致（供 DateItineraryAiResult 展示） */
export const SHOWCASE_DATE_PLAN: DateItineraryPlan = {
  title: '週末浪漫一日遊',
  segments: [
    { period: '上午', place: '華山文創園區', activity: '手作市集 · 拍照打卡' },
    { period: '下午', place: '大安森林公園', activity: '野餐 · 散步聊天' },
    { period: '晚餐', place: '信義區景觀餐廳', activity: '燭光晚餐 · 紀念日驚喜' },
  ],
  tips: ['可準備小卡片寫下想說的話', '傍晚光線最適合拍照'],
  budget: '約 NT$ 2,000–3,500',
};

export const SHOWCASE_DATE_AI_RECORD: SavedDateItineraryAi = {
  savedAt: new Date().toISOString(),
  dateKey: todayKey(),
  suggestion: {
    id: 'showcase-date-idea',
    title: '週末城市漫遊',
    emoji: '✨',
    description: '輕鬆走走 · 好吃好拍',
    scenario: 'urban',
    cost: 'mid',
    duration: 'full',
    tags: ['food', 'walk'],
  },
  plan: SHOWCASE_DATE_PLAN,
  settings: {
    departure: '台北車站',
    budget: 'mid',
    customBudget: '',
    transport: 'mrt',
    style: 'romantic',
    partnerPrefs: '喜歡安靜、不趕行程',
  },
};

import type { ComponentType } from 'react';
import {
  ShowcaseAiDateScreen,
  ShowcaseGamesScreen,
  ShowcaseRemindersScreen,
  ShowcaseRpgScreen,
  ShowcaseSyncScreen,
} from './screens/ShowcaseRealScreens';

export type LoveQuestShowcaseSlide = {
  id: string;
  path: string;
  headline: string;
  subtitle: string;
  marketingTitle: string;
  marketingSubtitle: string;
  filename: string;
  Screen: ComponentType;
};

export const LOVEQUEST_SHOWCASE_SLIDES: LoveQuestShowcaseSlide[] = [
  {
    id: 'sync',
    path: '/showcase/sync',
    headline: '一起經營戀愛生活',
    subtitle: '同步晚餐、家事、AI 約會與每日互動',
    marketingTitle: '一起記錄戀愛生活',
    marketingSubtitle: '情侶同步 · 晚餐 · 家事 · AI 行程 · LoveCoin',
    filename: 'lovequest-01-sync.png',
    Screen: ShowcaseSyncScreen,
  },
  {
    id: 'ai-date',
    path: '/showcase/ai-date',
    headline: '不知道去哪約會？',
    subtitle: '交給 AI 幫你安排',
    marketingTitle: 'AI 幫你安排約會',
    marketingSubtitle: '一鍵產生浪漫約會行程',
    filename: 'lovequest-02-ai-date.png',
    Screen: ShowcaseAiDateScreen,
  },
  {
    id: 'reminders',
    path: '/showcase/reminders',
    headline: '紀念日提醒',
    subtitle: '提前幫你準備驚喜與安排',
    marketingTitle: '重要日子不再忘記',
    marketingSubtitle: '紀念日 · 生日 · 倒數提醒',
    filename: 'lovequest-03-reminders.png',
    Screen: ShowcaseRemindersScreen,
  },
  {
    id: 'rpg',
    path: '/showcase/rpg',
    headline: '一起升級感情',
    subtitle: '完成互動、累積 LoveCoin 與默契值',
    marketingTitle: '把戀愛變成雙人 RPG',
    marketingSubtitle: '等級 · 默契 · 愛心幣 · 任務',
    filename: 'lovequest-04-rpg.png',
    Screen: ShowcaseRpgScreen,
  },
  {
    id: 'games',
    path: '/showcase/games',
    headline: '戀愛不再無聊',
    subtitle: '每天都有新的互動與驚喜',
    marketingTitle: '每天都能互動',
    marketingSubtitle: '骰子 · 真心話 · 默契挑戰',
    filename: 'lovequest-05-games.png',
    Screen: ShowcaseGamesScreen,
  },
];

export function getShowcaseSlideById(id: string): LoveQuestShowcaseSlide | undefined {
  return LOVEQUEST_SHOWCASE_SLIDES.find((s) => s.id === id);
}

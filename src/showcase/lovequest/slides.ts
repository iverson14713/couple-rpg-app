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
  ipadFilename: string;
  /** iPad 左欄多行標題（可選，優先於 headline） */
  ipadHeadlineLines?: string[];
  /** iPad 左欄 pill 標籤（可選） */
  ipadPill?: string;
  /** iPad 左欄特色列表 */
  ipadBullets?: { icon: string; title: string; desc: string }[];
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
    ipadFilename: 'ipad-01-main.png',
    ipadPill: '同步晚餐 · 家事 · AI 約會 · 每日互動',
    ipadBullets: [
      { icon: '🍽️', title: '同步生活節奏', desc: '晚餐、家事一起安排' },
      { icon: '💑', title: 'AI 約會靈感', desc: '一鍵產生浪漫行程' },
      { icon: '💕', title: '每日互動成長', desc: 'LoveCoin 與默契值累積' },
    ],
    Screen: ShowcaseSyncScreen,
  },
  {
    id: 'ai-date',
    path: '/showcase/ai-date',
    headline: '不知道去哪約會？',
    subtitle: '交給 AI 幫你安排',
    ipadHeadlineLines: ['不知道去哪', '約會？'],
    marketingTitle: 'AI 幫你安排約會',
    marketingSubtitle: '一鍵產生浪漫約會行程',
    filename: 'lovequest-02-ai-date.png',
    ipadFilename: 'ipad-03-ai-date.png',
    ipadPill: '專屬行程推薦 · 貼心又浪漫',
    ipadBullets: [
      { icon: '✨', title: 'AI 約會規劃結果', desc: '專屬主題行程推薦' },
      { icon: '📅', title: '依時間 / 預算 / 氣氛', desc: '幫你找到最適合的約會' },
      { icon: '💗', title: '貼心建議與提醒', desc: '讓約會更順利更甜蜜' },
    ],
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
    ipadFilename: 'ipad-02-anniversary.png',
    ipadPill: '提前幫你準備驚喜與安排',
    ipadBullets: [
      { icon: '📅', title: '重要日子不錯過', desc: '生日、紀念日自動提醒' },
      { icon: '🔔', title: '提前準備超安心', desc: '貼心建議，完美安排' },
      { icon: '🎁', title: '打造專屬回憶', desc: '每個日子都值得慶祝' },
      { icon: '💗', title: '未來提醒更貼心', desc: '提前規劃，幸福加倍' },
    ],
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
    ipadFilename: 'ipad-04-level.png',
    ipadBullets: [
      { icon: '💕', title: '互動越多', desc: '感情經驗值越高' },
      { icon: '👑', title: '默契提升', desc: '解鎖更多專屬成就' },
      { icon: '🔥', title: '完成互動任務', desc: '培養甜蜜好習慣' },
    ],
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
    ipadFilename: 'ipad-05-custom-game.png',
    ipadPill: '自訂遊戲 · 專屬屬於你們的玩法',
    ipadBullets: [
      { icon: '🎲', title: '自訂情侶遊戲', desc: '自訂規則與獎勵' },
      { icon: '🎁', title: '專屬獎勵設定', desc: '完成任務換 LoveCoin' },
      { icon: '🎯', title: '多種遊戲模板', desc: '骰子、問答、挑戰' },
      { icon: '✏️', title: '自由編輯題目', desc: '加入專屬回憶與笑話' },
    ],
    Screen: ShowcaseGamesScreen,
  },
];

export function getShowcaseSlideById(id: string): LoveQuestShowcaseSlide | undefined {
  return LOVEQUEST_SHOWCASE_SLIDES.find((s) => s.id === id);
}

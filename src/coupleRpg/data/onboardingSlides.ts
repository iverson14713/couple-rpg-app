export type OnboardingSlide = {
  id: string;
  emoji: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  footnote?: string;
  footnoteMuted?: string;
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    emoji: '💕',
    title: 'LoveQuest',
    subtitle: '一起記錄、一起玩、一起安排生活',
    bullets: ['AI 約會規劃', '晚餐決定', '重要日子提醒', '情侶成長系統'],
  },
  {
    id: 'sync',
    emoji: '🔗',
    title: '情侶空間同步',
    subtitle: '邀請另一半加入後：',
    bullets: ['晚餐同步', '家事同步', 'AI 行程共享', 'LoveCoin 一起累積'],
    footnote: '同一個情侶空間，兩人資料會自動同步',
  },
  {
    id: 'ai',
    emoji: '✨',
    title: 'AI 幫你少煩惱',
    bullets: ['AI 約會規劃', 'AI 紀念日安排', 'AI 分享卡', 'AI 紀錄與收藏'],
    footnote: '每日有免費 AI 次數',
    footnoteMuted: '更多 AI 回憶功能即將推出',
  },
  {
    id: 'reminders',
    emoji: '🔔',
    title: '不再忘記重要日子',
    subtitle: '可設定：',
    bullets: ['當天提醒', '前 1 / 3 / 7 / 14 / 30 天提醒'],
    footnote: '目前：打開 App 時會提醒',
    footnoteMuted: '正式推播通知將於後續版本加入',
  },
  {
    id: 'growth',
    emoji: '❤️',
    title: '一起升級感情等級',
    subtitle: '完成：',
    bullets: ['家事', '約會', '戀愛任務', '小遊戲'],
    footnote: '可獲得 LoveCoin、默契值、情侶等級',
  },
];

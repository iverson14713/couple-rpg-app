import type { LoveTaskTemplate } from './loveTaskPool';

/** Lv.2+ 解鎖：默契型任務（加入每日抽選池，非全部替換） */
export const LOVE_TASK_POOL_CHEMISTRY: LoveTaskTemplate[] = [
  { id: 'tp-chem-food', label: '猜猜對方今天最想吃什麼', emoji: '🍽️', kind: 'chemistry' },
  { id: 'tp-chem-need', label: '問對方今天最需要的是鼓勵、陪伴還是休息', emoji: '💬', kind: 'chemistry' },
  { id: 'tp-chem-mood', label: '互相說出今天心情 1～10 分', emoji: '📊', kind: 'chemistry' },
  { id: 'tp-chem-trip', label: '猜對方最近最想去哪裡', emoji: '🗺️', kind: 'chemistry' },
  { id: 'tp-chem-understand', label: '問對方今天有沒有一件想被理解的事', emoji: '🫶', kind: 'chemistry' },
  { id: 'tp-chem-bedtime', label: '今天睡前問對方一個小問題', emoji: '🌙', kind: 'chemistry' },
  { id: 'tp-chem-chat', label: '猜對方現在比較想聊天還是安靜', emoji: '🤫', kind: 'chemistry' },
  { id: 'tp-chem-hard', label: '說出你覺得對方最近最辛苦的一件事', emoji: '💗', kind: 'chemistry' },
  { id: 'tp-chem-care', label: '問對方今天最想被怎麼照顧', emoji: '🤲', kind: 'chemistry' },
  { id: 'tp-chem-week', label: '猜對方這週最期待的一件事', emoji: '✨', kind: 'chemistry' },
];

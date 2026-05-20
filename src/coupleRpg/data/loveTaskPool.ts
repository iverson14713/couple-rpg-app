/** App Store–safe daily love task pool (wholesome, non-explicit). */
export type LoveTaskTemplate = {
  id: string;
  label: string;
  emoji: string;
};

export const LOVE_TASK_POOL: LoveTaskTemplate[] = [
  { id: 'tp-praise', label: '稱讚對方一次', emoji: '✨' },
  { id: 'tp-hug', label: '擁抱 10 秒', emoji: '🤗' },
  { id: 'tp-walk', label: '一起散步 10 分鐘', emoji: '🚶' },
  { id: 'tp-thanks', label: '睡前說一句感謝', emoji: '🌙' },
  { id: 'tp-photo', label: '一起拍一張合照', emoji: '📸' },
  { id: 'tp-message', label: '傳一則甜蜜訊息', emoji: '💌' },
  { id: 'tp-hand', label: '牽手走路 5 分鐘', emoji: '💑' },
  { id: 'tp-tea', label: '幫對方泡一杯飲料', emoji: '🍵' },
  { id: 'tp-listen', label: '專心聽對方分享 5 分鐘', emoji: '👂' },
  { id: 'tp-smile', label: '對視微笑 10 秒', emoji: '😊' },
  { id: 'tp-plan', label: '一起規劃週末小活動', emoji: '📅' },
  { id: 'tp-note', label: '寫一張小紙條鼓勵對方', emoji: '📝' },
  { id: 'tp-cook', label: '一起準備一道簡單小菜', emoji: '🥗' },
  { id: 'tp-song', label: '分享一首喜歡的歌給對方', emoji: '🎵' },
  { id: 'tp-clean', label: '一起整理桌面 5 分鐘', emoji: '🧹' },
];

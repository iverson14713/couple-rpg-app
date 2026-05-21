/** 任務頁 UI 文案（不寫入 localStorage） */
export const TASK_PAGE_ENCOURAGEMENTS = [
  '完成一件小事，就讓今天更甜一點。',
  '今天的小任務，是讓彼此多一點溫柔。',
] as const;

/** 依 templateId 顯示簡短說明 */
export const TASK_TEMPLATE_HINTS: Record<string, string> = {
  'tp-praise': '真心說出對方今天讓你開心的一點',
  'tp-hug': '安靜擁抱一下，讓彼此感受溫度',
  'tp-walk': '一起走走，聊聊今天的小事',
  'tp-thanks': '睡前用一句話謝謝對方今天的陪伴',
  'tp-photo': '留下一張今天專屬你們的合照',
  'tp-message': '傳一則讓對方會心一笑的訊息',
  'tp-hand': '牽著手走一小段路，放慢節奏',
  'tp-tea': '為對方泡杯飲料，順便聊幾句',
  'tp-listen': '放下手機，專心聽對方說說今天',
  'tp-smile': '對視微笑，享受幾秒只有你們的時刻',
  'tp-plan': '一起想想週末想做的一件小事',
  'tp-note': '把今天想對對方說的話寫下來',
  'tp-cook': '一起準備一道簡單小菜，分工合作',
  'tp-song': '分享一首此刻想給對方聽的歌',
  'tp-clean': '一起整理桌面或角落，五分鐘就好',
};

export function taskHintForTemplate(templateId: string, label: string): string {
  return TASK_TEMPLATE_HINTS[templateId] ?? `一起完成「${label}」，讓今天多一點甜蜜`;
}

export function pickTaskEncouragement(dateKey: string): string {
  const n = dateKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return TASK_PAGE_ENCOURAGEMENTS[n % TASK_PAGE_ENCOURAGEMENTS.length];
}

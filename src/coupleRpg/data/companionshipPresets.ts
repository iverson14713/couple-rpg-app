import { todayKey } from '../lib/dates';

export type CompanionshipPresetType =
  | 'heart'
  | 'goodnight'
  | 'hug'
  | 'missing'
  | 'call'
  | 'meal'
  | 'walk'
  | 'sleep_thinking'
  | 'goodmorning'
  | 'cheer'
  | 'featured'
  | 'kiss'
  | 'random';

export type CompanionshipPreset = {
  type: CompanionshipPresetType | 'random';
  icon: string;
  label: string;
  message: string;
  hint?: string;
};

/** 主要陪伴卡片（不含今日推薦、AI 挑句） */
export const COMPANIONSHIP_PRESETS: readonly CompanionshipPreset[] = [
  { type: 'heart', icon: '❤️', label: '今天也想你', message: '今天一直想到你。' },
  { type: 'goodnight', icon: '🌙', label: '晚安', message: '希望今晚夢到我。' },
  { type: 'hug', icon: '🫂', label: '想抱抱', message: '今天可以抱一下嗎？' },
  { type: 'missing', icon: '☕', label: '想你', message: '剛剛突然想到你。' },
  { type: 'call', icon: '📞', label: '想聽你的聲音', message: '有空打給我嗎？' },
  { type: 'meal', icon: '🍜', label: '想一起吃飯', message: '下次一起去吃好吃的。' },
  { type: 'walk', icon: '🚶', label: '想一起散步', message: '今天一起出去走走。' },
  {
    type: 'sleep_thinking',
    icon: '💤',
    label: '睡前想你',
    message: '今天最後想到的人還是你。',
  },
  { type: 'goodmorning', icon: '🌅', label: '早安', message: '今天也一起加油。' },
  { type: 'cheer', icon: '🔥', label: '今天辛苦了', message: '抱一下好嗎？' },
] as const;

export const AI_COMPANIONSHIP_PICK_PRESET: CompanionshipPreset = {
  type: 'random',
  icon: '🎲',
  label: 'AI 幫我挑一句',
  message: '',
  hint: '不知道傳什麼？AI 幫你挑一句今天最適合的陪伴。',
};

const DAILY_FEATURED_POOL: ReadonlyArray<{ title: string; quote: string }> = [
  { title: '今天工作辛苦了', quote: '今天真的辛苦了，我一直都在。' },
  { title: '今天也想你', quote: '每隔一陣子就會想起你的笑。' },
  { title: '想陪你放鬆一下', quote: '今天辛苦了，晚點一起好好休息。' },
  { title: '今天過得怎麼樣', quote: '想聽聽你今天的故事。' },
  { title: '有點想你了', quote: '沒什麼原因，就是突然很想你。' },
  { title: '今天也要開心', quote: '希望你今天都被溫柔對待。' },
  { title: '想給你抱抱', quote: '如果我在身邊，現在就想抱你。' },
  { title: '今天辛苦了', quote: '你已經做得很好了，我知道。' },
];

const SUCCESS_CELEBRATION_LINES = [
  '已把你的心意送出去～',
  '希望他看到會笑一下 ❤️',
] as const;

const TYPE_ICONS: Record<string, string> = {
  heart: '❤️',
  goodnight: '🌙',
  hug: '🫂',
  missing: '☕',
  call: '📞',
  meal: '🍜',
  walk: '🚶',
  sleep_thinking: '💤',
  goodmorning: '🌅',
  cheer: '🔥',
  featured: '❤️',
  kiss: '😘',
  random: '🎲',
  custom: '✍️',
};

function hashDateKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getCompanionshipDailyFeatured(dateKey: string = todayKey()) {
  const idx = hashDateKey(dateKey) % DAILY_FEATURED_POOL.length;
  return DAILY_FEATURED_POOL[idx]!;
}

export function buildDailyFeaturedPreset(dateKey: string = todayKey()): CompanionshipPreset {
  const featured = getCompanionshipDailyFeatured(dateKey);
  return {
    type: 'featured',
    icon: '❤️',
    label: featured.title,
    message: featured.quote,
  };
}

export function pickAiCompanionshipLine(): CompanionshipPreset {
  const pool = COMPANIONSHIP_PRESETS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function pickCompanionshipSuccessLine(): string {
  return SUCCESS_CELEBRATION_LINES[
    Math.floor(Math.random() * SUCCESS_CELEBRATION_LINES.length)
  ]!;
}

export function resolveCompanionshipSend(
  preset: CompanionshipPreset
): { type: string; icon: string; message: string } {
  if (preset.type !== 'random') {
    return { type: preset.type, icon: preset.icon, message: preset.message };
  }
  const pick = pickAiCompanionshipLine();
  return { type: pick.type, icon: pick.icon, message: pick.message };
}

export function companionshipTypeIcon(type: string): string {
  if (type === 'custom') return '✍️';
  return TYPE_ICONS[type] ?? COMPANIONSHIP_PRESETS.find((p) => p.type === type)?.icon ?? '💗';
}

export function companionshipReceivedHeadline(type: string): string {
  if (type === 'kiss') return '😘 對方親了你一下';
  if (type === 'featured') return '💕 對方送了今日陪伴';
  return '💗 對方陪伴了你一下';
}

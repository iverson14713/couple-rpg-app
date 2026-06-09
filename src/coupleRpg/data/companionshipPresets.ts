export type CompanionshipPresetType = 'heart' | 'goodnight' | 'missing' | 'kiss' | 'cheer';

export type CompanionshipPreset = {
  type: CompanionshipPresetType | 'random';
  icon: string;
  label: string;
  message: string;
};

export const COMPANIONSHIP_PRESETS: readonly CompanionshipPreset[] = [
  { type: 'heart', icon: '❤️', label: '愛心', message: '今天也想你' },
  { type: 'goodnight', icon: '🌙', label: '晚安', message: '快睡覺啦' },
  { type: 'missing', icon: '☕', label: '想你', message: '剛剛想到你' },
  { type: 'kiss', icon: '😘', label: '親一下', message: '給你一個親親' },
  { type: 'cheer', icon: '🔥', label: '辛苦了', message: '今天辛苦了' },
  { type: 'random', icon: '🎲', label: '隨機一句', message: '' },
] as const;

const RANDOM_POOL = COMPANIONSHIP_PRESETS.filter((p) => p.type !== 'random');

export function resolveCompanionshipSend(
  preset: CompanionshipPreset
): { type: string; icon: string; message: string } {
  if (preset.type !== 'random') {
    return { type: preset.type, icon: preset.icon, message: preset.message };
  }
  const pick = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)]!;
  return { type: pick.type, icon: pick.icon, message: pick.message };
}

export function companionshipTypeIcon(type: string): string {
  if (type === 'custom') return '✍️';
  return COMPANIONSHIP_PRESETS.find((p) => p.type === type)?.icon ?? '💗';
}

export function companionshipSendSuccessMessage(type: string): string {
  if (type === 'heart') return '愛心已送出 ❤️';
  if (type === 'kiss') return '親親已送出 😘';
  return '已陪伴對方 💗';
}

export function companionshipReceivedHeadline(type: string): string {
  if (type === 'kiss') return '😘 對方親了你一下';
  return '💗 對方陪伴了你一下';
}

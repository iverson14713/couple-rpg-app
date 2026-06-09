export type CompanionshipPresetType = 'heart' | 'goodnight' | 'missing' | 'cheer';

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

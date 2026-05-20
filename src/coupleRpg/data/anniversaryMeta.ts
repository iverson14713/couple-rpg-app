import type { AnniversaryEventType } from '../storage/anniversaryTypes';

export const ANNIVERSARY_TYPE_OPTIONS: {
  value: AnniversaryEventType;
  label: string;
  emoji: string;
  defaultRepeatYearly: boolean;
  /** Suggested MM-DD for fixed holidays */
  suggestedDate?: string;
}[] = [
  { value: 'relationship', label: '交往紀念日', emoji: '💕', defaultRepeatYearly: true },
  { value: 'birthday', label: '生日', emoji: '🎂', defaultRepeatYearly: true },
  { value: 'valentine', label: '情人節', emoji: '🌹', defaultRepeatYearly: true, suggestedDate: '02-14' },
  { value: 'christmas', label: '聖誕節', emoji: '🎄', defaultRepeatYearly: true, suggestedDate: '12-25' },
  { value: 'qixi', label: '七夕', emoji: '🌌', defaultRepeatYearly: true, suggestedDate: '08-22' },
  { value: 'important', label: '重要約會', emoji: '✨', defaultRepeatYearly: false },
  { value: 'other', label: '其他', emoji: '📌', defaultRepeatYearly: true },
];

export function typeMeta(type: AnniversaryEventType) {
  return ANNIVERSARY_TYPE_OPTIONS.find((o) => o.value === type) ?? ANNIVERSARY_TYPE_OPTIONS[6]!;
}

import { todayKey } from './dates';

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBeforeToday(dateKey: string, today: string = todayKey()): number {
  const target = parseDateKey(dateKey);
  const base = parseDateKey(today);
  target.setHours(0, 0, 0, 0);
  base.setHours(0, 0, 0, 0);
  return Math.round((base.getTime() - target.getTime()) / 86400000);
}

export function formatDinnerRelativeDay(dateKey: string, today: string = todayKey()): string {
  const diff = daysBeforeToday(dateKey, today);
  if (diff <= 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff === 2) return '前天';
  return `${diff}天前`;
}

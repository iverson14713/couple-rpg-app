import { todayKey } from './dates';

/** 每週一 00:00 起算（本地曆日） */
export function getWeekStartDateMonday(ref: Date = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const dow = d.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return todayKey(d);
}

/** 本週 Mon～Sun 的 dateKey（含 weekStart 共 7 天） */
export function enumerateWeekDateKeys(weekStartDate: string): string[] {
  const parts = weekStartDate.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const day = parts[2];
  if (!y || !m || !day) return [weekStartDate];

  const start = new Date(y, m - 1, day);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    keys.push(todayKey(dt));
  }
  return keys;
}

export function isDateKeyInWeek(dateKey: string, weekStartDate: string): boolean {
  const keys = enumerateWeekDateKeys(weekStartDate);
  return keys.includes(dateKey);
}

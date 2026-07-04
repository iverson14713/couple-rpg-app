/** App memory calendar day (今日小回憶 / LoveBook Lite). */
export const DAILY_NOTE_TIMEZONE = 'Asia/Taipei';

export const DAILY_NOTE_MAX_LENGTH = 200;

export const DAILY_MEMORY_FREE_MONTHLY_LIMIT = 10;
export const DAILY_MEMORY_PRO_MONTHLY_LIMIT = 30;

/** YYYY-MM-DD in the configured timezone (default Asia/Taipei). */
export function todayNoteDateKey(ref = new Date(), timeZone = DAILY_NOTE_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(ref);
}

export function yearMonthFromNoteDate(noteDate: string): string {
  return noteDate.slice(0, 7);
}

export function offsetNoteDateKey(days: number, base?: string, timeZone = DAILY_NOTE_TIMEZONE): string {
  const src = base ?? todayNoteDateKey(new Date(), timeZone);
  const [y, m, d] = src.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const next = new Date(utc);
  next.setUTCDate(next.getUTCDate() + days);
  return todayNoteDateKey(next, timeZone);
}

export function formatNoteDateLabel(noteDate: string, today = todayNoteDateKey()): string {
  const yesterday = offsetNoteDateKey(-1, today);
  if (noteDate === today) return '今天';
  if (noteDate === yesterday) return '昨天';
  const [, month, day] = noteDate.split('-');
  return `${Number(month)}/${Number(day)}`;
}

/** Local hour in Asia/Taipei (0–23). */
export function taipeiHour(ref = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DAILY_NOTE_TIMEZONE,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(ref);
  return Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
}

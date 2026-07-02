import { todayKey } from '../../lib/dates';

const STORAGE_KEY = 'lq-heart-circle-daily-v1';
export const HEART_CIRCLE_DAILY_CAP = 5;

type DailyRecord = {
  date: string;
  count: number;
};

function readRecord(): DailyRecord {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today, count: 0 };
    const parsed = JSON.parse(raw) as DailyRecord;
    if (parsed.date !== today) return { date: today, count: 0 };
    return { date: today, count: Math.max(0, parsed.count) };
  } catch {
    return { date: today, count: 0 };
  }
}

export function getHeartCircleDailyStats(): { today: number; cap: number } {
  const rec = readRecord();
  return { today: rec.count, cap: HEART_CIRCLE_DAILY_CAP };
}

/** 本局結束時呼叫，回傳更新後的今日場次 */
export function recordHeartCircleGamePlayed(): { today: number; cap: number } {
  const rec = readRecord();
  const next = { date: rec.date, count: rec.count + 1 };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return { today: next.count, cap: HEART_CIRCLE_DAILY_CAP };
}

import type { CoupleDailyNote } from '../storage/dailyNotesTypes';

export type DailyNoteMonthBucket = {
  year: number;
  month: number;
  count: number;
};

export type DailyNoteYearShelf = {
  year: number;
  months: DailyNoteMonthBucket[];
};

export function groupDailyNotesByYearMonth(notes: CoupleDailyNote[]): DailyNoteYearShelf[] {
  const monthMap = new Map<string, DailyNoteMonthBucket>();

  for (const note of notes) {
    const [yearStr, monthStr] = note.noteDate.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(month)) continue;

    const key = `${year}-${month}`;
    const prev = monthMap.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      monthMap.set(key, { year, month, count: 1 });
    }
  }

  const yearMap = new Map<number, DailyNoteMonthBucket[]>();
  for (const bucket of monthMap.values()) {
    const months = yearMap.get(bucket.year) ?? [];
    months.push(bucket);
    yearMap.set(bucket.year, months);
  }

  return [...yearMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, months]) => ({
      year,
      months: months.sort((a, b) => b.month - a.month),
    }));
}

export function filterDailyNotesByMonth(
  notes: CoupleDailyNote[],
  year: number,
  month: number
): CoupleDailyNote[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return notes
    .filter((note) => note.noteDate.startsWith(prefix))
    .sort((a, b) => b.noteDate.localeCompare(a.noteDate));
}

export function monthTitle(year: number, month: number): string {
  return `${year} 年 ${month} 月`;
}

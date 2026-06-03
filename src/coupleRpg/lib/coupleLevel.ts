/** Phase 3A：情侶等級門檻（累積 totalExp） */
export const COUPLE_LEVEL_THRESHOLDS = [
  { level: 1, title: '初識冒險者', minExp: 0 },
  { level: 2, title: '默契新手', minExp: 100 },
  { level: 3, title: '甜蜜搭檔', minExp: 350 },
  { level: 4, title: '靈魂隊友', minExp: 900 },
  { level: 5, title: '傳說情侶', minExp: 1800 },
] as const;

export const MAX_COUPLE_LEVEL = 5;

export const DAILY_EXP_CAP = 80;

export const LEVEL_UNLOCK_LINES: Record<number, string> = {
  2: '默契型任務',
  3: '任務連擊加成',
  4: '每週情侶挑戰',
  5: '情侶回顧卡',
};

export function levelFromTotalExp(totalExp: number): number {
  const exp = Math.max(0, Math.floor(totalExp));
  let level = 1;
  for (const row of COUPLE_LEVEL_THRESHOLDS) {
    if (exp >= row.minExp) level = row.level;
  }
  return Math.min(level, MAX_COUPLE_LEVEL);
}

export function levelTitle(level: number): string {
  const row = COUPLE_LEVEL_THRESHOLDS.find((r) => r.level === level);
  return row?.title ?? COUPLE_LEVEL_THRESHOLDS[0].title;
}

export function nextLevelInfo(level: number): {
  nextLevel: number | null;
  nextTitle: string | null;
  nextMinExp: number | null;
} {
  if (level >= MAX_COUPLE_LEVEL) {
    return { nextLevel: null, nextTitle: null, nextMinExp: null };
  }
  const next = COUPLE_LEVEL_THRESHOLDS.find((r) => r.level === level + 1);
  return {
    nextLevel: next?.level ?? null,
    nextTitle: next?.title ?? null,
    nextMinExp: next?.minExp ?? null,
  };
}

export function nextUnlockPreview(level: number): string {
  const target = Math.min(level + 1, MAX_COUPLE_LEVEL);
  const unlock = LEVEL_UNLOCK_LINES[target];
  if (!unlock) return '已達最高等級';
  return `Lv.${target} 解鎖：${unlock}`;
}

export function expProgressInLevel(totalExp: number): {
  level: number;
  title: string;
  expInLevel: number;
  expNeeded: number;
  progressPct: number;
  expToNext: number;
  nextLevel: number | null;
  nextTitle: string | null;
  nextUnlockText: string;
} {
  const level = levelFromTotalExp(totalExp);
  const title = levelTitle(level);
  const cur = COUPLE_LEVEL_THRESHOLDS.find((r) => r.level === level)!;
  const next = nextLevelInfo(level);

  if (!next.nextMinExp) {
    return {
      level,
      title,
      expInLevel: totalExp - cur.minExp,
      expNeeded: 0,
      progressPct: 100,
      expToNext: 0,
      nextLevel: null,
      nextTitle: null,
      nextUnlockText: '已達最高等級',
    };
  }

  const expInLevel = totalExp - cur.minExp;
  const expNeeded = next.nextMinExp - cur.minExp;
  const expToNext = Math.max(0, next.nextMinExp - totalExp);
  const progressPct = expNeeded > 0 ? Math.min(100, Math.round((expInLevel / expNeeded) * 100)) : 100;

  return {
    level,
    title,
    expInLevel,
    expNeeded,
    progressPct,
    expToNext,
    nextLevel: next.nextLevel,
    nextTitle: next.nextTitle,
    nextUnlockText: nextUnlockPreview(level),
  };
}

export function levelUnlockLine(level: number): string {
  return LEVEL_UNLOCK_LINES[level] ?? '';
}

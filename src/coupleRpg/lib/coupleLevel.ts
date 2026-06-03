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

/** 等級卡：已解鎖／下一級預覽文案 */
export function levelCardUnlockLine(level: number): string {
  if (level >= 5) return `已解鎖：${LEVEL_UNLOCK_LINES[5]}`;
  if (level >= 4) return `已解鎖：${LEVEL_UNLOCK_LINES[4]}`;
  if (level >= 3) return `已解鎖：${LEVEL_UNLOCK_LINES[3]}`;
  if (level >= 2) return `已解鎖：${LEVEL_UNLOCK_LINES[2]}`;
  return `Lv.2 解鎖：${LEVEL_UNLOCK_LINES[2]}`;
}

/** 等級卡附加：本週挑戰進度（Lv.4+） */
export function weeklyChallengeProgressLine(progress: number, target: number): string {
  return `本週挑戰 ${Math.min(progress, target)}/${target}`;
}

export function nextUnlockPreview(level: number): string {
  return levelCardUnlockLine(level);
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
      nextUnlockText: `已解鎖：${LEVEL_UNLOCK_LINES[5]}`,
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

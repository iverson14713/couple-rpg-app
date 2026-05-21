function parseYmd(s: string): { y: number; m: number; d: number } | null {
  const t = s.trim();
  if (!t) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
}

const FIXED_MILESTONES = [100, 365, 500, 1000] as const;

function allMilestones(): number[] {
  const set = new Set<number>(FIXED_MILESTONES);
  for (let y = 2; y <= 30; y++) set.add(y * 365);
  return [...set].sort((a, b) => a - b);
}

export function milestoneLabel(targetDay: number): string {
  if (targetDay === 365) return '一週年';
  if (targetDay === 730) return '兩週年';
  if (targetDay === 1095) return '三週年';
  if (targetDay % 365 === 0 && targetDay >= 365) {
    const years = targetDay / 365;
    return `${years} 週年`;
  }
  return `${targetDay} 天`;
}

export type TogetherDaysInfo =
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'future' }
  | { kind: 'active'; days: number; milestoneHint: string | null };

/** 在一起天數（含紀念日當天為第 1 天）與下一個里程碑提示。 */
export function getTogetherDaysInfo(relationshipStart: string, from: Date = new Date()): TogetherDaysInfo {
  const raw = relationshipStart.trim();
  if (!raw) return { kind: 'none' };

  const p = parseYmd(raw);
  if (!p) return { kind: 'invalid' };

  const start = new Date(p.y, p.m - 1, p.d, 12, 0, 0, 0);
  if (Number.isNaN(start.getTime())) return { kind: 'invalid' };

  const diff = Math.round((startOfLocalDay(from) - startOfLocalDay(start)) / 86400000);
  if (diff < 0) return { kind: 'future' };

  const days = diff + 1;
  const milestones = allMilestones();
  const next = milestones.find((m) => m > days);
  const milestoneHint = next
    ? `距離${milestoneLabel(next)}還有 ${next - days} 天`
    : null;

  return { kind: 'active', days, milestoneHint };
}

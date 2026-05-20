import type { CoupleExtendedProfile } from '../storage/coupleExtendedTypes';

export type UpcomingImportant = {
  id: string;
  daysUntil: number;
  isToday: boolean;
  /** 今天顯示的完整一句（含句尾「！」） */
  todayLine: string;
  /** 倒數顯示的完整一句（含天數） */
  countdownLine: string;
};

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

/** Next calendar occurrence of month/day (annual), relative to `from` (date only). */
function daysUntilAnnualDate(ymd: string, from: Date): { daysUntil: number; isToday: boolean } | null {
  const p = parseYmd(ymd);
  if (!p) return null;
  const y0 = from.getFullYear();
  const candidates: Date[] = [];
  for (const y of [y0, y0 + 1]) {
    const dt = new Date(y, p.m - 1, p.d, 12, 0, 0, 0);
    if (!Number.isNaN(dt.getTime())) candidates.push(dt);
  }
  const t0 = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0).getTime();
  let best: Date | null = null;
  let bestDiff = Infinity;
  for (const dt of candidates) {
    const t = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0).getTime();
    const diff = Math.round((t - t0) / 86400000);
    if (diff >= 0 && diff < bestDiff) {
      bestDiff = diff;
      best = dt;
    }
  }
  if (best === null || bestDiff === Infinity) return null;
  return { daysUntil: bestDiff, isToday: bestDiff === 0 };
}

/** 首頁「重要日子」：另一半與共同紀念日等（不含「我的生日」）。 */
function hasHomeImportantDates(p: CoupleExtendedProfile): boolean {
  return Boolean(
    p.partnerBirthday.trim() ||
      p.relationshipStart.trim() ||
      p.weddingAnniversary.trim() ||
      p.firstDate.trim() ||
      p.customDates.some((c) => c.date.trim())
  );
}

type RawEvent = {
  id: string;
  ymd: string;
  todayLine: string;
  countdownLine: (days: number) => string;
};

/**
 * 首頁用：最近 1～3 個重要日子（不含使用者自己生日）。
 */
export function getUpcomingImportantDates(
  profile: CoupleExtendedProfile,
  from: Date = new Date()
): { items: UpcomingImportant[]; hasConfigured: boolean } {
  if (!hasHomeImportantDates(profile)) {
    return { items: [], hasConfigured: false };
  }

  const partner = profile.partnerNickname.trim() || '另一半';

  const raw: RawEvent[] = [];
  if (profile.partnerBirthday.trim()) {
    raw.push({
      id: 'partner-bd',
      ymd: profile.partnerBirthday.trim(),
      todayLine: `今天是${partner}的生日！`,
      countdownLine: (d) => `距離${partner}生日還有 ${d} 天`,
    });
  }
  if (profile.relationshipStart.trim()) {
    raw.push({
      id: 'together',
      ymd: profile.relationshipStart.trim(),
      todayLine: '今天是在一起紀念日！',
      countdownLine: (days) => `距離在一起紀念日還有 ${days} 天`,
    });
  }
  if (profile.weddingAnniversary.trim()) {
    raw.push({
      id: 'wedding',
      ymd: profile.weddingAnniversary.trim(),
      todayLine: '今天是結婚紀念日！',
      countdownLine: (days) => `距離結婚紀念日還有 ${days} 天`,
    });
  }
  if (profile.firstDate.trim()) {
    raw.push({
      id: 'first-date',
      ymd: profile.firstDate.trim(),
      todayLine: '今天是第一次約會日！',
      countdownLine: (days) => `距離第一次約會日還有 ${days} 天`,
    });
  }
  for (const c of profile.customDates) {
    if (!c.date.trim()) continue;
    const name = c.name.trim() || '重要日子';
    raw.push({
      id: `c-${c.id}`,
      ymd: c.date.trim(),
      todayLine: `今天是${name}！`,
      countdownLine: (days) => `距離${name}還有 ${days} 天`,
    });
  }

  const items: UpcomingImportant[] = [];
  for (const r of raw) {
    const next = daysUntilAnnualDate(r.ymd, from);
    if (!next) continue;
    items.push({
      id: r.id,
      daysUntil: next.daysUntil,
      isToday: next.isToday,
      todayLine: r.todayLine,
      countdownLine: r.countdownLine(next.daysUntil),
    });
  }

  items.sort((a, b) => {
    if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
    return a.daysUntil - b.daysUntil;
  });

  return { items: items.slice(0, 3), hasConfigured: true };
}

/** 首頁抬頭：情侶資料暱稱（無則預設「我・另一半」）。 */
export function formatHomeCoupleHeaderLine(profile: CoupleExtendedProfile): string {
  const my = profile.myNickname.trim();
  const partner = profile.partnerNickname.trim();
  if (my && partner) return `❤️ ${my}・${partner}`;
  if (my) return `❤️ ${my}・另一半`;
  if (partner) return `❤️ 我・${partner}`;
  return `❤️ 我・另一半`;
}

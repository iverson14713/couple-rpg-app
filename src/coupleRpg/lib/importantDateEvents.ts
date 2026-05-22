import type { CoupleExtendedProfile } from '../storage/coupleExtendedTypes';

export type ImportantDateKind =
  | 'partner_birthday'
  | 'together'
  | 'wedding'
  | 'first_date'
  | 'custom';

export type ImportantDateStatus = 'today' | 'upcoming' | 'past';

export type ImportantDateEvent = {
  id: string;
  kind: ImportantDateKind;
  icon: string;
  name: string;
  displayTitle: string;
  dateYmd: string;
  dateLabel: string;
  daysUntil: number;
  daysSince: number;
  isToday: boolean;
  status: ImportantDateStatus;
  typeLabel: string;
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

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
}

function daysUntilAnnualDate(ymd: string, from: Date): { daysUntil: number; isToday: boolean } | null {
  const p = parseYmd(ymd);
  if (!p) return null;
  const y0 = from.getFullYear();
  const candidates: Date[] = [];
  for (const y of [y0, y0 + 1]) {
    const dt = new Date(y, p.m - 1, p.d, 12, 0, 0, 0);
    if (!Number.isNaN(dt.getTime())) candidates.push(dt);
  }
  const t0 = startOfDay(from);
  let bestDiff = Infinity;
  for (const dt of candidates) {
    const t = startOfDay(dt);
    const diff = Math.round((t - t0) / 86400000);
    if (diff >= 0 && diff < bestDiff) bestDiff = diff;
  }
  if (bestDiff === Infinity) return null;
  return { daysUntil: bestDiff, isToday: bestDiff === 0 };
}

function daysSinceLastAnnualDate(ymd: string, from: Date): number | null {
  const p = parseYmd(ymd);
  if (!p) return null;
  const y0 = from.getFullYear();
  const candidates: Date[] = [];
  for (const y of [y0, y0 - 1]) {
    const dt = new Date(y, p.m - 1, p.d, 12, 0, 0, 0);
    if (!Number.isNaN(dt.getTime())) candidates.push(dt);
  }
  const t0 = startOfDay(from);
  let best: number | null = null;
  for (const dt of candidates) {
    const t = startOfDay(dt);
    const diff = Math.round((t0 - t) / 86400000);
    if (diff >= 0 && (best === null || diff < best)) best = diff;
  }
  return best;
}

export function formatYmdLabel(ymd: string): string {
  const p = parseYmd(ymd);
  if (!p) return ymd;
  return `${p.m}/${p.d}`;
}

/** 首頁卡片用：例如 3月14日 */
export function formatYmdChinese(ymd: string): string {
  const p = parseYmd(ymd);
  if (!p) return ymd;
  return `${p.m}月${p.d}日`;
}

function resolveStatus(isToday: boolean, daysUntil: number, daysSince: number): ImportantDateStatus {
  if (isToday) return 'today';
  if (daysSince > 0 && daysSince <= 14 && daysUntil > 30) return 'past';
  return 'upcoming';
}

const STATUS_LABEL: Record<ImportantDateStatus, string> = {
  today: '今天',
  upcoming: '即將到來',
  past: '已過',
};

export function statusLabel(status: ImportantDateStatus): string {
  return STATUS_LABEL[status];
}

type RawDef = {
  id: string;
  kind: ImportantDateKind;
  ymd: string;
  icon: string;
  name: string;
  displayTitle: string;
  typeLabel: string;
};

/** 由情侶資料組出提醒中心用的重要日子（含另一半生日與紀念日，不含我的生日） */
export function buildImportantDateEvents(
  profile: CoupleExtendedProfile,
  from: Date = new Date()
): ImportantDateEvent[] {
  const partner = profile.partnerNickname.trim() || '另一半';
  const raw: RawDef[] = [];

  if (profile.partnerBirthday.trim()) {
    raw.push({
      id: 'partner-bd',
      kind: 'partner_birthday',
      ymd: profile.partnerBirthday.trim(),
      icon: '🎂',
      name: `${partner}生日`,
      displayTitle: `${partner}生日`,
      typeLabel: '生日',
    });
  }
  if (profile.relationshipStart.trim()) {
    raw.push({
      id: 'together',
      kind: 'together',
      ymd: profile.relationshipStart.trim(),
      icon: '💕',
      name: '在一起紀念日',
      displayTitle: '在一起紀念日',
      typeLabel: '在一起紀念日',
    });
  }
  if (profile.weddingAnniversary.trim()) {
    raw.push({
      id: 'wedding',
      kind: 'wedding',
      ymd: profile.weddingAnniversary.trim(),
      icon: '💍',
      name: '結婚紀念日',
      displayTitle: '結婚紀念日',
      typeLabel: '結婚紀念日',
    });
  }
  if (profile.firstDate.trim()) {
    raw.push({
      id: 'first-date',
      kind: 'first_date',
      ymd: profile.firstDate.trim(),
      icon: '☕',
      name: '第一次約會',
      displayTitle: '第一次約會',
      typeLabel: '第一次約會',
    });
  }
  for (const c of profile.customDates) {
    if (!c.date.trim()) continue;
    const name = c.name.trim() || '重要日子';
    raw.push({
      id: `c-${c.id}`,
      kind: 'custom',
      ymd: c.date.trim(),
      icon: '🎁',
      name,
      displayTitle: name,
      typeLabel: '自訂重要日子',
    });
  }

  const events: ImportantDateEvent[] = [];
  for (const r of raw) {
    const next = daysUntilAnnualDate(r.ymd, from);
    if (!next) continue;
    const since = daysSinceLastAnnualDate(r.ymd, from) ?? 0;
    events.push({
      id: r.id,
      kind: r.kind,
      icon: r.icon,
      name: r.name,
      displayTitle: r.displayTitle,
      dateYmd: r.ymd,
      dateLabel: formatYmdLabel(r.ymd),
      daysUntil: next.daysUntil,
      daysSince: since,
      isToday: next.isToday,
      status: resolveStatus(next.isToday, next.daysUntil, since),
      typeLabel: r.typeLabel,
    });
  }

  events.sort((a, b) => {
    if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
    if (a.status === 'past' && b.status !== 'past') return 1;
    if (b.status === 'past' && a.status !== 'past') return -1;
    return a.daysUntil - b.daysUntil;
  });

  return events;
}

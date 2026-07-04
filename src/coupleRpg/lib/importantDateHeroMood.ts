import type { ImportantDateEvent } from './importantDateEvents';

/** 下一個紀念日是第幾週年（依下次發生年份 − 起始年份）。 */
export function anniversaryOrdinal(dateYmd: string, daysUntil: number, from = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim());
  if (!m) return null;
  const startYear = Number(m[1]);
  if (!startYear) return null;
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + daysUntil, 12, 0, 0, 0);
  const n = next.getFullYear() - startYear;
  return n >= 1 ? n : null;
}

/** Hero 動態情緒文案（依倒數天數變化）。 */
export function importantDateHeroMood(event: ImportantDateEvent): string {
  if (event.isToday || event.status === 'today') {
    return '今天，好好陪陪對方吧 💕';
  }
  if (event.status === 'past' && event.daysSince === 1) {
    return '又一起創造了一段回憶 ✨';
  }
  if (event.status === 'past' && event.daysSince > 0 && event.daysSince <= 7) {
    return '又一起創造了一段回憶 ✨';
  }
  const d = event.daysUntil;
  if (d <= 0) return '今天，好好陪陪對方吧 💕';
  if (d <= 3) return '驚喜就在眼前了 ✨';
  if (d <= 7) return '準備好驚喜了嗎？🎁';
  if (d <= 14) return '可以開始悄悄準備了 💌';
  if (d <= 30) return '期待感慢慢升溫中 💗';
  return '慢慢期待，也是一種幸福 ❤️';
}

export function importantDateHeroSubline(event: ImportantDateEvent): string {
  if (event.isToday) return '就是今天';
  if (event.status === 'past') return `已過 ${event.daysSince} 天`;
  const ordinal =
    event.kind === 'together' || event.kind === 'wedding'
      ? anniversaryOrdinal(event.dateYmd, event.daysUntil)
      : null;
  if (ordinal != null && (event.kind === 'together' || event.kind === 'wedding')) {
    return `今年一起迎接第 ${ordinal} 個紀念日 ❤️`;
  }
  if (event.kind === 'partner_birthday') {
    return '今年一起慶祝這個特別的日子 🎂';
  }
  return `記得這一天：${event.dateLabel}`;
}

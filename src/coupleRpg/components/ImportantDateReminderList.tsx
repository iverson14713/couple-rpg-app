import type { ImportantDateScheduledReminder } from '../lib/importantDateReminderEngine';
import { formatYmdChinese } from '../lib/importantDateEvents';
import { lq } from '../theme';

type Props = {
  items: ImportantDateScheduledReminder[];
  variant: 'today' | 'future';
  onDismiss?: (id: string) => void;
};

export function ImportantDateReminderList({ items, variant, onDismiss }: Props) {
  if (items.length === 0) return null;

  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <li
          key={r.id}
          className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${
            variant === 'today'
              ? 'border-amber-200/80 bg-amber-50/70'
              : 'border-rose-100/60 bg-white/60'
          }`}
        >
          <span className="text-xl leading-none" aria-hidden>
            {r.event.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[14px] font-bold ${lq.text}`}>{r.event.displayTitle}</p>
            <p className={`text-[12px] ${lq.textSecondary}`}>
              📆 {formatYmdChinese(r.event.dateYmd)} ·{' '}
              {r.event.isToday ? '就是今天' : `還有 ${r.event.daysUntil} 天`}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-rose-700">
              提醒原因：{r.reasonLabel}
              {variant === 'future' ? ` · ${r.daysUntilAlert} 天後提醒你` : ''}
            </p>
          </div>
          {variant === 'today' && onDismiss ? (
            <button
              type="button"
              onClick={() => onDismiss(r.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-900 active:opacity-70"
            >
              知道了
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

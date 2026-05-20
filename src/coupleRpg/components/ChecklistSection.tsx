import type { ChecklistItem } from '../mockData';
import { lq } from '../theme';

type Props = {
  title: string;
  description?: string;
  items: ChecklistItem[];
  onToggle: (id: string) => void;
};

export function ChecklistSection({ title, description, items, onToggle }: Props) {
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <section className={`mb-4 p-4 ${lq.card}`}>
      <div className="mb-2">
        <h2 className="text-base font-bold text-stone-900">{title}</h2>
        {description ? <p className="mt-0.5 text-[12px] text-stone-500">{description}</p> : null}
      </div>
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-[11px] font-medium text-stone-500">
          <span>完成度</span>
          <span className={lq.accent}>
            {done}/{items.length} · {pct}%
          </span>
        </div>
        <div className={`h-1.5 overflow-hidden rounded-full ${lq.progressTrack}`}>
          <ProgressBar pct={pct} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`flex min-h-[56px] items-center justify-between rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
              item.done ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-50 bg-rose-50/30'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-xl">{item.emoji}</span>
              <span className="text-sm font-bold text-stone-700">{item.label}</span>
            </span>
            <span className="ml-2 shrink-0 text-lg">{item.done ? '✅' : '⬜'}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className={`h-full rounded-full ${lq.progress} transition-all duration-300`} style={{ width: `${pct}%` }} />
  );
}

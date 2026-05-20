import { ChevronRight } from 'lucide-react';
import { lq } from '../theme';

type Props = {
  emoji: string;
  title: string;
  description: string;
  cta: string;
  badge?: string;
  onAction: () => void;
};

export function FeatureActionCard({ emoji, title, description, cta, badge, onAction }: Props) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-rose-100/90 bg-white/95 p-3.5 shadow-[0_8px_28px_-12px_rgba(244,114,182,0.28)] transition active:scale-[0.99]`}
    >
      {badge ? (
        <span className="absolute right-3 top-3 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600 ring-1 ring-rose-100">
          {badge}
        </span>
      ) : null}
      <div className="flex gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100 text-2xl ring-1 ring-rose-100/80"
          aria-hidden
        >
          {emoji}
        </span>
        <div className="min-w-0 flex-1 pr-6">
          <h3 className="text-[15px] font-bold leading-snug text-stone-900">{title}</h3>
          <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">{description}</p>
          <button
            type="button"
            onClick={onAction}
            className={`mt-2.5 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-bold ${lq.btnPrimary}`}
          >
            {cta}
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

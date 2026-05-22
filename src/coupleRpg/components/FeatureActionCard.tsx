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
    <article className={`relative overflow-hidden p-3.5 transition active:scale-[0.99] ${lq.cardFeature}`}>
      {badge ? (
        <span className={`absolute right-3 top-3 ${lq.badgeAccent}`}>{badge}</span>
      ) : null}
      <div className="flex gap-3">
        <span
          className={`h-11 w-11 text-2xl ${lq.iconChip}`}
          aria-hidden
        >
          {emoji}
        </span>
        <div className="min-w-0 flex-1 pr-6">
          <h3 className={`text-[15px] font-bold leading-snug ${lq.text}`}>{title}</h3>
          <p className={`mt-0.5 text-[12px] leading-relaxed ${lq.textSecondary}`}>{description}</p>
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

import { Lock } from 'lucide-react';
import { lq } from '../../theme';

type Props = {
  title: string;
  description: string;
  tags: string[];
  cta: string;
  emoji?: string;
  locked?: boolean;
  onAction: () => void;
};

export function ProGameCard({
  title,
  description,
  tags,
  cta,
  emoji = '💔',
  locked = false,
  onAction,
}: Props) {
  return (
    <article
      className={`lq-pro-game-card p-4 ${locked ? 'lq-pro-game-card--locked' : ''} ${lq.cardElevated}`}
    >
      <div className="flex items-start gap-3">
        <span className="lq-pro-game-card__emoji flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm ring-1 ring-white/80">
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] font-extrabold text-[#3d3539]">{title}</h3>
            {locked ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200/80">
                <Lock className="h-3 w-3" aria-hidden />
                Pro
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-[#8a7a84]">{description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                  tag === 'Pro'
                    ? 'bg-violet-50/95 text-violet-700 ring-violet-200/80'
                    : 'bg-rose-50/90 text-[#b07a8f] ring-rose-100/80'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        className={`mt-4 w-full rounded-xl py-2.5 text-[14px] font-bold active:scale-[0.99] ${
          locked
            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm'
            : lq.btnPrimary
        }`}
      >
        {cta}
      </button>
    </article>
  );
}

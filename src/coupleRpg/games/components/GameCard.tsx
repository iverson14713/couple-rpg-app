import { lq } from '../../theme';

type Props = {
  title: string;
  description: string;
  tags: string[];
  cta: string;
  available?: boolean;
  onAction: () => void;
};

export function GameCard({
  title,
  description,
  tags,
  cta,
  available = true,
  onAction,
}: Props) {
  return (
    <article className={`p-4 ${lq.cardElevated}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-pink-50 text-2xl shadow-sm ring-1 ring-white/80">
          💕
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-extrabold text-[#3d3539]">{title}</h3>
          <p className="mt-1 text-[13px] leading-snug text-[#8a7a84]">{description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-rose-50/90 px-2 py-0.5 text-[10px] font-semibold text-[#b07a8f] ring-1 ring-rose-100/80"
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
        disabled={!available}
        className={`mt-4 w-full rounded-xl py-2.5 text-[14px] font-bold active:scale-[0.99] ${
          available ? lq.btnPrimary : 'bg-stone-100 text-stone-400'
        }`}
      >
        {cta}
      </button>
    </article>
  );
}

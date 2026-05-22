import type { DateItineraryPlan } from '../lib/dateItineraryAiModel';
import { lq } from '../theme';

type Props = {
  plan: DateItineraryPlan;
  animateIn?: boolean;
};

export function DateItineraryAiResult({ plan, animateIn }: Props) {
  const stagger = animateIn ? 'ai-result-enter-stagger' : '';

  return (
    <div className={`mb-3 space-y-3 ${stagger}`}>
      <div className={`rounded-2xl border border-rose-200/55 bg-gradient-to-br from-rose-50/90 to-white/80 p-4 shadow-[0_10px_32px_-12px_rgba(244,114,182,0.22)] backdrop-blur-sm ${lq.cardHero}`}>
        <p className={lq.label}>行程標題</p>
        <p className={`mt-1 text-[18px] font-extrabold leading-snug ${lq.text}`}>{plan.title}</p>
      </div>

      {plan.segments.length > 0 ? (
        <div className="space-y-2">
          <p className={`px-0.5 text-[12px] font-bold ${lq.textSecondary}`}>上午 · 下午 · 晚餐安排</p>
          {plan.segments.map((seg, i) => (
            <article
              key={`${seg.period}-${i}`}
              className={`rounded-2xl border border-rose-100/90 p-3.5 ${lq.cardFeature}`}
            >
              <span className={`inline-block ${lq.badgeAccent}`}>{seg.period}</span>
              <p className={`mt-2 text-[14px] font-bold ${lq.text}`}>{seg.place}</p>
              <p className={`mt-1 text-[13px] leading-relaxed ${lq.textSecondary}`}>{seg.activity}</p>
            </article>
          ))}
        </div>
      ) : null}

      {plan.tips.length > 0 ? (
        <div className="rounded-2xl border border-amber-100/80 bg-amber-50/75 p-3.5 ring-1 ring-amber-100/50">
          <p className="text-[12px] font-bold text-amber-900">小驚喜 · 貼心提醒</p>
          <ul className="mt-2 space-y-1.5">
            {plan.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-amber-950">
                <span className="shrink-0 font-bold text-amber-600" aria-hidden>
                  ✨
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.budget ? (
        <div className="rounded-2xl border border-emerald-100/80 bg-emerald-50/70 p-3.5 ring-1 ring-emerald-100/50">
          <p className="text-[12px] font-bold text-emerald-800">預算估算</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-950">{plan.budget}</p>
        </div>
      ) : null}
    </div>
  );
}

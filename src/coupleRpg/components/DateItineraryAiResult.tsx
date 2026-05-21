import type { DateItineraryPlan } from '../lib/dateItineraryAiModel';
import { lq } from '../theme';

type Props = {
  plan: DateItineraryPlan;
};

export function DateItineraryAiResult({ plan }: Props) {
  return (
    <div className="mb-3 space-y-3">
      <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-rose-500">行程標題</p>
        <p className="mt-1 text-[18px] font-extrabold leading-snug text-stone-900">{plan.title}</p>
      </div>

      {plan.segments.length > 0 ? (
        <div className="space-y-2">
          <p className="px-0.5 text-[12px] font-bold text-stone-600">時段 · 地點 · 活動</p>
          {plan.segments.map((seg, i) => (
            <article
              key={`${seg.period}-${i}`}
              className={`rounded-2xl border border-rose-100/90 p-3.5 ${lq.cardSoft}`}
            >
              <span className="inline-block rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                {seg.period}
              </span>
              <p className="mt-2 text-[14px] font-bold text-stone-800">{seg.place}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{seg.activity}</p>
            </article>
          ))}
        </div>
      ) : null}

      {plan.tips.length > 0 ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-3.5">
          <p className="text-[12px] font-bold text-amber-900">貼心提醒</p>
          <ul className="mt-2 space-y-1.5">
            {plan.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-amber-950">
                <span className="shrink-0 font-bold text-amber-600" aria-hidden>
                  ·
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.budget ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
          <p className="text-[12px] font-bold text-emerald-800">預算估算</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-950">{plan.budget}</p>
        </div>
      ) : null}
    </div>
  );
}

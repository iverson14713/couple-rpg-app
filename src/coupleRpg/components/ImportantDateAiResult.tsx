import type { ImportantDatePlan } from '../lib/importantDateAiModel';
import { lq } from '../theme';

type Props = {
  plan: ImportantDatePlan;
};

export function ImportantDateAiResult({ plan }: Props) {
  return (
    <div className="mb-3 space-y-3">
      <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-rose-500">安排標題</p>
        <p className="mt-1 text-[17px] font-extrabold leading-snug text-stone-900">{plan.title}</p>
      </div>

      {plan.dateIdeas ? (
        <div className={`rounded-2xl border border-violet-100 p-3.5 ${lq.cardSoft}`}>
          <p className="text-[12px] font-bold text-violet-800">約會安排</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-stone-700">{plan.dateIdeas}</p>
        </div>
      ) : null}

      {plan.gifts.length > 0 ? (
        <div className="rounded-2xl border border-pink-100 bg-pink-50/60 p-3.5">
          <p className="text-[12px] font-bold text-pink-900">禮物建議</p>
          <ul className="mt-2 space-y-1.5">
            {plan.gifts.map((g, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-pink-950">
                <span className="shrink-0 font-bold text-pink-500" aria-hidden>
                  🎁
                </span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.timeline.length > 0 ? (
        <div className="space-y-2">
          <p className="px-0.5 text-[12px] font-bold text-stone-600">當天流程</p>
          {plan.timeline.map((item, i) => (
            <article
              key={`${item.period}-${i}`}
              className={`rounded-2xl border border-rose-100/90 p-3 ${lq.cardSoft}`}
            >
              <span className="inline-block rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                {item.period}
              </span>
              {item.place !== '—' ? (
                <p className="mt-2 text-[13px] font-bold text-stone-800">{item.place}</p>
              ) : null}
              <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{item.activity}</p>
            </article>
          ))}
        </div>
      ) : null}

      {plan.phrase ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-3.5">
          <p className="text-[12px] font-bold text-rose-800">可以對伴侶說</p>
          <p className="mt-1.5 text-[13px] italic leading-relaxed text-rose-950">{plan.phrase}</p>
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
          <p className="text-[12px] font-bold text-emerald-800">預算參考</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-950">{plan.budget}</p>
        </div>
      ) : null}
    </div>
  );
}

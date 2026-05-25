import { hasConcreteNtAmount } from '../lib/dateItineraryBudget';
import {
  hydrateDateItineraryPlan,
  type DateBudgetTier,
  type DateItineraryPlan,
  type DateItinerarySegment,
} from '../lib/dateItineraryAiModel';
import { timelineIconForPeriod } from '../lib/dateItineraryPeriods';
import { lq } from '../theme';

type Props = {
  plan: DateItineraryPlan;
  animateIn?: boolean;
  /** 上架截圖：只顯示主題＋時間軸，關閉入場動畫避免匯出空白 */
  showcase?: boolean;
};

function budgetTierLabel(tier: DateBudgetTier | string): string {
  if (tier === '$') return '小資約會';
  if (tier === '$$$') return '儀式感滿滿';
  if (tier === '$$') return '質感剛剛好';
  return tier;
}

function MoodPills({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200/70"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function TimelineSegmentCard({
  seg,
  index,
  isLast,
}: {
  seg: DateItinerarySegment;
  index: number;
  isLast: boolean;
}) {
  const icon = timelineIconForPeriod(seg.period);
  const tall = index % 2 === 0;

  return (
    <li className="date-timeline-item relative flex gap-3 pb-1">
      <div className="flex w-9 shrink-0 flex-col items-center">
        <span
          className="date-timeline-node flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-lg shadow-md shadow-rose-300/40"
          aria-hidden
        >
          {icon}
        </span>
        {!isLast ? (
          <span
            className="date-timeline-line mt-1 w-0.5 flex-1 min-h-[2.5rem] bg-gradient-to-b from-rose-300/80 via-pink-200/50 to-transparent"
            aria-hidden
          />
        ) : null}
      </div>

      <article
        className={`mb-3 min-w-0 flex-1 rounded-2xl border border-rose-100/90 bg-gradient-to-br from-white/95 to-rose-50/40 p-3.5 shadow-[0_8px_24px_-14px_rgba(244,114,182,0.35)] ${
          tall ? 'sm:min-h-[9.5rem]' : 'sm:min-h-[7.5rem]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${lq.badgeAccent} shrink-0`}>{seg.period}</span>
          {seg.estimatedCost ? (
            <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-100">
              {seg.estimatedCost}
            </span>
          ) : null}
          {seg.transition && !isLast ? (
            <span className="text-[10px] font-medium text-stone-400">→ 下一段</span>
          ) : null}
        </div>
        <p className={`mt-2 text-[16px] font-extrabold leading-snug ${lq.text}`}>
          {seg.headline || seg.place}
        </p>
        {seg.place && seg.place !== '—' && seg.headline !== seg.place ? (
          <p className={`mt-0.5 text-[12px] font-semibold ${lq.textSecondary}`}>📍 {seg.place}</p>
        ) : null}
        <p className={`mt-2 text-[13px] leading-relaxed ${lq.textSecondary}`}>{seg.narrative}</p>
        <p className="mt-2 rounded-xl bg-rose-50/80 px-2.5 py-2 text-[11px] leading-relaxed text-rose-900/90">
          <span className="font-bold text-rose-700">為什麼這樣排 · </span>
          {seg.purpose}
        </p>
        {seg.conversationCue ? (
          <p className="mt-2 text-[11px] leading-relaxed text-stone-600">
            <span className="font-bold text-stone-500">💬 可以聊 · </span>
            {seg.conversationCue}
          </p>
        ) : null}
        {seg.transition && !isLast ? (
          <p className="mt-2 border-t border-dashed border-rose-100/80 pt-2 text-[11px] leading-relaxed text-stone-500">
            <span className="font-bold">轉場 · </span>
            {seg.transition}
          </p>
        ) : null}
      </article>
    </li>
  );
}

function BudgetSection({ plan }: { plan: DateItineraryPlan }) {
  const total =
    plan.estimatedTotal ||
    (hasConcreteNtAmount(plan.budgetNote) ? plan.budgetNote : '') ||
    (hasConcreteNtAmount(plan.budget ?? '') ? plan.budget : '');
  const breakdown = plan.budgetBreakdown ?? [];
  const showNote =
    plan.budgetNote &&
    plan.budgetNote !== total &&
    !breakdown.some((row) => row.amount === plan.budgetNote);

  return (
    <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 to-teal-50/45 p-3.5 ring-1 ring-emerald-100/50">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-bold text-emerald-800">預估花費（兩人）</p>
          <span className="text-[11px] font-semibold text-emerald-700/90">
            {budgetTierLabel(plan.budgetTier)}
          </span>
        </div>
        <span className="rounded-lg bg-emerald-600/10 px-2 py-0.5 text-[13px] font-black text-emerald-800">
          {plan.budgetTier}
        </span>
      </div>

      {total ? (
        <p className="mt-2 text-[22px] font-black tabular-nums tracking-tight text-emerald-950">{total}</p>
      ) : (
        <p className="mt-2 text-[14px] font-semibold text-emerald-900">請重新產生以取得新台幣估算</p>
      )}

      {breakdown.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-emerald-100/80 pt-3">
          {breakdown.map((row, i) => (
            <li
              key={`${row.label}-${i}`}
              className="flex items-start justify-between gap-3 text-[13px] leading-snug"
            >
              <span className="min-w-0 flex-1 font-medium text-emerald-950">{row.label}</span>
              <span className="shrink-0 font-bold tabular-nums text-emerald-800">{row.amount}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {showNote ? (
        <p className="mt-2 text-[11px] leading-relaxed text-emerald-800/90">{plan.budgetNote}</p>
      ) : null}
    </div>
  );
}

export function DateItineraryAiResult({ plan: rawPlan, animateIn, showcase }: Props) {
  const plan = hydrateDateItineraryPlan(rawPlan);
  const useAnimate = animateIn && !showcase;
  const stagger = useAnimate ? 'ai-result-enter-stagger date-plan-enter' : '';
  const reminders = plan.aiReminders.length > 0 ? plan.aiReminders : plan.tips ?? [];
  const segments = showcase ? plan.segments.slice(0, 3) : plan.segments;

  return (
    <div className={`mb-3 space-y-3 ${stagger}`}>
      <div
        className={`relative overflow-hidden rounded-2xl border border-rose-200/55 bg-gradient-to-br from-rose-100/90 via-pink-50/80 to-white/90 p-4 shadow-[0_12px_40px_-16px_rgba(244,114,182,0.35)] ${lq.cardHero}`}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-rose-300/20 blur-2xl"
          aria-hidden
        />
        <p className={lq.label}>約會主題</p>
        <p className={`mt-1 text-[20px] font-extrabold leading-snug tracking-tight ${lq.text}`}>
          {plan.title}
        </p>
        <p className={`mt-2 text-[13px] leading-relaxed ${lq.textSecondary}`}>
          <span className="font-bold text-rose-600">今日氛圍 · </span>
          {plan.mood}
        </p>
        <MoodPills tags={plan.moodTags} />
        {plan.surprise ? (
          <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[12px] leading-relaxed text-rose-900 ring-1 ring-rose-100/80">
            <span className="font-bold">🎁 小驚喜 · </span>
            {plan.surprise}
          </p>
        ) : null}
      </div>

      {segments.length > 0 ? (
        <section className="relative rounded-2xl border border-rose-100/70 bg-gradient-to-b from-white/60 to-rose-50/30 p-3 pt-4">
          <p className={`mb-3 px-1 text-[12px] font-bold ${lq.textSecondary}`}>約會時間軸</p>
          <ol className="relative m-0 list-none p-0">
            {segments.map((seg, i) => (
              <TimelineSegmentCard
                key={`${seg.period}-${i}`}
                seg={seg}
                index={i}
                isLast={i === segments.length - 1}
              />
            ))}
          </ol>
        </section>
      ) : null}

      {!showcase && reminders.length > 0 ? (
        <div className="rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-3.5 ring-1 ring-amber-100/50">
          <p className="text-[12px] font-bold text-amber-900">AI 小提醒</p>
          <ul className="mt-2 space-y-2">
            {reminders.map((tip, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-amber-950">
                <span className="shrink-0 font-bold text-amber-600" aria-hidden>
                  ✓
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!showcase && plan.partnerLines.length > 0 ? (
        <div className="rounded-2xl border border-pink-100/80 bg-gradient-to-br from-pink-50/90 to-rose-50/60 p-3.5">
          <p className="text-[12px] font-bold text-pink-900">可以對伴侶說</p>
          <ul className="mt-2 space-y-2">
            {plan.partnerLines.map((line, i) => (
              <li
                key={i}
                className="rounded-xl bg-white/75 px-3 py-2.5 text-[13px] leading-relaxed text-stone-800 ring-1 ring-pink-100/60"
              >
                「{line.replace(/^["「]|["」]$/g, '')}」
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!showcase ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-sky-100/80 bg-gradient-to-br from-sky-50/90 to-blue-50/40 p-3.5">
            <p className="text-[12px] font-bold text-sky-900">備案 · 下雨</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-sky-950">{plan.rainPlan}</p>
          </div>
          {plan.tiredPlan ? (
            <div className="rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/80 to-purple-50/40 p-3.5">
              <p className="text-[12px] font-bold text-violet-900">備案 · 對方累了</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-violet-950">{plan.tiredPlan}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {!showcase ? <BudgetSection plan={plan} /> : null}

      {!showcase && plan.outfit ? (
        <div className={`rounded-2xl border border-stone-200/70 bg-stone-50/80 p-3.5 ${lq.cardSoft}`}>
          <p className="text-[12px] font-bold text-stone-700">穿搭建議</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-stone-700">{plan.outfit}</p>
        </div>
      ) : null}
    </div>
  );
}

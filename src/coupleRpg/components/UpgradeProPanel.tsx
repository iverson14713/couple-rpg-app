import { Check } from 'lucide-react';
import {
  PRO_BENEFIT_LINES,
  PRO_PLAN_SUBTITLE,
  PRO_PLAN_TITLE,
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY,
  PRO_PRICE_YEARLY_AVG,
} from '../lib/proPlanContent';
import { useUserPlan } from '../context/UserPlanContext';
import { lq } from '../theme';

type Props = {
  onLater?: () => void;
  showLaterButton?: boolean;
};

export function UpgradeProPanel({ onLater, showLaterButton = true }: Props) {
  const { isPro, tryProExperience } = useUserPlan();

  return (
    <div className="space-y-4">
      <div>
        <p className="flex items-center gap-2 text-[13px] font-bold text-violet-600">
          <span aria-hidden>✨</span>
          {PRO_PLAN_TITLE}
        </p>
        <p className={`mt-1 ${lq.pageSubtitle}`}>{PRO_PLAN_SUBTITLE}</p>
      </div>

      <section className={`rounded-2xl p-3.5 ${lq.cardSoft}`}>
        <h3 className={`mb-2.5 ${lq.sectionTitleSm}`}>Pro 權益</h3>
        <ul className="space-y-2">
          {PRO_BENEFIT_LINES.map((line) => (
            <li key={line} className="flex items-start gap-2 text-[13px] font-semibold text-stone-700">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-stone-100 bg-white p-3 text-center ring-1 ring-stone-100">
          <p className="text-[11px] font-bold text-stone-500">月費</p>
          <p className="mt-1 text-[20px] font-extrabold text-stone-900">{PRO_PRICE_MONTHLY}</p>
          <p className="text-[10px] text-stone-400">/ 月</p>
        </div>
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/80 p-3 text-center">
          <p className="text-[11px] font-bold text-violet-700">年費</p>
          <p className="mt-1 text-[20px] font-extrabold text-stone-900">{PRO_PRICE_YEARLY}</p>
          <p className="text-[10px] font-semibold text-violet-600">{PRO_PRICE_YEARLY_AVG}</p>
        </div>
      </section>
      <p className="text-center text-[10px] text-stone-400">價格僅供展示，尚未開放付款</p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void tryProExperience()}
          disabled={isPro}
          className={`min-h-[48px] w-full ${lq.btnPrimary} disabled:opacity-60`}
        >
          {isPro ? '✓ 已是 Pro 體驗' : '✨ 先體驗 Pro'}
        </button>
        {showLaterButton ? (
          <button
            type="button"
            onClick={onLater}
            className={`min-h-[48px] w-full ${lq.btnSecondary}`}
          >
            之後再說
          </button>
        ) : null}
      </div>
    </div>
  );
}

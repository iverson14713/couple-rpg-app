import { X } from 'lucide-react';
import { PlanStatusPill, ProBadge } from '../components/ProBadge';
import { UpgradeProPanel } from '../components/UpgradeProPanel';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { useUserPlan } from '../context/UserPlanContext';
import {
  PRO_PLAN_DESCRIPTION,
  PRO_PLAN_TAGLINE,
  PRO_PLAN_TITLE,
  getProCoupleContextMessage,
} from '../lib/proPlanContent';
import { lq } from '../theme';

export function UpgradeProPage() {
  const { navigateTo } = useCoupleRpgNav();
  const { isPro } = useUserPlan();
  const { isFullyBound } = useCoupleSpace();
  const coupleContext = getProCoupleContextMessage(isFullyBound);

  const goBack = () => navigateTo('profile', { profileSection: 'settings' });

  return (
    <>
      <button
        type="button"
        onClick={goBack}
        className="mb-3 flex min-h-[40px] items-center gap-1 text-[13px] font-bold text-stone-600 active:opacity-70"
      >
        <X className="h-4 w-4" aria-hidden />
        返回
      </button>

      <section className="mb-4 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-100/80 via-white to-rose-50 p-5 shadow-[0_12px_40px_-14px_rgba(139,92,246,0.35)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-[22px] font-extrabold tracking-tight text-stone-900">{PRO_PLAN_TITLE}</span>
              <ProBadge size="md" variant="sparkle" clickable={false} />
            </p>
            <p className="mt-1 text-[16px] font-bold text-rose-600">{PRO_PLAN_TAGLINE}</p>
          </div>
          <PlanStatusPill isPro={isPro} />
        </div>
        <p className={`mt-3 text-[14px] leading-relaxed ${lq.textSecondary}`}>{PRO_PLAN_DESCRIPTION}</p>
        {!isPro ? (
          <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-[12px] font-semibold text-violet-900 ring-1 ring-violet-100/80">
            {coupleContext}
          </p>
        ) : null}
        <p className="mt-2 text-[11px] text-stone-400">價格僅供展示，尚未開放付款</p>
      </section>

      <section className={`p-4 ${lq.card}`}>
        <UpgradeProPanel onLater={goBack} />
      </section>
    </>
  );
}

import { useState } from 'react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { useUserPlan } from '../context/UserPlanContext';
import { PlanStatusPill } from './ProBadge';
import { UpgradeProPanel } from './UpgradeProPanel';
import {
  PRO_ACTIVE_DESCRIPTION,
  PRO_ACTIVE_TITLE,
  PRO_PLAN_TAGLINE,
  PRO_PLAN_TITLE,
  getProCoupleContextMessage,
} from '../lib/proPlanContent';
import { lq } from '../theme';

type Props = {
  /** 精簡版：只顯示標題與「查看 Pro」 */
  compact?: boolean;
  className?: string;
};

export function UpgradeCard({ compact, className = '' }: Props) {
  const { isPro } = useUserPlan();
  const { isFullyBound } = useCoupleSpace();
  const { navigateTo } = useCoupleRpgNav();
  const [dismissed, setDismissed] = useState(false);
  const coupleContext = getProCoupleContextMessage(isFullyBound);

  if (dismissed && !isPro) return null;

  if (isPro) {
    return (
      <section
        className={`rounded-2xl border border-violet-100 bg-violet-50/60 px-3.5 py-3 ${className}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-extrabold text-violet-900">{PRO_ACTIVE_TITLE}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-violet-800/90">{PRO_ACTIVE_DESCRIPTION}</p>
          </div>
          <PlanStatusPill isPro />
        </div>
      </section>
    );
  }

  if (compact) {
    return (
      <section
        className={`overflow-hidden rounded-2xl border border-violet-100/90 bg-gradient-to-br from-violet-50/90 via-white to-rose-50/70 p-3.5 shadow-sm ${className}`}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[16px] font-extrabold text-stone-900">{PRO_PLAN_TITLE}</p>
            <p className="text-[13px] font-bold text-rose-600">{PRO_PLAN_TAGLINE}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-stone-500">{coupleContext}</p>
          </div>
          <PlanStatusPill isPro={false} />
        </div>
        <button
          type="button"
          onClick={() => navigateTo('upgrade')}
          className={`min-h-[44px] w-full ${lq.btnPrimary}`}
        >
          開始甜蜜共享
        </button>
      </section>
    );
  }

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-violet-100/90 bg-gradient-to-br from-violet-50/90 via-white to-rose-50/70 p-4 shadow-sm ${className}`}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <PlanStatusPill isPro={false} />
      </div>
      <UpgradeProPanel showLaterButton onLater={() => setDismissed(true)} />
    </section>
  );
}

import { useState } from 'react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useUserPlan } from '../context/UserPlanContext';
import { PlanStatusPill } from './ProBadge';
import { UpgradeProPanel } from './UpgradeProPanel';
import { PRO_PLAN_SUBTITLE, PRO_PLAN_TITLE } from '../lib/proPlanContent';
import { lq } from '../theme';

type Props = {
  /** 精簡版：只顯示標題與「查看 Pro」 */
  compact?: boolean;
  className?: string;
};

export function UpgradeCard({ compact, className = '' }: Props) {
  const { isPro, planSnapshot } = useUserPlan();
  const { navigateTo } = useCoupleRpgNav();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && !isPro) return null;

  if (isPro) {
    return (
      <section
        className={`flex items-center justify-between gap-2 rounded-2xl border border-violet-100 bg-violet-50/60 px-3 py-2.5 ${className}`}
      >
        <div>
          <p className="text-[14px] font-extrabold text-violet-900">✨ Pro 體驗中</p>
          <p className="text-[12px] text-violet-700">
            {planSnapshot.isShared ? '情侶空間已共享 Pro' : '你已解鎖進階功能'}
          </p>
        </div>
        <PlanStatusPill isPro />
      </section>
    );
  }

  if (compact) {
    return (
      <section
        className={`overflow-hidden rounded-2xl border border-violet-100/90 bg-gradient-to-br from-violet-50/90 via-white to-rose-50/70 p-3.5 shadow-sm ${className}`}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-[15px] font-extrabold text-stone-900">{PRO_PLAN_TITLE}</p>
            <p className="text-[12px] text-stone-500">{PRO_PLAN_SUBTITLE}</p>
          </div>
          <PlanStatusPill isPro={false} />
        </div>
        <button
          type="button"
          onClick={() => navigateTo('upgrade')}
          className={`min-h-[44px] w-full ${lq.btnPrimary}`}
        >
          查看 Pro
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

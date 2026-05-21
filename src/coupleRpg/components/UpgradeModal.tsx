import { X } from 'lucide-react';
import { PlanStatusPill } from './ProBadge';
import { UpgradeProPanel } from './UpgradeProPanel';
import { useUserPlan } from '../context/UserPlanContext';
import { PRO_PLAN_TAGLINE, PRO_PLAN_TITLE } from '../lib/proPlanContent';
import { lq } from '../theme';

export function UpgradeModal() {
  const { upgradeModalOpen, upgradeModalHint, closeUpgradeModal, isPro } = useUserPlan();

  if (!upgradeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/45" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" aria-label="關閉" onClick={closeUpgradeModal} />
      <div className="relative max-h-[90vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="border-b border-stone-100 px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-[18px] font-extrabold ${lq.text}`}>{PRO_PLAN_TITLE}</p>
                <PlanStatusPill isPro={isPro} />
              </div>
              {!isPro ? (
                <p className="mt-0.5 text-[14px] font-bold text-rose-600">{PRO_PLAN_TAGLINE}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={closeUpgradeModal}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-500 active:bg-stone-100"
              aria-label="關閉"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-4 pb-8 pt-4">
          {upgradeModalHint ? (
            <p className="mb-3 rounded-xl bg-violet-50 px-3 py-2.5 text-center text-[13px] font-semibold text-violet-900 ring-1 ring-violet-100">
              {upgradeModalHint}
            </p>
          ) : null}
          <UpgradeProPanel onLater={closeUpgradeModal} />
        </div>
      </div>
    </div>
  );
}

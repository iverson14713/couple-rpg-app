import { X } from 'lucide-react';
import { PlanStatusPill } from './ProBadge';
import {
  UpgradeProPanelProvider,
  UpgradeProPanelPurchaseFooter,
  UpgradeProPanelScrollContent,
} from './UpgradeProPanel';
import { useUserPlan } from '../context/UserPlanContext';
import { PRO_PLAN_TAGLINE, PRO_PLAN_TITLE } from '../lib/proPlanContent';
import { lq } from '../theme';

export function UpgradeModal() {
  const { upgradeModalOpen, upgradeModalHint, closeUpgradeModal, isPro } = useUserPlan();

  if (!upgradeModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex flex-col justify-end bg-black/45"
      role="dialog"
      aria-modal="true"
      onClick={closeUpgradeModal}
    >
      <div
        className="relative z-10 flex max-h-[92dvh] min-h-0 w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-stone-100 bg-white px-4 py-3.5">
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
        </header>

        <UpgradeProPanelProvider
          onLater={closeUpgradeModal}
          collapsibleBenefits
        >
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 [-webkit-overflow-scrolling:touch]"
          >
            {upgradeModalHint ? (
              <p className="mb-3 rounded-xl bg-violet-50 px-3 py-2.5 text-center text-[13px] font-semibold text-violet-900 ring-1 ring-violet-100">
                {upgradeModalHint}
              </p>
            ) : null}
            <UpgradeProPanelScrollContent />
          </div>

          {!isPro ? (
            <footer className="shrink-0 border-t border-rose-100/80 bg-gradient-to-b from-white via-rose-50/40 to-[#fff7fb] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 shadow-[0_-8px_24px_-12px_rgba(244,114,182,0.18)]">
              <UpgradeProPanelPurchaseFooter />
            </footer>
          ) : null}
        </UpgradeProPanelProvider>
      </div>
    </div>
  );
}

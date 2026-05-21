import { X } from 'lucide-react';
import { PlanStatusPill, ProBadge } from '../components/ProBadge';
import { UpgradeProPanel } from '../components/UpgradeProPanel';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useUserPlan } from '../context/UserPlanContext';
import { PRO_PLAN_TITLE } from '../lib/proPlanContent';
import { lq } from '../theme';

export function UpgradeProPage() {
  const { navigateTo } = useCoupleRpgNav();
  const { isPro } = useUserPlan();

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
          <div>
            <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-violet-600">
              {PRO_PLAN_TITLE}
              <ProBadge size="md" variant="sparkle" clickable={false} />
            </p>
            <h1 className={`mt-1 ${lq.pageTitle}`}>升級頁面</h1>
          </div>
          <PlanStatusPill isPro={isPro} />
        </div>
        <p className={`mt-2 text-[14px] leading-relaxed ${lq.textSecondary}`}>
          情侶共享方案：一人開通，同一情侶空間兩人都能用。綁定後寫入雲端；尚未接 Stripe 或 App Store。
        </p>
      </section>

      <section className={`p-4 ${lq.card}`}>
        <UpgradeProPanel onLater={goBack} />
      </section>
    </>
  );
}

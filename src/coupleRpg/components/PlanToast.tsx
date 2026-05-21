import { useUserPlan } from '../context/UserPlanContext';

export function PlanToast() {
  const { planToast, clearPlanToast } = useUserPlan();
  if (!planToast) return null;

  return (
    <div
      className="fixed left-4 right-4 top-4 z-[70] mx-auto max-w-md"
      role="status"
    >
      <button
        type="button"
        onClick={clearPlanToast}
        className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[14px] font-bold text-emerald-900 shadow-lg ring-1 ring-emerald-100 active:opacity-90"
      >
        ✓ {planToast}
      </button>
    </div>
  );
}

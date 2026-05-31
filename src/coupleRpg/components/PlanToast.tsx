import { useUserPlan } from '../context/UserPlanContext';

export function PlanToast() {
  const { planToast, clearPlanToast } = useUserPlan();
  if (!planToast) return null;

  const isError =
    /失敗|無法|尚未|錯誤|請稍後|不支援|僅/i.test(planToast) && !/成功|已升級|Pro 已/i.test(planToast);

  return (
    <div className="fixed left-4 right-4 top-4 z-[70] mx-auto max-w-md" role="status">
      <button
        type="button"
        onClick={clearPlanToast}
        className={`w-full rounded-2xl px-4 py-3 text-center text-[14px] font-bold shadow-lg active:opacity-90 ${
          isError
            ? 'border border-red-200 bg-red-50 text-red-900 ring-1 ring-red-100'
            : 'border border-emerald-200 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100'
        }`}
      >
        {isError ? purchaseErrorPrefix(planToast) : `✓ ${planToast}`}
      </button>
    </div>
  );
}

function purchaseErrorPrefix(message: string): string {
  return message.startsWith('⚠') ? message : `⚠ ${message}`;
}

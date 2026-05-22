import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { useUserPlan } from '../context/UserPlanContext';
import { PlanStatusPill } from './ProBadge';
import { lq } from '../theme';

/** 設定頁：情侶共享方案與升級 / 測試切換 */
export function PlanSettingsSection() {
  const auth = useSupabaseAuth();
  const { isFullyBound } = useCoupleSpace();
  const { isPro, planLoading, planSnapshot, resetToFree, setProForTesting, refreshPlan } =
    useUserPlan();
  const { navigateTo } = useCoupleRpgNav();

  const billingLabel = (() => {
    const owner = planSnapshot?.subscription?.billing_owner;
    if (!owner) return null;
    if (auth.user?.id && owner === auth.user.id) return '由你開通';
    return '由其中一位成員開通';
  })();

  const usesCoupleCloud = Boolean(planSnapshot?.isShared && isFullyBound);

  return (
    <section className={`mb-4 p-4 ${lq.card}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className={lq.sectionTitleSm}>訂閱方案</h2>
        <button
          type="button"
          onClick={() => void refreshPlan()}
          disabled={planLoading}
          className="text-[12px] font-bold text-rose-600 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {planLoading ? '同步中…' : '重新整理方案'}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-stone-500">目前方案</p>
          <p className="mt-0.5 text-[18px] font-extrabold text-stone-900">{isPro ? 'Pro' : 'Free'}</p>
          <p className="mt-1 text-[12px] font-semibold text-violet-700">方案類型：情侶共享方案</p>
          {usesCoupleCloud ? (
            <p className="mt-0.5 text-[11px] text-stone-500">雲端同步 · 同一情侶空間兩人共用</p>
          ) : (
            <p className="mt-0.5 text-[11px] text-stone-500">本機模擬 · 綁定另一半後可雲端共享</p>
          )}
          {billingLabel ? (
            <p className="mt-1 text-[11px] text-stone-500">{billingLabel}</p>
          ) : null}
        </div>
        <PlanStatusPill isPro={isPro} />
      </div>

      {isPro ? (
        <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2.5 text-[13px] font-semibold leading-relaxed text-violet-900 ring-1 ring-violet-100">
          你們的情侶空間已解鎖 Pro
          <br />
          <span className="font-medium text-violet-800">
            同一個情侶空間的兩個人都可使用 Pro 功能
          </span>
        </p>
      ) : (
        <p className="mt-3 rounded-xl bg-rose-50/80 px-3 py-2.5 text-[13px] font-semibold leading-relaxed text-rose-900 ring-1 ring-rose-100">
          升級一次，兩個人一起用 Pro
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {isPro ? (
          <>
            <button
              type="button"
              onClick={() => void resetToFree()}
              disabled={planLoading}
              className="min-h-[44px] w-full rounded-xl border border-stone-200 bg-white text-[13px] font-bold text-stone-700 active:scale-[0.98] disabled:opacity-50"
            >
              切回 Free 測試
            </button>
            <button
              type="button"
              onClick={() => void setProForTesting()}
              disabled={planLoading}
              className="min-h-[44px] w-full rounded-xl border border-violet-200 bg-violet-50 text-[13px] font-bold text-violet-800 active:scale-[0.98] disabled:opacity-50"
            >
              切換 Pro 測試
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigateTo('upgrade')}
              className={`min-h-[48px] w-full ${lq.btnPrimary}`}
            >
              升級 Pro
            </button>
            <button
              type="button"
              onClick={() => void setProForTesting()}
              disabled={planLoading || !isFullyBound}
              className={`min-h-[44px] w-full ${lq.btnSecondary} disabled:opacity-50`}
            >
              切換 Pro 測試{!isFullyBound ? '（需完成綁定）' : ''}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

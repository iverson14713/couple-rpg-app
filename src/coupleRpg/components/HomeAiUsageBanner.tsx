import { useAiUsage } from '../hooks/useAiUsage';
import { useUserPlan } from '../context/UserPlanContext';
import { lq } from '../theme';

export function HomeAiUsageBanner() {
  const { usageLine, isLoggedIn, canUseAi, isPro, quotaExhaustedMessage } = useAiUsage();
  const { openUpgradeModal } = useUserPlan();

  return (
    <section
      className={`mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 ${
        canUseAi
          ? 'border-violet-100/90 bg-gradient-to-r from-violet-50/90 to-rose-50/80'
          : 'border-amber-200/80 bg-amber-50/90'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-violet-800">✨ AI 助手</p>
        {isLoggedIn ? (
          <p className={`text-[14px] font-extrabold tabular-nums ${lq.text}`}>
            今日 AI 使用：{usageLine}
          </p>
        ) : (
          <p className="text-[13px] font-semibold text-stone-600">登入後可使用 AI（Free 每日 3 次）</p>
        )}
        {!canUseAi && isLoggedIn ? (
          <p className="mt-0.5 text-[11px] leading-snug text-amber-900/90">{quotaExhaustedMessage}</p>
        ) : null}
      </div>
      {!isPro && isLoggedIn ? (
        <button
          type="button"
          onClick={() => openUpgradeModal(quotaExhaustedMessage)}
          className="shrink-0 rounded-xl bg-violet-600 px-3 py-2 text-[12px] font-bold text-white shadow-sm active:opacity-90"
        >
          升級 Pro
        </button>
      ) : null}
    </section>
  );
}

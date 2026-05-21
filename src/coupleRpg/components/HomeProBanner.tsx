import { useUserPlan } from '../context/UserPlanContext';
import { lq } from '../theme';

/** 首頁小型升級提示（不打擾） */
export function HomeProBanner() {
  const { isPro, planSnapshot, openUpgradeModal } = useUserPlan();

  if (isPro) {
    return (
      <section
        className={`mb-2.5 flex items-center justify-between gap-2 rounded-2xl border border-violet-100 bg-violet-50/50 px-3 py-2.5 ${lq.cardSoft}`}
      >
        <p className="text-[13px] font-bold text-violet-900">
          <span aria-hidden>✨</span> Pro 體驗中
        </p>
        <p className="text-[11px] font-semibold text-violet-700">
          {planSnapshot.isShared ? '情侶空間已共享 Pro' : '你已解鎖進階功能'}
        </p>
      </section>
    );
  }

  return (
    <section className="mb-2.5 flex items-center gap-2.5 rounded-2xl border border-violet-100/80 bg-gradient-to-r from-violet-50/70 to-rose-50/50 px-3 py-2.5 shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg ring-1 ring-violet-100">
        ✨
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold leading-tight text-stone-900">解鎖 LoveQuest Pro</p>
        <p className="text-[11px] leading-snug text-stone-600">AI 約會規劃、禮物建議、完整同步</p>
      </div>
      <button
        type="button"
        onClick={() => {
          openUpgradeModal();
        }}
        className="shrink-0 rounded-xl bg-white px-3 py-2 text-[12px] font-bold text-violet-800 ring-1 ring-violet-200 active:scale-95"
      >
        查看 Pro
      </button>
    </section>
  );
}

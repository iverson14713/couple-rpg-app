import { navigateTo } from '../../legalNavigate';
import { LEGAL_DEVELOPER_NAME } from '../../pages/legalConfig';

export function AppLegalFooter() {
  return (
    <footer className="mt-6 border-t border-rose-100/80 pt-4 pb-2 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] font-semibold">
        <button
          type="button"
          onClick={() => navigateTo('/privacy')}
          className="text-rose-600 underline decoration-rose-200 underline-offset-2 transition active:opacity-70"
        >
          隱私政策
        </button>
        <span className="text-stone-300" aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={() => navigateTo('/terms')}
          className="text-rose-600 underline decoration-rose-200 underline-offset-2 transition active:opacity-70"
        >
          服務條款
        </button>
      </nav>
      <p className="mt-2 text-[11px] text-stone-400">
        LoveQuest · {LEGAL_DEVELOPER_NAME}
      </p>
    </footer>
  );
}

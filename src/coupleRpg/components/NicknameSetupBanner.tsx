import { ChevronRight, UserRound } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

type Props = {
  compact?: boolean;
  className?: string;
};

export function NicknameSetupBanner({ compact, className = '' }: Props) {
  const { nicknameSetup } = useLoveQuest();
  const { navigateTo } = useCoupleRpgNav();

  if (!nicknameSetup.needsAny) return null;

  const goSettings = () =>
    navigateTo('profile', { profileSection: 'settings', scrollToElementId: 'lq-couple-profile' });

  if (compact) {
    return (
      <button
        type="button"
        onClick={goSettings}
        className={`mb-2.5 flex w-full items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/95 px-2.5 py-2 text-left active:scale-[0.99] ${className}`}
      >
        <UserRound className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-amber-950">
          {nicknameSetup.message}
        </span>
        <span className="shrink-0 text-[11px] font-bold text-amber-800">去填寫</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      </button>
    );
  }

  return (
    <section
      className={`mb-3 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-rose-50/40 to-amber-50/80 p-3.5 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-inner ring-1 ring-amber-100">
          ✏️
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-amber-950">還沒設定暱稱</p>
          <p className="mt-0.5 text-[12px] leading-snug text-amber-900/85">{nicknameSetup.message}</p>
          <p className="mt-1 text-[11px] text-amber-800/70">設定後，首頁、家事與獎勵都會顯示你們的名字</p>
          <button type="button" onClick={goSettings} className={`mt-2.5 ${lq.btnPrimary}`}>
            前往填寫情侶資料
          </button>
        </div>
      </div>
    </section>
  );
}

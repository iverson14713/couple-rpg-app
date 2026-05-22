import { Sparkles } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import { lq } from '../theme';

export function OnboardingSettingsSection() {
  const { replayOnboarding } = useOnboarding();

  return (
    <section className={`mb-4 p-4 ${lq.card}`}>
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-rose-500" aria-hidden />
        <h2 className={lq.sectionTitleSm}>新手導覽</h2>
      </div>
      <p className={`mb-3 text-[13px] leading-relaxed ${lq.textSecondary}`}>
        可再次查看 LoveQuest 功能介紹。不需登入即可先體驗 App，用到雲端同步或 AI 時再綁定帳號即可。
      </p>
      <button
        type="button"
        onClick={replayOnboarding}
        className={`w-full rounded-xl py-3 text-sm font-bold transition active:scale-[0.98] ${lq.btnSecondary}`}
      >
        重新查看新手導覽
      </button>
    </section>
  );
}

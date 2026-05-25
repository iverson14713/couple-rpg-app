import { FileText, Shield } from 'lucide-react';
import { navigateTo } from '../../legalNavigate';
import { lq } from '../theme';

export function LegalSettingsSection() {
  return (
    <section className={`p-4 ${lq.card}`}>
      <div className="mb-2 flex items-center gap-2">
        <Shield className="h-5 w-5 text-rose-500" aria-hidden />
        <h2 className={lq.sectionTitleSm}>法律與隱私</h2>
      </div>
      <p className={`mb-3 text-sm leading-relaxed ${lq.textSecondary}`}>
        上架版隱私政策與服務條款，供 App Store 審核與使用者查閱。
      </p>
      <div className="space-y-2">
        <LegalLinkButton
          icon={Shield}
          label="隱私政策"
          hint="資料收集、用途與第三方服務"
          onClick={() => navigateTo('/privacy')}
        />
        <LegalLinkButton
          icon={FileText}
          label="服務條款"
          hint="使用規範、AI 與 Pro 訂閱說明"
          onClick={() => navigateTo('/terms')}
        />
      </div>
    </section>
  );
}

function LegalLinkButton({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: typeof Shield;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-h-[52px] items-center gap-3 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/70 to-pink-50/50 px-4 py-3 text-left transition active:scale-[0.99]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm ring-1 ring-rose-100">
        <Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-stone-900">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-stone-500">{hint}</span>
      </span>
      <span className="shrink-0 text-rose-300" aria-hidden>
        →
      </span>
    </button>
  );
}

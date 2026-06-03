import { ChevronLeft } from 'lucide-react';
import { lq } from '../../theme';

type Props = {
  title: string;
  subtitle?: string;
  onBack: () => void;
};

export function SettingsSubPageHeader({ title, subtitle, onBack }: Props) {
  return (
    <header className="mb-3">
      <button
        type="button"
        onClick={onBack}
        className="mb-2 flex min-h-[40px] items-center gap-0.5 rounded-lg px-1 text-[13px] font-bold text-rose-700 active:opacity-70"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
        返回設定
      </button>
      <h2 className={`text-[18px] font-extrabold leading-tight ${lq.text}`}>{title}</h2>
      {subtitle ? (
        <p className={`mt-0.5 text-[12px] font-medium ${lq.textSecondary}`}>{subtitle}</p>
      ) : null}
    </header>
  );
}

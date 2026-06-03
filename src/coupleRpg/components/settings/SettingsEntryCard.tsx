import { ChevronRight } from 'lucide-react';
import { lq } from '../../theme';

type Props = {
  emoji: string;
  title: string;
  description: string;
  onClick: () => void;
};

export function SettingsEntryCard({ emoji, title, description, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[4.5rem] max-h-[5.5rem] w-full items-center gap-3 rounded-2xl border border-rose-100/90 bg-gradient-to-r from-white via-rose-50/40 to-pink-50/30 px-3.5 py-3 text-left shadow-sm ring-1 ring-rose-100/60 transition active:scale-[0.99] active:opacity-95`}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 text-xl shadow-inner"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15px] font-extrabold leading-tight ${lq.text}`}>{title}</p>
        <p className={`mt-0.5 line-clamp-1 text-[12px] font-medium ${lq.textSecondary}`}>
          {description}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-rose-400" aria-hidden />
    </button>
  );
}

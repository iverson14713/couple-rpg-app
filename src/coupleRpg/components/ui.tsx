import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { lq } from '../theme';

export function PageHero({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <section className={`mb-3 p-3.5 ${lq.card}`}>
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <h1 className={`mt-1 text-xl font-bold ${lq.text}`}>{title}</h1>
      <p className={`mt-0.5 text-[13px] ${lq.textSecondary}`}>{subtitle}</p>
    </section>
  );
}

export function PrimaryButton({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const base =
    variant === 'primary'
      ? lq.btnPrimary
      : variant === 'secondary'
        ? lq.btnSecondary
        : 'border border-stone-200 bg-white text-stone-700';
  return (
    <button type="button" className={`w-full transition ${base} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

export function OptionChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1 px-2.5 py-1 text-[12px] font-semibold ${lq.tag}`}>
      <span className="truncate">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full px-1 text-rose-400 hover:bg-rose-100 hover:text-rose-700"
          aria-label={`刪除 ${label}`}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function InlineInput({
  value,
  onChange,
  placeholder,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSubmit: () => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-[15px] outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
      />
      <button
        type="button"
        onClick={onSubmit}
        className={`shrink-0 ${lq.btnPrimary}`}
      >
        新增
      </button>
    </div>
  );
}

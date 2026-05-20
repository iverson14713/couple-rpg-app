import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { lq } from '../theme';

export function PageHero({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <section className={`mb-3 p-4 ${lq.card}`}>
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <h1 className="mt-1.5 text-lg font-bold text-stone-900">{title}</h1>
      <p className="mt-0.5 text-[13px] text-stone-500">{subtitle}</p>
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
    <button
      type="button"
      className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] disabled:opacity-50 ${base} ${className}`}
      {...props}
    >
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
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-semibold text-rose-900 ring-1 ring-rose-100">
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
        className="min-w-0 flex-1 rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300"
      />
      <button
        type="button"
        onClick={onSubmit}
        className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold ${lq.btnPrimary}`}
      >
        新增
      </button>
    </div>
  );
}

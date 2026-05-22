import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { lq } from '../theme';

export function PageHero({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <section className={`mb-4 p-4 ${lq.card}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 ring-1 ring-rose-100 ${lq.pageEmoji}`}
          aria-hidden
        >
          {emoji}
        </span>
        <div className="min-w-0 pt-0.5">
          <h1 className={lq.pageTitle}>{title}</h1>
          <p className={`mt-1 ${lq.pageSubtitle}`}>{subtitle}</p>
        </div>
      </div>
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
        : `${lq.btnSecondary} !bg-transparent`;
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
  emoji,
  onRemove,
}: {
  label: string;
  emoji?: string;
  onRemove?: () => void;
}) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1 px-2.5 py-1 text-[12px] font-semibold ${lq.tag}`}>
      {emoji ? (
        <span className="shrink-0 text-base leading-none" aria-hidden>
          {emoji}
        </span>
      ) : null}
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
        className={`min-w-0 flex-1 ${lq.input}`}
      />
      <button
        type="button"
        onClick={onSubmit}
        className={`shrink-0 ${lq.btnPrimary}`}
      >
        ➕ 新增
      </button>
    </div>
  );
}

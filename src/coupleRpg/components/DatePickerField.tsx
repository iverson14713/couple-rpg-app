import { useId, useRef, type ReactNode } from 'react';
import { formatYmdChinese } from '../lib/importantDateEvents';

type Props = {
  value: string;
  onChange: (ymd: string) => void;
  placeholder?: string;
  className?: string;
  label?: ReactNode;
};

export function DatePickerField({
  value,
  onChange,
  placeholder = '點擊選擇日期',
  className = '',
  label,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = Boolean(value.trim());
  const display = hasValue ? formatYmdChinese(value) : placeholder;

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') el.showPicker();
      else el.focus();
    } catch {
      el.focus();
    }
  };

  return (
    <div className={className}>
      {label ? (
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-stone-500">
          {label}
        </span>
      ) : null}
      <button
        type="button"
        onClick={openPicker}
        className={`relative flex w-full min-h-[44px] items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99] ${
          hasValue
            ? 'border-rose-200/70 bg-white text-stone-800'
            : 'border-rose-200/55 bg-rose-50/40 text-stone-400'
        }`}
        aria-labelledby={inputId}
      >
        <span
          id={inputId}
          className={`text-[14px] font-semibold ${hasValue ? 'text-stone-800' : 'text-stone-400'}`}
        >
          {display}
        </span>
        <span className="shrink-0 text-[1.25rem] leading-none" aria-hidden>
          📅
        </span>
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          tabIndex={-1}
          aria-hidden
        />
      </button>
    </div>
  );
}

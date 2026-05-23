import type { ReactNode } from 'react';
import { lq } from '../theme';

type Props = {
  emoji: string;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

/** 列表／區塊空狀態：大 emoji + 短標題 + 一行說明 */
export function EmptyState({ emoji, title, hint, action, className = '', compact }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200/90 bg-stone-50/60 text-center ${
        compact ? 'px-3 py-4' : 'px-4 py-6'
      } ${className}`}
    >
      <span className={compact ? 'mb-1.5 text-3xl' : 'mb-2 text-4xl'} aria-hidden>
        {emoji}
      </span>
      <p className={`font-bold ${compact ? 'text-[13px]' : 'text-[14px]'} ${lq.text}`}>{title}</p>
      {hint ? <p className={`mt-1 max-w-[16rem] leading-snug ${compact ? 'text-[11px]' : 'text-[12px]'} ${lq.textSecondary}`}>{hint}</p> : null}
      {action}
    </div>
  );
}

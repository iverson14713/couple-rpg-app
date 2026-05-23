import { useAiUsage } from '../hooks/useAiUsage';

type Props = {
  className?: string;
  /** 緊湊 badge 樣式（用於卡片右上角） */
  variant?: 'inline' | 'badge';
};

export function AiUsageQuotaLabel({ className = '', variant = 'inline' }: Props) {
  const { isLoggedIn, remainingLine, canUseAi, quotaSynced, loading } = useAiUsage();

  if (!isLoggedIn) {
    return (
      <span className={`text-[10px] font-semibold text-stone-400 ${className}`}>登入後可使用 AI</span>
    );
  }

  const line =
    !quotaSynced || loading ? '同步 AI 次數…' : remainingLine;

  if (variant === 'badge') {
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
          !quotaSynced || loading
            ? 'bg-stone-100 text-stone-600'
            : canUseAi
              ? 'bg-violet-100 text-violet-800'
              : 'bg-amber-100 text-amber-900'
        } ${className}`}
      >
        {line}
      </span>
    );
  }

  return (
    <span
      className={`text-[11px] font-semibold tabular-nums ${
        !quotaSynced || loading
          ? 'text-stone-500'
          : canUseAi
            ? 'text-violet-700'
            : 'text-amber-800'
      } ${className}`}
    >
      {line}
    </span>
  );
}

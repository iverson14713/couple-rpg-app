import { useAiUsage } from '../hooks/useAiUsage';

type Props = {
  className?: string;
  /** 緊湊 badge 樣式（用於卡片右上角） */
  variant?: 'inline' | 'badge';
};

export function AiUsageQuotaLabel({ className = '', variant = 'inline' }: Props) {
  const { isLoggedIn, remainingLine, canUseAi } = useAiUsage();

  if (!isLoggedIn) {
    return (
      <span className={`text-[10px] font-semibold text-stone-400 ${className}`}>登入後可使用 AI</span>
    );
  }

  if (variant === 'badge') {
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
          canUseAi ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-900'
        } ${className}`}
      >
        {remainingLine}
      </span>
    );
  }

  return (
    <span
      className={`text-[11px] font-semibold tabular-nums ${
        canUseAi ? 'text-violet-700' : 'text-amber-800'
      } ${className}`}
    >
      {remainingLine}
    </span>
  );
}

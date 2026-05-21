import type { ProFeatureId } from '../lib/proFeatures';
import { PRO_FEATURE_LABELS } from '../lib/proFeatures';
import { useUserPlan } from '../context/UserPlanContext';
import { lq } from '../theme';

type Props = {
  feature?: ProFeatureId;
  className?: string;
  size?: 'sm' | 'md';
  /** sm 預設 PRO；md 預設 ✨ Pro */
  variant?: 'pro' | 'sparkle';
  /** 點擊時開啟升級 modal（僅 free 用戶） */
  clickable?: boolean;
};

export function ProBadge({
  feature,
  className = '',
  size = 'sm',
  variant,
  clickable = false,
}: Props) {
  const { isPro, openUpgradeModal } = useUserPlan();
  const title = feature ? PRO_FEATURE_LABELS[feature] : 'LoveQuest Pro';
  const sizeClass =
    size === 'md' ? 'px-2.5 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]';
  const label =
    variant === 'pro' || (variant == null && size === 'sm')
      ? 'PRO'
      : variant === 'sparkle' || size === 'md'
        ? '✨ Pro'
        : 'PRO';

  const inner = (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-gradient-to-r from-violet-500 to-rose-500 font-extrabold tracking-wide text-white shadow-sm ${sizeClass} ${
        label === 'PRO' ? 'uppercase' : ''
      } ${className}`}
      title={title}
    >
      {label}
    </span>
  );

  if (clickable && !isPro) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openUpgradeModal();
        }}
        className="inline-flex shrink-0 rounded-full active:scale-95"
        aria-label={`${title}，升級 Pro`}
      >
        {inner}
      </button>
    );
  }

  return inner;
}

/** 非 Pro 時才顯示 Pro 標籤 */
export function ProBadgeIfNeeded({
  show,
  feature,
  className,
  size,
  variant,
  clickable = true,
}: {
  show: boolean;
  feature?: ProFeatureId;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'pro' | 'sparkle';
  clickable?: boolean;
}) {
  if (!show) return null;
  return (
    <ProBadge
      feature={feature}
      className={className}
      size={size}
      variant={variant}
      clickable={clickable}
    />
  );
}

export function PlanStatusPill({ isPro }: { isPro: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
        isPro
          ? 'bg-violet-50 text-violet-800 ring-violet-200'
          : `${lq.accentBg} ${lq.accent} ring-rose-100`
      }`}
    >
      {isPro ? '✨ Pro 體驗中' : 'Free'}
    </span>
  );
}

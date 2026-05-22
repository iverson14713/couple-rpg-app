import { Heart } from 'lucide-react';
import { useAiFavorites } from '../hooks/useAiFavorites';

type Props = {
  recordId: string;
  className?: string;
  size?: 'sm' | 'md';
};

export function AiFavoriteButton({ recordId, className = '', size = 'md' }: Props) {
  const { isFavorite, toggleFavorite } = useAiFavorites();
  const active = isFavorite(recordId);
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(recordId)}
      aria-label={active ? '取消收藏' : '收藏此 AI 建議'}
      aria-pressed={active}
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full border transition active:scale-95 ${
        active
          ? 'border-rose-300 bg-rose-100 text-rose-600 shadow-[0_4px_14px_-6px_rgba(244,114,182,0.35)]'
          : 'border-rose-100/80 bg-white/80 text-rose-300 hover:border-rose-200 hover:text-rose-500'
      } ${className}`}
    >
      <Heart className={icon} fill={active ? 'currentColor' : 'none'} strokeWidth={2.25} aria-hidden />
    </button>
  );
}

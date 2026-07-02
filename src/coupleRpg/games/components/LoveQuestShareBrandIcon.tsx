import { useState } from 'react';
import { loveQuestShareIconUrl } from '../heartCircle/loveQuestShareBrand';

type Props = {
  size?: number;
  className?: string;
};

export function LoveQuestShareBrandIcon({ size = 52, className = '' }: Props) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return (
      <div
        className={`lq-share-brand-icon-fallback ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <span className="lq-share-brand-icon-fallback__hearts">♥♥</span>
      </div>
    );
  }

  return (
    <img
      src={loveQuestShareIconUrl()}
      alt=""
      width={size}
      height={size}
      crossOrigin="anonymous"
      decoding="sync"
      data-share-asset="icon"
      className={className}
      onError={() => setUseFallback(true)}
    />
  );
}

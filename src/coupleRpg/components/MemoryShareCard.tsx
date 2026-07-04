import { forwardRef, useMemo } from 'react';
import { LoveQuestShareBrandIcon } from '../games/components/LoveQuestShareBrandIcon';
import {
  MEMORY_SHARE_CAPTURE_SIZE,
  truncateShareQuote,
  type MemorySharePayload,
} from '../lib/dailyMemoryShareExport';

type Props = {
  payload: MemorySharePayload;
};

/**
 * IG Story 分享專用卡（固定 1080×1920，html2canvas scale:1）。
 * 一句話截斷只走 truncateShareQuote，禁止 CSS line-clamp / overflow:hidden。
 */
export const MemoryShareCard = forwardRef<HTMLDivElement, Props>(function MemoryShareCard(
  { payload },
  ref
) {
  const hasPhoto = Boolean(payload.photoDataUrl);

  // Always truncate in JS — never rely on CSS clipping for share text.
  const quoteText = useMemo(() => {
    if (!payload.content?.trim()) return null;
    return truncateShareQuote(payload.content);
  }, [payload.content]);

  return (
    <div
      ref={ref}
      className="lq-memory-share-card lq-memory-share-card--story"
      data-memory-share-card="capture"
      data-memory-share-format="story"
      style={{
        width: MEMORY_SHARE_CAPTURE_SIZE.width,
        height: MEMORY_SHARE_CAPTURE_SIZE.height,
        minWidth: MEMORY_SHARE_CAPTURE_SIZE.width,
        minHeight: MEMORY_SHARE_CAPTURE_SIZE.height,
      }}
    >
      <div className="lq-memory-share-card__safe">
        <header className="lq-memory-share-card__header">
          <p className="lq-memory-share-card__brand">❤️ LoveQuest</p>
          <p className="lq-memory-share-card__date">{payload.displayDate}</p>
        </header>

        <div className="lq-memory-share-card__photo-wrap">
          {hasPhoto ? (
            <img
              src={payload.photoDataUrl!}
              alt=""
              className="lq-memory-share-card__photo"
              data-share-asset
              crossOrigin="anonymous"
              decoding="sync"
            />
          ) : (
            <div className="lq-memory-share-card__photo-fallback" aria-hidden>
              <span>💕</span>
            </div>
          )}
        </div>

        <div className="lq-memory-share-card__quote-slot">
          {quoteText ? (
            <p className="lq-memory-share-card__quote">{quoteText}</p>
          ) : (
            <p className="lq-memory-share-card__quote lq-memory-share-card__quote--muted">
              今天留下了一張照片
            </p>
          )}
        </div>

        <div className="lq-memory-share-card__spacer" aria-hidden />

        <div className="lq-memory-share-card__meta">
          <p className="lq-memory-share-card__couple">
            💕 {payload.nameA} ❤️ {payload.nameB}
          </p>
          {payload.togetherDays != null ? (
            <p className="lq-memory-share-card__days">交往第 {payload.togetherDays} 天</p>
          ) : null}
          {payload.sourceLabel ? (
            <p className="lq-memory-share-card__source">來源：{payload.sourceLabel}</p>
          ) : null}
        </div>

        <footer className="lq-memory-share-card__footer">
          <LoveQuestShareBrandIcon className="lq-memory-share-card__logo" size={64} />
          <p className="lq-memory-share-card__logo-text">LoveQuest</p>
        </footer>
      </div>
    </div>
  );
});

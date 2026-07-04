import { forwardRef } from 'react';
import { APP_NAME } from '../../theme';
import {
  LOVE_CRISIS_SHARE_CAPTURE_SIZE,
  type LoveCrisisSharePayload,
} from '../loveCrisis/loveCrisisShareExport';
import { LoveQuestShareBrandIcon } from './LoveQuestShareBrandIcon';

type Props = {
  payload: LoveCrisisSharePayload;
  mode?: 'capture' | 'preview';
};

export const LoveCrisisShareCard = forwardRef<HTMLDivElement, Props>(function LoveCrisisShareCard(
  { payload, mode = 'capture' },
  ref
) {
  const isCapture = mode === 'capture';

  return (
    <div
      ref={ref}
      className="lq-heart-share-card lq-love-crisis-share-card"
      data-heart-share-card={isCapture ? 'capture' : 'preview'}
      style={
        isCapture
          ? {
              width: LOVE_CRISIS_SHARE_CAPTURE_SIZE.width,
              height: LOVE_CRISIS_SHARE_CAPTURE_SIZE.height,
            }
          : undefined
      }
    >
      <div className="lq-heart-share-card__bg" aria-hidden />
      <span className="lq-heart-share-card__ribbon lq-heart-share-card__ribbon--1" aria-hidden>
        💔
      </span>
      <span className="lq-heart-share-card__ribbon lq-heart-share-card__ribbon--2" aria-hidden>
        ✨
      </span>
      <span className="lq-heart-share-card__ribbon lq-heart-share-card__ribbon--3" aria-hidden>
        ❤️
      </span>

      <header className="lq-heart-share-card__brand">
        <LoveQuestShareBrandIcon className="lq-heart-share-card__logo" size={52} />
        <div>
          <p className="lq-heart-share-card__app">{APP_NAME}</p>
          <p className="lq-heart-share-card__app-en">LOVEQUEST</p>
        </div>
      </header>

      <p className="lq-heart-share-card__game">愛情危機</p>

      <div className="lq-heart-share-card__hero">
        <span className="lq-heart-share-card__trophy" aria-hidden>
          💘
        </span>
        <h1 className="lq-heart-share-card__title">成功修復 {payload.successCount} 次</h1>
        <p className="lq-heart-share-card__subtitle">
          {payload.playerAName} × {payload.playerBName}
        </p>
      </div>

      <ul className="lq-heart-share-card__stats">
        <li>最高連續成功 {payload.maxStreak} 次</li>
        <li>本局愛情危機挑戰</li>
      </ul>

      <p className="lq-heart-share-card__quote">{payload.verdict}</p>

      <footer className="lq-heart-share-card__cta">和另一半一起挑戰</footer>

      <span className="lq-heart-share-card__mascot" aria-hidden>
        🐾
      </span>
    </div>
  );
});

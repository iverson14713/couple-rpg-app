import { forwardRef } from 'react';
import { APP_NAME } from '../../theme';
import {
  SYNC_HEART_SHARE_CAPTURE_SIZE,
  type SyncHeartSharePayload,
} from '../syncHeart/syncHeartShareExport';
import { LoveQuestShareBrandIcon } from './LoveQuestShareBrandIcon';

type Props = {
  payload: SyncHeartSharePayload;
  mode?: 'capture' | 'preview';
};

export const SyncHeartShareCard = forwardRef<HTMLDivElement, Props>(function SyncHeartShareCard(
  { payload, mode = 'capture' },
  ref
) {
  const isCapture = mode === 'capture';
  const avgText =
    payload.averageDiffSeconds != null
      ? `${payload.averageDiffSeconds.toFixed(3)} 秒`
      : '—';
  const bestText =
    payload.bestDiffSeconds != null ? `${payload.bestDiffSeconds.toFixed(3)} 秒` : '—';

  return (
    <div
      ref={ref}
      className="lq-heart-share-card"
      data-heart-share-card={isCapture ? 'capture' : 'preview'}
      style={
        isCapture
          ? {
              width: SYNC_HEART_SHARE_CAPTURE_SIZE.width,
              height: SYNC_HEART_SHARE_CAPTURE_SIZE.height,
            }
          : undefined
      }
    >
      <div className="lq-heart-share-card__bg" aria-hidden />
      <span className="lq-heart-share-card__ribbon lq-heart-share-card__ribbon--1" aria-hidden>
        💕
      </span>
      <span className="lq-heart-share-card__ribbon lq-heart-share-card__ribbon--2" aria-hidden>
        ✨
      </span>
      <span className="lq-heart-share-card__ribbon lq-heart-share-card__ribbon--3" aria-hidden>
        💗
      </span>

      <header className="lq-heart-share-card__brand">
        <LoveQuestShareBrandIcon className="lq-heart-share-card__logo" size={52} />
        <div>
          <p className="lq-heart-share-card__app">{APP_NAME}</p>
          <p className="lq-heart-share-card__app-en">LOVEQUEST</p>
        </div>
      </header>

      <p className="lq-heart-share-card__game">心有靈犀</p>

      <div className="lq-heart-share-card__hero">
        <span className="lq-heart-share-card__trophy" aria-hidden>
          💘
        </span>
        <h1 className="lq-heart-share-card__title">默契分數 {payload.score} 分</h1>
        <p className="lq-heart-share-card__subtitle">
          {payload.playerAName} × {payload.playerBName}
        </p>
      </div>

      <ul className="lq-heart-share-card__stats">
        <li>平均差距：{avgText}</li>
        <li>最佳回合：{bestText}</li>
        <li>失敗回合：{payload.failCount}</li>
      </ul>

      <p className="lq-heart-share-card__quote">{payload.verdict}</p>

      <footer className="lq-heart-share-card__cta">和另一半一起挑戰默契吧</footer>

      <span className="lq-heart-share-card__mascot" aria-hidden>
        🐾
      </span>
    </div>
  );
});

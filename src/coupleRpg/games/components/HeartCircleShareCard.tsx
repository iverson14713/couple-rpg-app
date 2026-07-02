import { forwardRef } from 'react';
import { APP_NAME } from '../../theme';
import {
  HEART_CIRCLE_SHARE_CAPTURE_SIZE,
  type HeartCircleSharePayload,
} from '../heartCircle/heartCircleShareExport';
import { LoveQuestShareBrandIcon } from './LoveQuestShareBrandIcon';

type Props = {
  payload: HeartCircleSharePayload;
  mode?: 'capture' | 'preview';
};

export const HeartCircleShareCard = forwardRef<HTMLDivElement, Props>(function HeartCircleShareCard(
  { payload, mode = 'capture' },
  ref
) {
  const isCapture = mode === 'capture';

  return (
    <div
      ref={ref}
      className="lq-heart-share-card"
      data-heart-share-card={isCapture ? 'capture' : 'preview'}
      style={
        isCapture
          ? {
              width: HEART_CIRCLE_SHARE_CAPTURE_SIZE.width,
              height: HEART_CIRCLE_SHARE_CAPTURE_SIZE.height,
            }
          : undefined
      }
    >
      <div className="lq-heart-share-card__bg" aria-hidden />
      <span className="lq-heart-share-card__ribbon lq-heart-share-card__ribbon--1" aria-hidden>
        🎀
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

      <p className="lq-heart-share-card__game">愛心圈圈戰</p>

      <div className="lq-heart-share-card__hero">
        <span className="lq-heart-share-card__trophy" aria-hidden>
          🏆
        </span>
        <h1 className="lq-heart-share-card__title">🎉 {payload.winnerName} 贏了！</h1>
        <p className="lq-heart-share-card__subtitle">
          {payload.loserName} 這次沒地方可以圈了
        </p>
      </div>

      <ul className="lq-heart-share-card__stats">
        <li>本局回合數：{payload.totalRounds}</li>
        <li>
          今日遊戲：{payload.dailyGamesToday}/{payload.dailyGamesCap}
        </li>
        <li>感情升溫 +1</li>
      </ul>

      <p className="lq-heart-share-card__quote">「{payload.quote}」</p>

      <footer className="lq-heart-share-card__cta">和另一半一起挑戰吧</footer>

      <span className="lq-heart-share-card__mascot" aria-hidden>
        🐾
      </span>
    </div>
  );
});

import { formatSyncTime } from '../syncHeart/syncHeartLogic';
import type { SyncHeartRoundResult } from '../syncHeart/syncHeartTypes';

type Props = {
  result: SyncHeartRoundResult;
  playerAName: string;
  playerBName: string;
};

export function SyncHeartRoundPanel({ result, playerAName, playerBName }: Props) {
  if (result.failed && result.failReason === 'early_press') {
    const who =
      result.earlyPlayerIndex === 0 ? playerAName : result.earlyPlayerIndex === 1 ? playerBName : '有人';
    return (
      <div className="lq-sync-heart-round-panel lq-sync-heart-round-panel--fail">
        <p className="lq-sync-heart-round-panel__title">太急了啦 😂</p>
        <p className="lq-sync-heart-round-panel__sub">愛心還沒亮就按了</p>
        <p className="lq-sync-heart-round-panel__hint">{who} 偷按了</p>
      </div>
    );
  }

  if (result.playerATimeSec == null || result.playerBTimeSec == null || result.diffSeconds == null) {
    return null;
  }

  return (
    <div className="lq-sync-heart-round-panel">
      <p className="lq-sync-heart-round-panel__row">
        <span>{playerAName}</span>
        <span>{formatSyncTime(result.playerATimeSec)}</span>
      </p>
      <p className="lq-sync-heart-round-panel__row">
        <span>{playerBName}</span>
        <span>{formatSyncTime(result.playerBTimeSec)}</span>
      </p>
      <p className="lq-sync-heart-round-panel__diff">
        差距：<strong>{formatSyncTime(result.diffSeconds)}</strong>
      </p>
      <p className="lq-sync-heart-round-panel__rating">
        {result.ratingEmoji} {result.ratingLabel}
      </p>
    </div>
  );
}

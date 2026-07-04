import type { GameHudProps } from './gameLayoutTypes';

export function GameHud({
  timerLabel,
  scoreLabel,
  progressPercent,
  statusText,
  urgent = false,
  barPosition = 'below',
  className = '',
}: GameHudProps) {
  const clamped = Math.min(Math.max(progressPercent, 0), 1);

  const row = (
    <div className="lq-game-hud__row">
      <span className="lq-game-hud__timer">{timerLabel}</span>
      <span className="lq-game-hud__score">{scoreLabel}</span>
    </div>
  );

  const bar = (
    <div className="lq-game-hud__bar" role="progressbar" aria-valuenow={Math.round(clamped * 100)}>
      <div className="lq-game-hud__bar-fill" style={{ width: `${clamped * 100}%` }} />
    </div>
  );

  return (
    <header
      className={`lq-game-hud ${urgent ? 'lq-game-hud--urgent' : ''} ${className}`.trim()}
    >
      {barPosition === 'above' ? (
        <>
          {bar}
          {row}
        </>
      ) : (
        <>
          {row}
          {bar}
        </>
      )}
      {statusText ? <p className="lq-game-hud__status">{statusText}</p> : null}
    </header>
  );
}

type Props = {
  playerAName: string;
  playerBName: string;
  pressedA: boolean;
  pressedB: boolean;
  enabled: boolean;
  onPressA: () => void;
  onPressB: () => void;
};

export function SyncHeartPads({
  playerAName,
  playerBName,
  pressedA,
  pressedB,
  enabled,
  onPressA,
  onPressB,
}: Props) {
  return (
    <div className="lq-sync-heart-pad-bar">
      <button
        type="button"
        disabled={!enabled}
        onPointerDown={(e) => {
          e.preventDefault();
          if (enabled) onPressA();
        }}
        className={`lq-sync-heart-pad lq-sync-heart-pad--left ${
          pressedA ? 'lq-sync-heart-pad--pressed' : ''
        }`}
      >
        <span className="lq-sync-heart-pad__label">{playerAName}</span>
        {pressedA ? <span className="lq-sync-heart-pad__done">已按 ✓</span> : null}
      </button>
      <button
        type="button"
        disabled={!enabled}
        onPointerDown={(e) => {
          e.preventDefault();
          if (enabled) onPressB();
        }}
        className={`lq-sync-heart-pad lq-sync-heart-pad--right ${
          pressedB ? 'lq-sync-heart-pad--pressed' : ''
        }`}
      >
        <span className="lq-sync-heart-pad__label">{playerBName}</span>
        {pressedB ? <span className="lq-sync-heart-pad__done">已按 ✓</span> : null}
      </button>
    </div>
  );
}

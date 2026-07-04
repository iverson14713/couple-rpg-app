type Props = {
  lit: boolean;
  hint: string;
};

export function SyncHeartCore({ lit, hint }: Props) {
  return (
    <div className="lq-sync-heart-core-wrap">
      <div className="lq-sync-heart-particles" aria-hidden>
        <span className="lq-sync-heart-particle lq-sync-heart-particle--1">✨</span>
        <span className="lq-sync-heart-particle lq-sync-heart-particle--2">💗</span>
        <span className="lq-sync-heart-particle lq-sync-heart-particle--3">✨</span>
      </div>
      <div
        className={`lq-sync-heart-core ${lit ? 'lq-sync-heart-core--lit' : 'lq-sync-heart-core--waiting'}`}
        aria-hidden
      >
        <span className="lq-sync-heart-core__glow" />
        <span className="lq-sync-heart-core__heart">❤️</span>
      </div>
      <p className={`lq-sync-heart-hint ${lit ? 'lq-sync-heart-hint--go' : ''}`}>{hint}</p>
    </div>
  );
}

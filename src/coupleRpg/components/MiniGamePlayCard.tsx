import { lq } from '../theme';

export type MiniGameCardPhase = 'idle' | 'drawing' | 'revealed' | 'completed';

export type MiniGamePlayCardDisplay = {
  displayEmoji: string;
  displayTitle: string;
  displaySubtitle: string;
  displayContent: string | null;
};

type Props = MiniGamePlayCardDisplay & {
  phase: MiniGameCardPhase;
  /** revealed 進場時短暫 sparkle */
  showSparkles?: boolean;
};

export function MiniGamePlayCard({
  phase,
  displayEmoji,
  displayTitle,
  displaySubtitle,
  displayContent,
  showSparkles = false,
}: Props) {
  const phaseClass =
    phase === 'idle'
      ? 'game-card--idle'
      : phase === 'drawing'
        ? 'game-card--drawing'
        : phase === 'revealed'
          ? 'game-card--revealed'
          : 'game-card--completed';

  const emojiAnim =
    phase === 'idle'
      ? 'game-card-emoji--float'
      : phase === 'drawing'
        ? 'game-card-emoji--bounce'
        : phase === 'revealed'
          ? 'game-card-emoji--pop'
          : '';

  const titleAnim = phase === 'completed' ? 'game-card-title--success' : '';

  const bodyAnim = phase === 'revealed' || phase === 'completed' ? 'game-card-body--rise' : '';

  const contentAnim = phase === 'revealed' ? 'game-card-content--pop' : '';

  return (
    <div className={`game-card-scene ${phaseClass}`} aria-live="polite" aria-busy={phase === 'drawing'}>
      <div className="game-card-border-glow" aria-hidden />
      <div className="game-card-shimmer-border" aria-hidden />

      {showSparkles ? (
        <div className="game-card-sparkles" aria-hidden>
          <span>✨</span>
          <span>💕</span>
          <span>✦</span>
          <span>♡</span>
          <span>✨</span>
        </div>
      ) : null}

      <div className="game-card-inner">
        <span className={`game-card-emoji ${emojiAnim}`} aria-hidden>
          {displayEmoji}
        </span>

        {displayTitle ? (
          <p className={`game-card-title ${titleAnim} ${lq.text}`}>{displayTitle}</p>
        ) : null}

        {displaySubtitle ? (
          <p className={`game-card-subtitle ${bodyAnim} ${lq.textSecondary}`}>{displaySubtitle}</p>
        ) : null}

        {displayContent ? (
          <p className={`game-card-content ${bodyAnim} ${contentAnim} ${lq.text}`}>{displayContent}</p>
        ) : null}
      </div>
    </div>
  );
}

import { lq } from '../theme';

export type MiniGameCardPhase = 'idle' | 'drawing' | 'revealed' | 'completed';

export type MiniGamePlayCardDisplay = {
  displayEmoji: string;
  displayTitle: string;
  displaySubtitle: string;
  displayContent: string | null;
};

export type MiniGameCarouselPreview = {
  emoji: string;
  text: string;
};

type Props = MiniGamePlayCardDisplay & {
  phase: MiniGameCardPhase;
  showSparkles?: boolean;
  carouselPreview?: MiniGameCarouselPreview | null;
  rarityLabel?: string | null;
  rarityClass?: string;
  isDiceMode?: boolean;
  revealKey?: number;
};

export function MiniGamePlayCard({
  phase,
  displayEmoji,
  displayTitle,
  displaySubtitle,
  displayContent,
  showSparkles = false,
  carouselPreview = null,
  rarityLabel = null,
  rarityClass = '',
  isDiceMode = false,
  revealKey = 0,
}: Props) {
  const isCarousel = phase === 'drawing' && Boolean(carouselPreview);
  const emoji = isCarousel ? carouselPreview!.emoji : displayEmoji;
  const content = isCarousel ? carouselPreview!.text : displayContent;
  const title = isCarousel ? '' : displayTitle;
  const subtitle = isCarousel ? '' : displaySubtitle;

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
        ? isDiceMode
          ? 'game-card-emoji--spin'
          : 'game-card-emoji--shuffle'
        : phase === 'revealed'
          ? 'game-card-emoji--pop'
          : '';

  const titleAnim = phase === 'completed' ? 'game-card-title--success' : '';

  const bodyAnim = phase === 'revealed' || phase === 'completed' ? 'game-card-body--rise' : '';

  const contentAnim = phase === 'drawing' && isCarousel ? 'game-card-content--carousel' : '';

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

      <div key={revealKey} className="game-card-inner">
        {rarityLabel && phase === 'revealed' ? (
          <p className={`game-card-rarity ${rarityClass}`}>{rarityLabel}</p>
        ) : null}

        <span className={`game-card-emoji ${emojiAnim}`} aria-hidden>
          {emoji}
        </span>

        {title ? <p className={`game-card-title ${titleAnim} ${lq.text}`}>{title}</p> : null}

        {subtitle ? (
          <p className={`game-card-subtitle ${bodyAnim} ${lq.textSecondary}`}>{subtitle}</p>
        ) : null}

        {content ? (
          <p className={`game-card-content ${bodyAnim} ${contentAnim} ${lq.text}`}>{content}</p>
        ) : null}
      </div>
    </div>
  );
}

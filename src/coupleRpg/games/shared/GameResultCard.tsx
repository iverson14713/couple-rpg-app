import { Loader2, Share2 } from 'lucide-react';
import { lq } from '../../theme';
import { LoveQuestShareBrandIcon } from '../components/LoveQuestShareBrandIcon';
import type { GameResultCardProps } from './gameLayoutTypes';

export function GameResultCard({
  open,
  gameLabel,
  title,
  subtitle,
  stats,
  quote,
  children,
  onShare,
  sharing = false,
  shareDisabled = false,
  onPlayAgain,
  onBackToList,
  playAgainLabel = '再玩一次',
  backLabel = '回遊戲列表',
  shareLabel = '分享戰績',
}: GameResultCardProps) {
  if (!open) return null;

  return (
    <div className="lq-game-result-overlay" role="dialog" aria-modal="true">
      <div className="lq-game-result-card lq-game-result-card--shared">
        <div className="lq-game-result-card__decor" aria-hidden>
          <span className="lq-game-result-confetti lq-game-result-confetti--1">🎀</span>
          <span className="lq-game-result-confetti lq-game-result-confetti--2">✨</span>
          <span className="lq-game-result-confetti lq-game-result-confetti--3">💗</span>
          <span className="lq-game-result-mascot">🐾</span>
        </div>

        <header className="lq-game-result-brand">
          <LoveQuestShareBrandIcon className="lq-game-result-brand__logo" size={32} />
          <span className="lq-game-result-brand__name">LoveQuest 情侶日常</span>
        </header>

        <p className="lq-game-result-game-label">{gameLabel}</p>

        <div className="lq-game-result-card__body">
          {children}
          <h2 className="lq-game-result-title">{title}</h2>
          {subtitle ? <p className="lq-game-result-subtitle">{subtitle}</p> : null}
          {stats ? <div className="lq-game-result-stats">{stats}</div> : null}
          {quote ? <p className="lq-game-result-quote">「{quote}」</p> : null}
        </div>

        <div className="lq-game-result-actions">
          <button type="button" onClick={onPlayAgain} className={lq.btnPrimary}>
            {playAgainLabel}
          </button>
          {onShare ? (
            <button
              type="button"
              onClick={onShare}
              disabled={sharing || shareDisabled}
              className={`lq-game-result-share-btn ${lq.btnSecondary}`}
            >
              {sharing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Share2 className="h-4 w-4" aria-hidden />
              )}
              {shareLabel}
            </button>
          ) : null}
          <button type="button" onClick={onBackToList} className={lq.btnSecondary}>
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

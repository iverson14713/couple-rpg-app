import { Loader2, Share2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { lq } from '../../theme';
import {
  captureHeartCircleShareCard,
  shareHeartCircleCard,
  type HeartCircleSharePayload,
} from '../heartCircle/heartCircleShareExport';
import { waitForShareCardAssets } from '../heartCircle/loveQuestShareBrand';
import { HeartCircleShareCard } from './HeartCircleShareCard';
import { LoveQuestShareBrandIcon } from './LoveQuestShareBrandIcon';

type Props = {
  open: boolean;
  winnerName: string;
  loserName: string;
  totalRounds: number;
  dailyGamesToday: number;
  dailyGamesCap: number;
  quote: string;
  onPlayAgain: () => void;
  onBackToList: () => void;
};

export function GameResultModal({
  open,
  winnerName,
  loserName,
  totalRounds,
  dailyGamesToday,
  dailyGamesCap,
  quote,
  onPlayAgain,
  onBackToList,
}: Props) {
  const { showToast } = useToast();
  const captureRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const sharePayload = useMemo<HeartCircleSharePayload>(
    () => ({
      winnerName,
      loserName,
      totalRounds,
      dailyGamesToday,
      dailyGamesCap,
      quote,
    }),
    [winnerName, loserName, totalRounds, dailyGamesToday, dailyGamesCap, quote]
  );

  useEffect(() => {
    if (!open) return;
    void waitForShareCardAssets(captureRef.current);
  }, [open, sharePayload]);

  const handleShare = useCallback(async () => {
    if (!captureRef.current || sharing) return;
    setSharing(true);
    try {
      await waitForShareCardAssets(captureRef.current);
      const blob = await captureHeartCircleShareCard(captureRef.current);
      const result = await shareHeartCircleCard(blob, sharePayload);
      if (result === 'cancelled') return;
      if (result === 'failed') {
        showToast('分享失敗，請再試一次', 'error', { position: 'top' });
        return;
      }
      showToast('已準備好分享囉', 'success', { position: 'top' });
    } catch (e) {
      console.error('[heart-circle] share', e);
      showToast('分享失敗，請再試一次', 'error', { position: 'top' });
    } finally {
      setSharing(false);
    }
  }, [sharePayload, sharing, showToast]);

  if (!open) return null;

  return (
    <>
      <div className="lq-heart-share-capture-host" aria-hidden>
        <HeartCircleShareCard ref={captureRef} payload={sharePayload} mode="capture" />
      </div>

      <div
        className="lq-game-result-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-result-title"
      >
        <div className="lq-game-result-card">
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

          <p className="lq-game-result-game-label">愛心圈圈戰</p>

          <p className="lq-game-result-trophy" aria-hidden>
            🏆
          </p>
          <h2 id="game-result-title" className="lq-game-result-title">
            🎉 {winnerName} 贏了！
          </h2>
          <p className="lq-game-result-subtitle">{loserName} 這次沒地方可以圈了</p>

          <div className="lq-game-result-stats">
            <span className="lq-game-result-stat">感情升溫 +1</span>
            <span className="lq-game-result-stat">本局回合數：{totalRounds}</span>
            <span className="lq-game-result-stat">
              今日遊戲：{dailyGamesToday}/{dailyGamesCap}
            </span>
          </div>

          <p className="lq-game-result-quote">「{quote}」</p>

          <div className="lq-game-result-actions">
            <button type="button" onClick={onPlayAgain} className={lq.btnPrimary}>
              再玩一次
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className={`lq-game-result-share-btn ${lq.btnSecondary}`}
            >
              {sharing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Share2 className="h-4 w-4" aria-hidden />
              )}
              分享戰績
            </button>
            <button type="button" onClick={onBackToList} className={lq.btnSecondary}>
              回遊戲列表
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

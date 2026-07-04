import { Loader2, Share2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { lq } from '../../theme';
import type { XiaoiState } from '../../xiaoi/types';
import {
  buildSyncHeartSharePayload,
  captureSyncHeartShareCard,
  shareSyncHeartCard,
  type SyncHeartSharePayload,
} from '../syncHeart/syncHeartShareExport';
import type { SyncHeartGameResult } from '../syncHeart/syncHeartTypes';
import { waitForShareCardAssets } from '../heartCircle/loveQuestShareBrand';
import { XiaoiStaticPet } from '../../components/xiaoi/XiaoiStaticPet';
import { LoveQuestShareBrandIcon } from './LoveQuestShareBrandIcon';
import { SyncHeartShareCard } from './SyncHeartShareCard';

type Props = {
  open: boolean;
  result: SyncHeartGameResult;
  playerAName: string;
  playerBName: string;
  onPlayAgain: () => void;
  onBackToList: () => void;
};

function xiaoiStateForScore(score: number, allFailed: boolean): XiaoiState {
  if (allFailed || score < 50) return 'sad';
  if (score >= 85) return 'happy';
  return 'sleepy';
}

export function SyncHeartResultModal({
  open,
  result,
  playerAName,
  playerBName,
  onPlayAgain,
  onBackToList,
}: Props) {
  const { showToast } = useToast();
  const captureRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const sharePayload = useMemo<SyncHeartSharePayload>(
    () => buildSyncHeartSharePayload(result, playerAName, playerBName),
    [result, playerAName, playerBName]
  );

  const xiaoiState = xiaoiStateForScore(result.score, result.allFailed);

  useEffect(() => {
    if (!open) return;
    void waitForShareCardAssets(captureRef.current);
  }, [open, sharePayload]);

  const handleShare = useCallback(async () => {
    if (!captureRef.current || sharing) return;
    setSharing(true);
    try {
      await waitForShareCardAssets(captureRef.current);
      const blob = await captureSyncHeartShareCard(captureRef.current);
      const shareResult = await shareSyncHeartCard(blob, sharePayload);
      if (shareResult === 'cancelled') return;
      if (shareResult === 'failed') {
        showToast('分享失敗，請再試一次', 'error', { position: 'top' });
        return;
      }
      if (shareResult === 'copied') {
        showToast('已複製分享文案', 'success', { position: 'top' });
        return;
      }
      showToast('已準備好分享囉', 'success', { position: 'top' });
    } catch (e) {
      console.error('[sync-heart] share', e);
      showToast('分享失敗，請再試一次', 'error', { position: 'top' });
    } finally {
      setSharing(false);
    }
  }, [sharePayload, sharing, showToast]);

  if (!open) return null;

  const avgText =
    result.averageDiffSeconds != null
      ? `${result.averageDiffSeconds.toFixed(3)} 秒`
      : '—';
  const bestText =
    result.bestDiffSeconds != null ? `${result.bestDiffSeconds.toFixed(3)} 秒` : '—';

  return (
    <>
      <div className="lq-heart-share-capture-host" aria-hidden>
        <SyncHeartShareCard ref={captureRef} payload={sharePayload} mode="capture" />
      </div>

      <div
        className="lq-game-result-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-heart-result-title"
      >
        <div className="lq-game-result-card">
          <div className="lq-game-result-card__decor" aria-hidden>
            <span className="lq-game-result-confetti lq-game-result-confetti--1">💕</span>
            <span className="lq-game-result-confetti lq-game-result-confetti--2">✨</span>
            <span className="lq-game-result-confetti lq-game-result-confetti--3">💗</span>
            <div className="lq-sync-heart-result-mascot">
              <XiaoiStaticPet state={xiaoiState} showCaption={false} imageClassName="h-10 w-auto object-contain" />
            </div>
          </div>

          <header className="lq-game-result-brand">
            <LoveQuestShareBrandIcon className="lq-game-result-brand__logo" size={32} />
            <span className="lq-game-result-brand__name">LoveQuest 情侶日常</span>
          </header>

          <p className="lq-game-result-game-label">心有靈犀</p>

          <p className="lq-game-result-trophy" aria-hidden>
            💘
          </p>
          <h2 id="sync-heart-result-title" className="lq-game-result-title">
            默契分數 {result.score} 分
          </h2>
          <p className="lq-game-result-subtitle">{result.verdict}</p>

          <div className="lq-game-result-stats">
            <span className="lq-game-result-stat">平均差距：{avgText}</span>
            <span className="lq-game-result-stat">最佳回合：{bestText}</span>
            <span className="lq-game-result-stat">失敗回合：{result.failCount}</span>
          </div>

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

import { Loader2, Share2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { lq } from '../../theme';
import { waitForShareCardAssets } from '../heartCircle/loveQuestShareBrand';
import {
  buildLoveCrisisSharePayload,
  captureLoveCrisisShareCard,
  shareLoveCrisisCard,
  type LoveCrisisSharePayload,
} from '../loveCrisis/loveCrisisShareExport';
import type { LoveCrisisGameResult } from '../loveCrisis/loveCrisisTypes';
import { LoveCrisisShareCard } from './LoveCrisisShareCard';
import { LoveCrisisXiaoiCompanion } from './LoveCrisisXiaoiCompanion';
import { LoveQuestShareBrandIcon } from './LoveQuestShareBrandIcon';

type Props = {
  open: boolean;
  result: LoveCrisisGameResult;
  playerAName: string;
  playerBName: string;
  onPlayAgain: () => void;
  onBackToList: () => void;
};

function resultMood(result: LoveCrisisGameResult): 'holding' | 'sad' | 'celebrate' {
  if (result.successCount === 0 || result.syncScore < 50) return 'sad';
  if (result.syncScore >= 85) return 'celebrate';
  return 'holding';
}

export function LoveCrisisResultModal({
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

  const sharePayload = useMemo<LoveCrisisSharePayload>(
    () => buildLoveCrisisSharePayload(result, playerAName, playerBName),
    [result, playerAName, playerBName]
  );

  const mood = resultMood(result);

  useEffect(() => {
    if (!open) return;
    void waitForShareCardAssets(captureRef.current);
  }, [open, sharePayload]);

  const handleShare = useCallback(async () => {
    if (!captureRef.current || sharing) return;
    setSharing(true);
    try {
      await waitForShareCardAssets(captureRef.current);
      const blob = await captureLoveCrisisShareCard(captureRef.current);
      const shareResult = await shareLoveCrisisCard(blob, sharePayload);
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
      console.error('[love-crisis] share', e);
      showToast('分享失敗，請再試一次', 'error', { position: 'top' });
    } finally {
      setSharing(false);
    }
  }, [sharePayload, sharing, showToast]);

  if (!open) return null;

  return (
    <>
      <div className="lq-heart-share-capture-host" aria-hidden>
        <LoveCrisisShareCard ref={captureRef} payload={sharePayload} mode="capture" />
      </div>

      <div
        className="lq-love-crisis-result-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="love-crisis-result-title"
      >
        <div className="lq-love-crisis-result-card">
          <div className="lq-love-crisis-result-card__bg" aria-hidden>
            <span className="lq-love-crisis-result-card__spark lq-love-crisis-result-card__spark--1">
              ✨
            </span>
            <span className="lq-love-crisis-result-card__spark lq-love-crisis-result-card__spark--2">
              💕
            </span>
            <span className="lq-love-crisis-result-card__spark lq-love-crisis-result-card__spark--3">
              💗
            </span>
          </div>

          <header className="lq-game-result-brand lq-love-crisis-result-card__brand">
            <LoveQuestShareBrandIcon className="lq-game-result-brand__logo" size={32} />
            <span className="lq-game-result-brand__name">LoveQuest 情侶日常</span>
          </header>

          <p className="lq-love-crisis-result-card__label">愛情危機 · Pro</p>

          <div className="lq-love-crisis-result-card__hero">
            <LoveCrisisXiaoiCompanion mood={mood} size="result" holdingHeart />
          </div>

          <h2 id="love-crisis-result-title" className="lq-love-crisis-result-card__title">
            今日成功修復 {result.successCount} 顆
          </h2>
          <p className="lq-love-crisis-result-card__tagline">{result.tagline}</p>
          <p className="lq-love-crisis-result-card__verdict">{result.verdict}</p>

          <div className="lq-love-crisis-result-card__stats">
            <span>最高連續 {result.maxStreak} 顆</span>
            <span>失敗 {result.failCount} 顆</span>
            <span>默契分 {result.syncScore}</span>
          </div>

          <p className="lq-love-crisis-result-card__players">
            {playerAName} × {playerBName}
          </p>

          <div className="lq-love-crisis-result-card__actions">
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

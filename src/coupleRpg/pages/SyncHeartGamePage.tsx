import { ChevronLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';
import { SyncHeartCore } from '../games/components/SyncHeartCore';
import { SyncHeartPads } from '../games/components/SyncHeartPads';
import { SyncHeartResultModal } from '../games/components/SyncHeartResultModal';
import { SyncHeartRoundPanel } from '../games/components/SyncHeartRoundPanel';
import { useSyncHeartGame } from '../games/syncHeart/useSyncHeartGame';

export function SyncHeartGamePage() {
  const { navigateTo } = useCoupleRpgNav();
  const { displayNames } = useLoveQuest();
  const game = useSyncHeartGame();

  const playerAName = displayNames.me || '玩家 A';
  const playerBName = displayNames.partner || '玩家 B';

  const hint = useMemo(() => {
    if (game.phase === 'go') return '一起按！';
    if (game.phase === 'round_end') return '本回合結束';
    return '等待愛心亮起…';
  }, [game.phase]);

  const subHint =
    game.phase === 'waiting' || game.phase === 'go'
      ? '等愛心亮起後一起按'
      : game.isLastRound
        ? '查看本局默契成績'
        : '準備下一回合';

  return (
    <div className="lq-sync-heart-game-page">
      <button
        type="button"
        onClick={() => navigateTo('games')}
        className="lq-sync-heart-game-back flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        回遊戲列表
      </button>

      <header className="lq-sync-heart-header">
        <h1 className="lq-sync-heart-title">心有靈犀</h1>
        <p className="lq-sync-heart-round">
          Round {game.round} / {game.totalRounds}
        </p>
        <p className="lq-sync-heart-subhint">{subHint}</p>
      </header>

      <SyncHeartCore lit={game.heartLit} hint={hint} />

      {game.phase === 'round_end' && game.currentRoundResult ? (
        <SyncHeartRoundPanel
          result={game.currentRoundResult}
          playerAName={playerAName}
          playerBName={playerBName}
        />
      ) : null}

      {game.phase === 'round_end' ? (
        <button type="button" onClick={game.nextRound} className={`lq-sync-heart-next-btn ${lq.btnPrimary}`}>
          {game.isLastRound ? '查看結果' : '下一回合'}
        </button>
      ) : null}

      <SyncHeartPads
        playerAName={playerAName}
        playerBName={playerBName}
        pressedA={game.presses.playerA != null}
        pressedB={game.presses.playerB != null}
        enabled={game.padsEnabled}
        onPressA={() => game.onPlayerPress(0)}
        onPressB={() => game.onPlayerPress(1)}
      />

      {game.result ? (
        <SyncHeartResultModal
          open={game.phase === 'ended'}
          result={game.result}
          playerAName={playerAName}
          playerBName={playerBName}
          onPlayAgain={game.resetGame}
          onBackToList={() => navigateTo('games')}
        />
      ) : null}
    </div>
  );
}

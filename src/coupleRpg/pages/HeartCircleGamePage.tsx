import { ChevronLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { GameResultModal } from '../games/components/GameResultModal';
import { GameTurnHud } from '../games/components/GameTurnHud';
import { HeartBoard } from '../games/components/HeartBoard';
import { HeartCircleActionBar } from '../games/components/HeartCircleActionBar';
import { TurnChangeOverlay } from '../games/components/TurnChangeOverlay';
import { useHeartCircleGame } from '../games/heartCircle/useHeartCircleGame';

export function HeartCircleGamePage() {
  const { navigateTo } = useCoupleRpgNav();
  const { displayNames } = useLoveQuest();

  const playerNames = useMemo<[string, string]>(
    () => [displayNames.me || '玩家 A', displayNames.partner || '玩家 B'],
    [displayNames.me, displayNames.partner]
  );

  const game = useHeartCircleGame(playerNames);

  const result = game.result;
  const loserName = result != null ? playerNames[result.loserIndex] : '';
  const winnerName = result != null ? playerNames[result.winnerIndex] : '';

  return (
    <div className="lq-heart-game-page">
      <button
        type="button"
        onClick={() => navigateTo('games')}
        className="lq-heart-game-back flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        回遊戲列表
      </button>

      <GameTurnHud
        round={game.round}
        currentPlayerName={game.currentPlayerName}
        waitingPlayerName={game.waitingPlayerName}
        diceValue={game.diceValue}
        rolling={game.phase === 'rolling'}
        canRoll={game.canRoll}
        selecting={game.phase === 'selecting'}
        selectedCount={game.selectedCount}
        onRoll={game.onRollDice}
      />

      <HeartBoard
        cells={game.cells}
        canSelect={game.canSelect}
        awaitingRoll={game.canRoll}
        maxSelect={game.phase === 'selecting' ? game.diceValue : null}
        onCellSelect={game.onCellSelect}
        onSelectMaxed={game.onCellSelectMaxed}
        onTapBeforeRoll={game.onBoardTapBeforeRoll}
      />

      <HeartCircleActionBar
        canClear={game.phase === 'selecting' && game.selectedCount > 0}
        canConfirm={game.canConfirm}
        onClear={game.onClearSelection}
        onConfirm={game.onConfirmSelection}
      />

      <TurnChangeOverlay message={game.turnNotice} />

      <GameResultModal
        open={game.phase === 'ended' && result != null}
        winnerName={winnerName}
        loserName={loserName}
        totalRounds={result?.totalRounds ?? game.round}
        dailyGamesToday={result?.dailyGamesToday ?? 0}
        dailyGamesCap={result?.dailyGamesCap ?? 5}
        quote={result?.quote ?? ''}
        onPlayAgain={game.resetGame}
        onBackToList={() => navigateTo('games')}
      />
    </div>
  );
}

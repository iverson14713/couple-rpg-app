import { ChevronLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { DiceButton } from '../games/components/DiceButton';
import { GameResultModal } from '../games/components/GameResultModal';
import { HeartBoard } from '../games/components/HeartBoard';
import { useHeartCircleGame } from '../games/heartCircle/useHeartCircleGame';
import { lq } from '../theme';

export function HeartCircleGamePage() {
  const { navigateTo } = useCoupleRpgNav();
  const { displayNames } = useLoveQuest();

  const playerNames = useMemo<[string, string]>(
    () => [displayNames.me || '玩家 A', displayNames.partner || '玩家 B'],
    [displayNames.me, displayNames.partner]
  );

  const game = useHeartCircleGame(playerNames);

  const loserName =
    game.result != null ? playerNames[game.result.loserIndex] : '';
  const winnerName =
    game.result != null ? playerNames[game.result.winnerIndex] : '';

  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={() => navigateTo('games')}
        className="mb-2 flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        回遊戲列表
      </button>

      <div className={`mb-3 p-3.5 ${lq.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <p className="font-bold text-[#3d3539]">
            目前玩家：<span className="text-rose-600">{game.currentPlayerName}</span>
          </p>
          <p className="font-semibold text-[#8a7a84]">第 {game.round} 回合</p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-[#b8abb3]">骰子點數</p>
            <p className="text-[28px] font-extrabold leading-none text-[#3d3539]">
              {game.diceValue ?? '—'}
            </p>
          </div>
          <DiceButton
            value={game.diceValue}
            rolling={game.phase === 'rolling'}
            disabled={!game.canRoll}
            onRoll={game.onRollDice}
          />
        </div>
        {game.phase === 'selecting' && game.diceValue != null ? (
          <p className="mt-2 text-[12px] font-medium text-[#b07a8f]">
            請選 {game.diceValue} 顆相連的愛心（已選 {game.selectedCount}）
          </p>
        ) : null}
      </div>

      <HeartBoard cells={game.cells} canSelect={game.canSelect} onCellTap={game.onCellTap} />

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={game.onClearSelection}
          disabled={game.phase !== 'selecting' || game.selectedCount === 0}
          className={`flex-1 rounded-xl py-2.5 text-[14px] font-bold disabled:opacity-40 ${lq.btnSecondary}`}
        >
          重新選取
        </button>
        <button
          type="button"
          onClick={game.onConfirmSelection}
          disabled={!game.canConfirm}
          className={`flex-1 rounded-xl py-2.5 text-[14px] font-bold disabled:opacity-40 ${lq.btnPrimary}`}
        >
          確認圈起
        </button>
      </div>

      <GameResultModal
        open={game.phase === 'ended' && game.result != null}
        winnerName={winnerName}
        loserName={loserName}
        onPlayAgain={game.resetGame}
        onBackToList={() => navigateTo('games')}
      />
    </div>
  );
}

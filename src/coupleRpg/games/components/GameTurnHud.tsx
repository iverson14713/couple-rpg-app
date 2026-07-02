import { DiceButton } from './DiceButton';
import { GameRulesHint } from './GameRulesHint';

type Props = {
  round: number;
  currentPlayerName: string;
  waitingPlayerName: string;
  diceValue: number | null;
  rolling: boolean;
  canRoll: boolean;
  selecting: boolean;
  selectedCount: number;
  onRoll: () => void;
};

export function GameTurnHud({
  round,
  currentPlayerName,
  waitingPlayerName,
  diceValue,
  rolling,
  canRoll,
  selecting,
  selectedCount,
  onRoll,
}: Props) {
  const dicePanelHint =
    selecting && diceValue != null
      ? `請圈起 ${diceValue} 顆相連愛心${selectedCount > 0 ? ` · 已選 ${selectedCount}` : ''}`
      : canRoll && !rolling
        ? '點擊骰子開始'
        : null;

  return (
    <div className="lq-heart-hud lq-heart-hud--compact">
      <GameRulesHint variant="inline" />
      <div className="lq-heart-hud__main">
        <div className="lq-heart-hud__info">
          <span className="lq-heart-hud__round">第 {round} 回合</span>
          <div className="lq-heart-hud__players">
            <span className="lq-heart-hud__player lq-heart-hud__player--active">
              <span className="lq-heart-hud__crown" aria-hidden>
                👑
              </span>
              {currentPlayerName}
            </span>
            <span className="lq-heart-hud__player lq-heart-hud__player--waiting">
              vs {waitingPlayerName}
            </span>
          </div>
        </div>
        <DiceButton
          value={diceValue}
          rolling={rolling}
          disabled={!canRoll}
          ready={canRoll}
          onRoll={onRoll}
          hint={dicePanelHint}
        />
      </div>
    </div>
  );
}

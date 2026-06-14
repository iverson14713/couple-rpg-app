import { useEffect } from 'react';

type Props = {
  visible: boolean;
  loveCoins: number;
  xp: number;
  onDone: () => void;
};

const FLOAT_MS = 1000;

export function MiniGameRewardFloat({ visible, loveCoins, xp, onDone }: Props) {
  useEffect(() => {
    if (!visible) return;
    const tid = window.setTimeout(onDone, FLOAT_MS);
    return () => clearTimeout(tid);
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div className="mini-game-reward-float" aria-live="polite">
      <span className="mini-game-reward-float__line mini-game-reward-float__line--coin">
        🪙 +{loveCoins} LoveCoin
      </span>
      <span className="mini-game-reward-float__line mini-game-reward-float__line--xp">✨ +{xp} EXP</span>
    </div>
  );
}

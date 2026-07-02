import { useState } from 'react';

/** 3×3 骰子點位（row, col） */
const DICE_PIPS: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

type DiceFaceProps = {
  value: number | null;
  rolling?: boolean;
};

export function DiceFace({ value, rolling = false }: DiceFaceProps) {
  const pips = value != null && value >= 1 && value <= 6 ? DICE_PIPS[value]! : [];
  const pipSet = new Set(pips.map(([r, c]) => `${r}-${c}`));

  return (
    <div
      className={`lq-dice-cube ${rolling ? 'lq-dice-cube--rolling' : ''} ${
        value == null ? 'lq-dice-cube--empty' : ''
      }`}
      aria-hidden
    >
      <div className="lq-dice-cube__inner">
        {Array.from({ length: 9 }, (_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const active = pipSet.has(`${row}-${col}`);
          return (
            <span
              key={i}
              className={`lq-dice-pip ${active ? 'lq-dice-pip--on' : 'lq-dice-pip--off'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

type DiceButtonProps = {
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  ready?: boolean;
  onRoll: () => void;
  hint?: string | null;
};

export function DiceButton({
  value,
  rolling,
  disabled,
  ready = false,
  onRoll,
  hint,
}: DiceButtonProps) {
  const [tapped, setTapped] = useState(false);

  const handleClick = () => {
    if (disabled || rolling) return;
    setTapped(true);
    window.setTimeout(() => setTapped(false), 320);
    onRoll();
  };

  const isReady = ready && !rolling && !disabled;

  return (
    <div className="lq-heart-dice-panel">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || rolling}
        className={`lq-heart-dice-btn ${rolling ? 'lq-heart-dice-btn--rolling' : ''} ${
          isReady ? 'lq-heart-dice-btn--ready' : ''
        } ${tapped ? 'lq-heart-dice-btn--tapped' : ''}`}
        aria-label={isReady ? '點擊骰子開始' : '擲骰'}
      >
        <DiceFace value={value} rolling={rolling} />
      </button>
      {hint ? <p className="lq-heart-dice-hint">{hint}</p> : null}
    </div>
  );
}

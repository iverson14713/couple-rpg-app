type Props = {
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  onRoll: () => void;
};

export function DiceButton({ value, rolling, disabled, onRoll }: Props) {
  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={disabled || rolling}
      className={`lq-heart-dice-btn ${rolling ? 'lq-heart-dice-btn--rolling' : ''}`}
    >
      <span className="text-[11px] font-bold text-[#b07a8f]">擲骰</span>
      <span className="lq-heart-dice-face" aria-live="polite">
        {value ?? '—'}
      </span>
    </button>
  );
}

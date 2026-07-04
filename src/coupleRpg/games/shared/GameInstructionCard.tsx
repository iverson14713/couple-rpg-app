import type { GameInstructionCardProps, GameInstructionChip } from './gameLayoutTypes';

const CHIP_TONE_CLASS: Record<NonNullable<GameInstructionChip['tone']>, string> = {
  default: '',
  active: 'lq-game-instruction-card__chip--active',
  done: 'lq-game-instruction-card__chip--done',
  hold: 'lq-game-instruction-card__chip--hold',
  double: 'lq-game-instruction-card__chip--double',
};

export function GameInstructionCard({
  hint,
  chips = [],
  lines = 1,
  className = '',
}: GameInstructionCardProps) {
  return (
    <div
      className={`lq-game-instruction-card lq-game-instruction-card--lines-${lines} ${className}`.trim()}
      data-lines={lines}
    >
      <p className="lq-game-instruction-card__hint">{hint}</p>
      {chips.length > 0 ? (
        <div className="lq-game-instruction-card__chips">
          {chips.map((chip, index) => (
            <span key={chip.id} className="lq-game-instruction-card__chip-item">
              {index > 0 ? <span className="lq-game-instruction-card__arrow">→</span> : null}
              <span
                className={`lq-game-instruction-card__chip ${
                  CHIP_TONE_CLASS[chip.tone ?? 'default']
                }`}
              >
                {chip.label}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

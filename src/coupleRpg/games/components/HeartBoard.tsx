import type { CSSProperties } from 'react';
import type { HeartCell } from '../heartCircle/heartCircleTypes';
import { BOARD_SIZE } from '../heartCircle/heartCircleTypes';

type Props = {
  cells: HeartCell[];
  canSelect: boolean;
  onCellTap: (cellId: string) => void;
};

export function HeartBoard({ cells, canSelect, onCellTap }: Props) {
  return (
    <div
      className="lq-heart-board mx-auto w-full max-w-[min(100%,20rem)]"
      style={{ '--board-cols': BOARD_SIZE } as CSSProperties}
      role="grid"
      aria-label="愛心棋盤"
    >
      {cells.map((cell) => {
        const occupied = cell.status === 'occupied';
        const selected = cell.status === 'selected';
        const disabled = !canSelect || occupied;

        return (
          <button
            key={cell.id}
            type="button"
            disabled={disabled}
            onClick={() => onCellTap(cell.id)}
            className={`lq-heart-cell ${occupied ? 'lq-heart-cell--occupied' : ''} ${
              selected ? 'lq-heart-cell--selected' : ''
            }`}
            aria-label={
              occupied ? '已佔用' : selected ? '已選取' : canSelect ? '可選愛心' : '愛心'
            }
          >
            <span aria-hidden>{occupied ? '·' : selected ? '♥' : '♡'}</span>
          </button>
        );
      })}
    </div>
  );
}

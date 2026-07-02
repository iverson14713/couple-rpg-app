import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type { CSSProperties } from 'react';
import type { HeartCell } from '../heartCircle/heartCircleTypes';
import { BOARD_SIZE } from '../heartCircle/heartCircleTypes';

type Props = {
  cells: HeartCell[];
  canSelect: boolean;
  awaitingRoll?: boolean;
  maxSelect: number | null;
  onCellSelect: (cellId: string) => boolean;
  onSelectMaxed: () => void;
  onTapBeforeRoll?: () => void;
};

function cellIdFromPoint(x: number, y: number): string | null {
  const elements = document.elementsFromPoint(x, y);
  for (const el of elements) {
    if (!(el instanceof Element)) continue;
    const cell = el.closest<HTMLElement>('[data-cell-id]');
    if (cell?.dataset.cellId) return cell.dataset.cellId;
  }
  return null;
}

export function HeartBoard({
  cells,
  canSelect,
  awaitingRoll = false,
  maxSelect,
  onCellSelect,
  onSelectMaxed,
  onTapBeforeRoll,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const maxedNotifiedRef = useRef(false);
  const cellsRef = useRef(cells);
  const maxSelectRef = useRef(maxSelect);
  const [bounceIds, setBounceIds] = useState<Set<string>>(() => new Set());
  const [glowIds, setGlowIds] = useState<Set<string>>(() => new Set());

  cellsRef.current = cells;
  maxSelectRef.current = maxSelect;

  const triggerBounce = useCallback((cellId: string) => {
    setBounceIds((prev) => new Set(prev).add(cellId));
    setGlowIds((prev) => new Set(prev).add(cellId));
    window.setTimeout(() => {
      setBounceIds((prev) => {
        const next = new Set(prev);
        next.delete(cellId);
        return next;
      });
    }, 360);
    window.setTimeout(() => {
      setGlowIds((prev) => {
        const next = new Set(prev);
        next.delete(cellId);
        return next;
      });
    }, 520);
  }, []);

  const trySelect = useCallback(
    (cellId: string) => {
      const currentCells = cellsRef.current;
      const cell = currentCells.find((c) => c.id === cellId);
      if (!cell || cell.status === 'occupied' || cell.status === 'selected') return;

      const limit = maxSelectRef.current;
      const selectedCount = currentCells.filter((c) => c.status === 'selected').length;
      if (limit != null && selectedCount >= limit) {
        if (!maxedNotifiedRef.current) {
          maxedNotifiedRef.current = true;
          onSelectMaxed();
        }
        return;
      }

      const added = onCellSelect(cellId);
      if (added) triggerBounce(cellId);
    },
    [onCellSelect, onSelectMaxed, triggerBounce]
  );

  const endDrag = useCallback((e?: PointerEvent) => {
    if (e && activePointerIdRef.current != null && e.pointerId !== activePointerIdRef.current) {
      return;
    }
    draggingRef.current = false;
    activePointerIdRef.current = null;
    maxedNotifiedRef.current = false;
    try {
      boardRef.current?.releasePointerCapture(e?.pointerId ?? 0);
    } catch {
      /* already released */
    }
  }, []);

  const handleBoardPointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.button > 0) return;
      const id = cellIdFromPoint(e.clientX, e.clientY);
      if (!id) return;

      const cell = cellsRef.current.find((c) => c.id === id);
      if (!cell || cell.status === 'occupied') return;

      if (!canSelect) {
        if (awaitingRoll) onTapBeforeRoll?.();
        return;
      }

      e.preventDefault();
      boardRef.current?.setPointerCapture(e.pointerId);
      draggingRef.current = true;
      activePointerIdRef.current = e.pointerId;
      maxedNotifiedRef.current = false;
      trySelect(id);
    },
    [canSelect, awaitingRoll, onTapBeforeRoll, trySelect]
  );

  const handleBoardPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current || !canSelect) return;
      if (activePointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      const id = cellIdFromPoint(e.clientX, e.clientY);
      if (id) trySelect(id);
    },
    [canSelect, trySelect]
  );

  useEffect(() => {
    const stop = () => {
      draggingRef.current = false;
      activePointerIdRef.current = null;
      maxedNotifiedRef.current = false;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  return (
    <div className="lq-heart-board-shell">
      <div
        ref={boardRef}
        className="lq-heart-board mx-auto w-full touch-none select-none"
        style={{ '--board-cols': BOARD_SIZE } as CSSProperties}
        role="grid"
        aria-label="愛心棋盤"
        onPointerDown={handleBoardPointerDown}
        onPointerMove={handleBoardPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(e) => {
          if (draggingRef.current && activePointerIdRef.current === e.pointerId) {
            handleBoardPointerMove(e);
          }
        }}
      >
        {cells.map((cell) => {
          const occupied = cell.status === 'occupied';
          const selected = cell.status === 'selected';
          const available = canSelect && !occupied && !selected;
          const bouncing = bounceIds.has(cell.id);
          const glowing = glowIds.has(cell.id);

          return (
            <div
              key={cell.id}
              data-cell-id={cell.id}
              role="gridcell"
              aria-label={
                occupied ? '已佔用' : selected ? '已選取' : canSelect ? '可選愛心' : '愛心'
              }
              className={`lq-heart-cell ${occupied ? 'lq-heart-cell--occupied' : ''} ${
                selected ? 'lq-heart-cell--selected' : ''
              } ${available ? 'lq-heart-cell--available' : ''} ${
                bouncing ? 'lq-heart-cell--bounce' : ''
              } ${glowing ? 'lq-heart-cell--glow' : ''}`}
            >
              <span className="lq-heart-cell__touch" aria-hidden />
              {occupied ? <span className="lq-heart-cell__lock" aria-hidden /> : null}
              <span className="lq-heart-cell__icon" aria-hidden>
                {occupied ? '♥' : selected ? '♥' : '♡'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { BOARD_SIZE, type HeartCell } from './heartCircleTypes';

export function createBoard(size = BOARD_SIZE): HeartCell[] {
  const cells: HeartCell[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      cells.push({
        id: `${row}-${col}`,
        row,
        col,
        status: 'available',
      });
    }
  }
  return cells;
}

export function rollDice(): number {
  return 1 + Math.floor(Math.random() * 6);
}

const DIRECTIONS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
] as const;

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function buildAvailableSet(cells: HeartCell[]): Set<string> {
  const set = new Set<string>();
  for (const c of cells) {
    if (c.status !== 'occupied') set.add(cellKey(c.row, c.col));
  }
  return set;
}

/** 是否存在至少 `count` 顆上下左右相連的未佔用愛心 */
export function hasAvailableMove(cells: HeartCell[], count: number): boolean {
  if (count <= 0) return false;
  const available = buildAvailableSet(cells);
  if (available.size < count) return false;

  const visited = new Set<string>();
  for (const key of available) {
    if (visited.has(key)) continue;
    const [row, col] = key.split('-').map(Number);
    const component = new Set<string>();
    const queue: Array<[number, number]> = [[row, col]];
    component.add(key);

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      for (const [dr, dc] of DIRECTIONS) {
        const nk = cellKey(r + dr, c + dc);
        if (available.has(nk) && !component.has(nk)) {
          component.add(nk);
          queue.push([r + dr, c + dc]);
        }
      }
    }

    for (const k of component) visited.add(k);
    if (component.size >= count) return true;
  }
  return false;
}

export function areCellsConnected(selected: HeartCell[]): boolean {
  if (selected.length <= 1) return true;
  const set = new Set(selected.map((c) => cellKey(c.row, c.col)));
  const start = selected[0]!;
  const visited = new Set<string>([cellKey(start.row, start.col)]);
  const queue: Array<[number, number]> = [[start.row, start.col]];

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    for (const [dr, dc] of DIRECTIONS) {
      const nk = cellKey(row + dr, col + dc);
      if (set.has(nk) && !visited.has(nk)) {
        visited.add(nk);
        queue.push([row + dr, col + dc]);
      }
    }
  }

  return visited.size === selected.length;
}

export function isAdjacentToSelection(cell: HeartCell, selected: HeartCell[]): boolean {
  if (selected.length === 0) return true;
  return selected.some(
    (s) => Math.abs(s.row - cell.row) + Math.abs(s.col - cell.col) === 1
  );
}

export function addCellSelection(
  cells: HeartCell[],
  cellId: string,
  maxSelect: number
): HeartCell[] {
  const target = cells.find((c) => c.id === cellId);
  if (!target || target.status === 'occupied' || target.status === 'selected') return cells;

  const selected = cells.filter((c) => c.status === 'selected');
  if (selected.length >= maxSelect) return cells;
  if (!isAdjacentToSelection(target, selected)) return cells;

  return cells.map((c) => (c.id === cellId ? { ...c, status: 'selected' as const } : c));
}

export function toggleCellSelection(
  cells: HeartCell[],
  cellId: string,
  maxSelect: number
): HeartCell[] {
  const target = cells.find((c) => c.id === cellId);
  if (!target || target.status === 'occupied') return cells;

  const selected = cells.filter((c) => c.status === 'selected');
  const isSelected = target.status === 'selected';

  if (isSelected) {
    return cells.map((c) => (c.id === cellId ? { ...c, status: 'available' as const } : c));
  }

  if (selected.length >= maxSelect) return cells;
  if (!isAdjacentToSelection(target, selected)) return cells;

  return cells.map((c) => (c.id === cellId ? { ...c, status: 'selected' as const } : c));
}

export function clearSelection(cells: HeartCell[]): HeartCell[] {
  return cells.map((c) =>
    c.status === 'selected' ? { ...c, status: 'available' as const } : c
  );
}

export function confirmSelection(cells: HeartCell[]): HeartCell[] {
  return cells.map((c) =>
    c.status === 'selected' ? { ...c, status: 'occupied' as const } : c
  );
}

export const BOARD_SIZE = 8;

export type CellStatus = 'available' | 'occupied' | 'selected';

export type HeartCell = {
  id: string;
  row: number;
  col: number;
  status: CellStatus;
};

export type GamePhase = 'awaitRoll' | 'rolling' | 'selecting' | 'ended';

export type HeartCircleGameResult = {
  winnerIndex: 0 | 1;
  loserIndex: 0 | 1;
  totalRounds: number;
  dailyGamesToday: number;
  dailyGamesCap: number;
  quote: string;
};

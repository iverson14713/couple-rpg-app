import { useCallback, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import {
  areCellsConnected,
  clearSelection,
  confirmSelection,
  createBoard,
  hasAvailableMove,
  rollDice,
  toggleCellSelection,
} from './heartCircleLogic';
import type { GamePhase, HeartCircleGameResult } from './heartCircleTypes';

const ROLL_MS = 500;

export function useHeartCircleGame(playerNames: [string, string]) {
  const { showToast } = useToast();
  const [cells, setCells] = useState(createBoard);
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [round, setRound] = useState(1);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('awaitRoll');
  const [rollingDisplay, setRollingDisplay] = useState<number | null>(null);
  const [result, setResult] = useState<HeartCircleGameResult | null>(null);
  const rollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rollEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCells = useMemo(
    () => cells.filter((c) => c.status === 'selected'),
    [cells]
  );

  const currentPlayerName = playerNames[currentPlayer];

  const clearRollTimers = useCallback(() => {
    if (rollTimerRef.current) {
      clearInterval(rollTimerRef.current);
      rollTimerRef.current = null;
    }
    if (rollEndRef.current) {
      clearTimeout(rollEndRef.current);
      rollEndRef.current = null;
    }
  }, []);

  const endGame = useCallback((loser: 0 | 1) => {
    clearRollTimers();
    setResult({
      winnerIndex: loser === 0 ? 1 : 0,
      loserIndex: loser,
    });
    setPhase('ended');
    setDiceValue(null);
    setRollingDisplay(null);
  }, [clearRollTimers]);

  const resetGame = useCallback(() => {
    clearRollTimers();
    setCells(createBoard());
    setCurrentPlayer(0);
    setRound(1);
    setDiceValue(null);
    setRollingDisplay(null);
    setPhase('awaitRoll');
    setResult(null);
  }, [clearRollTimers]);

  const onRollDice = useCallback(() => {
    if (phase !== 'awaitRoll') return;

    clearRollTimers();
    setPhase('rolling');
    setRollingDisplay(1);

    rollTimerRef.current = setInterval(() => {
      setRollingDisplay(1 + Math.floor(Math.random() * 6));
    }, 60);

    rollEndRef.current = setTimeout(() => {
      clearRollTimers();
      const value = rollDice();
      setDiceValue(value);
      setRollingDisplay(value);

      if (!hasAvailableMove(cells, value)) {
        endGame(currentPlayer);
        return;
      }

      setCells((prev) => clearSelection(prev));
      setPhase('selecting');
    }, ROLL_MS);
  }, [phase, clearRollTimers, cells, currentPlayer, endGame]);

  const onCellTap = useCallback(
    (cellId: string) => {
      if (phase !== 'selecting' || diceValue == null) return;
      setCells((prev) => {
        const target = prev.find((c) => c.id === cellId);
        if (!target || target.status === 'occupied') return prev;

        const selected = prev.filter((c) => c.status === 'selected');
        if (target.status !== 'selected' && selected.length >= diceValue) {
          showToast(`只能選 ${diceValue} 顆愛心喔`, 'info', { position: 'top' });
          return prev;
        }

        return toggleCellSelection(prev, cellId, diceValue);
      });
    },
    [phase, diceValue, showToast]
  );

  const onClearSelection = useCallback(() => {
    if (phase !== 'selecting') return;
    setCells((prev) => clearSelection(prev));
  }, [phase]);

  const onConfirmSelection = useCallback(() => {
    if (phase !== 'selecting' || diceValue == null) return;

    if (selectedCells.length !== diceValue) {
      showToast(`只能選 ${diceValue} 顆愛心喔`, 'info', { position: 'top' });
      return;
    }

    if (!areCellsConnected(selectedCells)) {
      showToast('要選相連的愛心喔', 'info', { position: 'top' });
      return;
    }

    const nextCells = confirmSelection(cells);
    setCells(nextCells);

    const nextPlayer: 0 | 1 = currentPlayer === 0 ? 1 : 0;
    setCurrentPlayer(nextPlayer);
    setRound((r) => r + 1);
    setDiceValue(null);
    setRollingDisplay(null);
    setPhase('awaitRoll');
  }, [phase, diceValue, selectedCells, cells, currentPlayer, showToast]);

  const canRoll = phase === 'awaitRoll';
  const canSelect = phase === 'selecting' && diceValue != null;
  const canConfirm =
    phase === 'selecting' &&
    diceValue != null &&
    selectedCells.length === diceValue &&
    areCellsConnected(selectedCells);

  const displayDice = phase === 'rolling' ? rollingDisplay : diceValue;

  return {
    cells,
    currentPlayer,
    currentPlayerName,
    playerNames,
    round,
    diceValue: displayDice,
    phase,
    result,
    selectedCount: selectedCells.length,
    canRoll,
    canSelect,
    canConfirm,
    onRollDice,
    onCellTap,
    onClearSelection,
    onConfirmSelection,
    resetGame,
  };
}

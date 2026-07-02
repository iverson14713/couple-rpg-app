import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { recordHeartCircleGamePlayed } from './heartCircleDailyStats';
import {
  addCellSelection,
  areCellsConnected,
  clearSelection,
  confirmSelection,
  createBoard,
  hasAvailableMove,
  rollDice,
} from './heartCircleLogic';
import { pickHeartCircleQuote } from './heartCircleQuotes';
import type { GamePhase, HeartCircleGameResult } from './heartCircleTypes';

const ROLL_MS = 500;
const TURN_NOTICE_MS = 800;

export function useHeartCircleGame(playerNames: [string, string]) {
  const { showToast } = useToast();
  const [cells, setCells] = useState(createBoard);
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [round, setRound] = useState(1);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('awaitRoll');
  const [rollingDisplay, setRollingDisplay] = useState<number | null>(null);
  const [result, setResult] = useState<HeartCircleGameResult | null>(null);
  const [turnNotice, setTurnNotice] = useState<string | null>(null);
  const rollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rollEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cellsRef = useRef(cells);
  const phaseRef = useRef(phase);
  const diceValueRef = useRef(diceValue);

  cellsRef.current = cells;
  phaseRef.current = phase;
  diceValueRef.current = diceValue;

  const selectedCells = useMemo(
    () => cells.filter((c) => c.status === 'selected'),
    [cells]
  );

  const currentPlayerName = playerNames[currentPlayer];
  const waitingPlayerName = playerNames[currentPlayer === 0 ? 1 : 0];

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

  const clearTurnNoticeTimer = useCallback(() => {
    if (turnNoticeTimerRef.current) {
      clearTimeout(turnNoticeTimerRef.current);
      turnNoticeTimerRef.current = null;
    }
  }, []);

  const showTurnNotice = useCallback(
    (name: string) => {
      clearTurnNoticeTimer();
      setTurnNotice(`輪到 ${name} 囉`);
      turnNoticeTimerRef.current = setTimeout(() => {
        setTurnNotice(null);
        turnNoticeTimerRef.current = null;
      }, TURN_NOTICE_MS);
    },
    [clearTurnNoticeTimer]
  );

  useEffect(
    () => () => {
      clearRollTimers();
      clearTurnNoticeTimer();
    },
    [clearRollTimers, clearTurnNoticeTimer]
  );

  const endGame = useCallback(
    (loser: 0 | 1, roundsPlayed: number) => {
      clearRollTimers();
      clearTurnNoticeTimer();
      setTurnNotice(null);
      const daily = recordHeartCircleGamePlayed();
      setResult({
        winnerIndex: loser === 0 ? 1 : 0,
        loserIndex: loser,
        totalRounds: roundsPlayed,
        dailyGamesToday: daily.today,
        dailyGamesCap: daily.cap,
        quote: pickHeartCircleQuote(),
      });
      setPhase('ended');
      setDiceValue(null);
      setRollingDisplay(null);
    },
    [clearRollTimers, clearTurnNoticeTimer]
  );

  const resetGame = useCallback(() => {
    clearRollTimers();
    clearTurnNoticeTimer();
    setCells(createBoard());
    setCurrentPlayer(0);
    setRound(1);
    setDiceValue(null);
    setRollingDisplay(null);
    setPhase('awaitRoll');
    setResult(null);
    setTurnNotice(null);
  }, [clearRollTimers, clearTurnNoticeTimer]);

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
        endGame(currentPlayer, round);
        return;
      }

      setCells((prev) => clearSelection(prev));
      setPhase('selecting');
    }, ROLL_MS);
  }, [phase, clearRollTimers, cells, currentPlayer, round, endGame]);

  const onCellSelect = useCallback((cellId: string): boolean => {
    if (phaseRef.current !== 'selecting' || diceValueRef.current == null) return false;

    const dice = diceValueRef.current;
    const prev = cellsRef.current;
    const target = prev.find((c) => c.id === cellId);
    if (!target || target.status === 'occupied' || target.status === 'selected') {
      return false;
    }

    const selected = prev.filter((c) => c.status === 'selected');
    if (selected.length >= dice) return false;

    const next = addCellSelection(prev, cellId, dice);
    if (next === prev) return false;

    cellsRef.current = next;
    setCells(next);
    return true;
  }, []);

  const onCellSelectMaxed = useCallback(() => {
    if (phase !== 'selecting' || diceValue == null) return;
    showToast(`只能選 ${diceValue} 顆愛心喔`, 'info', { position: 'top' });
  }, [phase, diceValue, showToast]);

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
    const nextRound = round + 1;
    setCurrentPlayer(nextPlayer);
    setRound(nextRound);
    setDiceValue(null);
    setRollingDisplay(null);
    setPhase('awaitRoll');
    showTurnNotice(playerNames[nextPlayer]);
  }, [
    phase,
    diceValue,
    selectedCells,
    cells,
    currentPlayer,
    round,
    playerNames,
    showToast,
    showTurnNotice,
  ]);

  const onBoardTapBeforeRoll = useCallback(() => {
    if (phaseRef.current !== 'awaitRoll') return;
    showToast('先點骰子擲骰喔', 'info', { position: 'top' });
  }, [showToast]);

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
    waitingPlayerName,
    playerNames,
    round,
    diceValue: displayDice,
    phase,
    result,
    turnNotice,
    selectedCount: selectedCells.length,
    canRoll,
    canSelect,
    canConfirm,
    onRollDice,
    onCellSelect,
    onCellSelectMaxed,
    onClearSelection,
    onConfirmSelection,
    onBoardTapBeforeRoll,
    resetGame,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getRoundRating,
  randomWaitMs,
  computeGameResult,
} from './syncHeartLogic';
import type {
  SyncHeartGamePhase,
  SyncHeartGameResult,
  SyncHeartRoundResult,
} from './syncHeartTypes';
import {
  SYNC_HEART_TOTAL_ROUNDS,
  SYNC_HEART_WAIT_MAX_MS,
  SYNC_HEART_WAIT_MIN_MS,
} from './syncHeartTypes';

type PressState = {
  playerA: number | null;
  playerB: number | null;
};

export function useSyncHeartGame() {
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<SyncHeartGamePhase>('waiting');
  const [roundResults, setRoundResults] = useState<SyncHeartRoundResult[]>([]);
  const [presses, setPresses] = useState<PressState>({ playerA: null, playerB: null });
  const [currentRoundResult, setCurrentRoundResult] = useState<SyncHeartRoundResult | null>(null);

  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goAtRef = useRef<number | null>(null);
  const phaseRef = useRef<SyncHeartGamePhase>('waiting');
  const roundRef = useRef(1);
  const pressesRef = useRef<PressState>({ playerA: null, playerB: null });

  const clearWaitTimer = useCallback(() => {
    if (waitTimerRef.current != null) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  const syncRefs = useCallback(
    (nextPhase: SyncHeartGamePhase, nextRound: number, nextPresses: PressState) => {
      phaseRef.current = nextPhase;
      roundRef.current = nextRound;
      pressesRef.current = nextPresses;
    },
    []
  );

  const startWaiting = useCallback(() => {
    clearWaitTimer();
    goAtRef.current = null;
    const emptyPresses = { playerA: null, playerB: null };
    setPresses(emptyPresses);
    setCurrentRoundResult(null);
    setPhase('waiting');
    syncRefs('waiting', roundRef.current, emptyPresses);

    const delay = randomWaitMs(SYNC_HEART_WAIT_MIN_MS, SYNC_HEART_WAIT_MAX_MS);
    waitTimerRef.current = setTimeout(() => {
      goAtRef.current = performance.now();
      setPhase('go');
      phaseRef.current = 'go';
      waitTimerRef.current = null;
    }, delay);
  }, [clearWaitTimer, syncRefs]);

  const finishRound = useCallback(
    (result: SyncHeartRoundResult) => {
      clearWaitTimer();
      goAtRef.current = null;
      setCurrentRoundResult(result);
      setRoundResults((prev) => [...prev, result]);
      setPhase('round_end');
      phaseRef.current = 'round_end';
    },
    [clearWaitTimer]
  );

  const onPlayerPress = useCallback(
    (playerIndex: 0 | 1) => {
      const currentPhase = phaseRef.current;

      if (currentPhase === 'round_end' || currentPhase === 'ended') return;

      if (currentPhase === 'waiting') {
        finishRound({
          round: roundRef.current,
          failed: true,
          failReason: 'early_press',
          earlyPlayerIndex: playerIndex,
          playerATimeSec: null,
          playerBTimeSec: null,
          diffSeconds: null,
          ratingLabel: null,
          ratingEmoji: null,
        });
        return;
      }

      if (currentPhase !== 'go' || goAtRef.current == null) return;

      const elapsedSec = (performance.now() - goAtRef.current) / 1000;
      const currentPresses = { ...pressesRef.current };

      if (playerIndex === 0) {
        if (currentPresses.playerA != null) return;
        currentPresses.playerA = elapsedSec;
      } else {
        if (currentPresses.playerB != null) return;
        currentPresses.playerB = elapsedSec;
      }

      pressesRef.current = currentPresses;
      setPresses(currentPresses);

      if (currentPresses.playerA == null || currentPresses.playerB == null) return;

      const diffSeconds = Math.abs(currentPresses.playerA - currentPresses.playerB);
      const rating = getRoundRating(diffSeconds);

      finishRound({
        round: roundRef.current,
        failed: false,
        playerATimeSec: currentPresses.playerA,
        playerBTimeSec: currentPresses.playerB,
        diffSeconds,
        ratingLabel: rating.label,
        ratingEmoji: rating.emoji,
      });
    },
    [finishRound]
  );

  const nextRound = useCallback(() => {
    if (phaseRef.current !== 'round_end') return;
    if (roundRef.current >= SYNC_HEART_TOTAL_ROUNDS) {
      setPhase('ended');
      phaseRef.current = 'ended';
      return;
    }
    const next = roundRef.current + 1;
    setRound(next);
    roundRef.current = next;
    startWaiting();
  }, [startWaiting]);

  const resetGame = useCallback(() => {
    clearWaitTimer();
    goAtRef.current = null;
    setRound(1);
    setRoundResults([]);
    setCurrentRoundResult(null);
    roundRef.current = 1;
    phaseRef.current = 'waiting';
    startWaiting();
  }, [clearWaitTimer, startWaiting]);

  useEffect(() => {
    startWaiting();
    return () => clearWaitTimer();
  }, [startWaiting, clearWaitTimer]);

  const result = useMemo<SyncHeartGameResult | null>(() => {
    if (phase !== 'ended') return null;
    return computeGameResult(roundResults);
  }, [phase, roundResults]);

  const padsEnabled = phase === 'waiting' || phase === 'go';
  const heartLit = phase === 'go';
  const isLastRound = round >= SYNC_HEART_TOTAL_ROUNDS;

  return {
    round,
    totalRounds: SYNC_HEART_TOTAL_ROUNDS,
    phase,
    roundResults,
    currentRoundResult,
    presses,
    padsEnabled,
    heartLit,
    isLastRound,
    result,
    onPlayerPress,
    nextRound,
    resetGame,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildHeartPuzzle } from './loveCrisisPuzzles';
import { buildGameResult } from './loveCrisisLogic';
import {
  REACTION_DOUBLE_HINT,
  REACTION_FAIL,
  REACTION_STEP_OK,
  REACTION_STEP_PROGRESS,
  REACTION_SUCCESS,
  REACTION_URGENT,
  reactionForNextStep,
} from './loveCrisisReactions';
import type {
  FeedbackKind,
  HeartLine,
  HeartPuzzle,
  HeartVisualState,
  LoveCrisisGameResult,
  LoveCrisisScreenPhase,
  XiaoiMood,
} from './loveCrisisTypes';
import { LOVE_CRISIS_DURATION_MS } from './loveCrisisTypes';

const TRANSITION_MS = 750;
const SUCCESS_TRANSITION_MS = 950;
const HOLD_MS = 600;
const DOUBLE_TAP_WINDOW_MS = 500;
const HAPPY_BOUNCE_MS = 700;

function createPuzzle(heartNumber: number, seed: number): HeartPuzzle {
  const built = buildHeartPuzzle(heartNumber, seed);
  return {
    id: `heart-${heartNumber}-${seed}`,
    story: built.story,
    sequence: built.sequence,
    lines: built.lines.map((line, i) => ({
      id: `line-${heartNumber}-${i}`,
      emotion: line.emotion,
      angle: line.angle,
      orderIndex: i,
      interaction: line.interaction,
      cut: false,
    })),
  };
}

function waitingReaction(puzzle: HeartPuzzle, cutIndex: number): string {
  const line = puzzle.lines.find((l) => l.orderIndex === cutIndex);
  if (!line) return '一起把愛心修回來吧…';
  return reactionForNextStep(line.emotion, line.interaction);
}

export function useLoveCrisisGame() {
  const [screen, setScreen] = useState<LoveCrisisScreenPhase>('intro');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(LOVE_CRISIS_DURATION_MS);
  const [puzzle, setPuzzle] = useState<HeartPuzzle | null>(null);
  const [cutIndex, setCutIndex] = useState(0);
  const [heartState, setHeartState] = useState<HeartVisualState>('active');
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>(null);
  const [urgent, setUrgent] = useState(false);
  const [xiaoiMood, setXiaoiMood] = useState<XiaoiMood>('nervous');
  const [xiaoiJump, setXiaoiJump] = useState(false);
  const [reactionText, setReactionText] = useState('一起把裂痕接住吧…');
  const [holdLineId, setHoldLineId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [doubleHintLineId, setDoubleHintLineId] = useState<string | null>(null);
  const [doubleTapStep, setDoubleTapStep] = useState<0 | 1>(0);

  const seedRef = useRef(Math.floor(Math.random() * 1000));
  const heartNumberRef = useRef(1);
  const screenRef = useRef<LoveCrisisScreenPhase>('intro');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartedAtRef = useRef(0);
  const doubleTapRef = useRef<{ lineId: string; at: number } | null>(null);
  const happyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartStateRef = useRef<HeartVisualState>('active');

  const clearHold = useCallback(() => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
    setHoldLineId(null);
    setHoldProgress(0);
    holdStartedAtRef.current = 0;
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    if (happyTimerRef.current) {
      clearTimeout(happyTimerRef.current);
      happyTimerRef.current = null;
    }
    clearHold();
  }, [clearHold]);

  const pulseHappy = useCallback(() => {
    setXiaoiMood('happy');
    setXiaoiJump(true);
    if (happyTimerRef.current) clearTimeout(happyTimerRef.current);
    happyTimerRef.current = setTimeout(() => {
      setXiaoiJump(false);
      if (screenRef.current === 'playing' && heartStateRef.current === 'active') {
        setXiaoiMood('nervous');
      }
    }, HAPPY_BOUNCE_MS);
  }, []);

  const loadNextHeart = useCallback(() => {
    const next = createPuzzle(heartNumberRef.current, seedRef.current);
    setPuzzle(next);
    setCutIndex(0);
    setHeartState('active');
    heartStateRef.current = 'active';
    setFlashMessage(null);
    setFeedbackKind(null);
    setXiaoiMood('nervous');
    setReactionText(waitingReaction(next, 0));
    setDoubleHintLineId(null);
    setDoubleTapStep(0);
    doubleTapRef.current = null;
    clearHold();
  }, [clearHold]);

  const startPlaying = useCallback(() => {
    clearTimers();
    heartNumberRef.current = 1;
    setSuccessCount(0);
    setFailCount(0);
    setMaxStreak(0);
    setCurrentStreak(0);
    setTimeLeftMs(LOVE_CRISIS_DURATION_MS);
    setUrgent(false);
    setScreen('playing');
    screenRef.current = 'playing';
    loadNextHeart();

    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, LOVE_CRISIS_DURATION_MS - elapsed);
      setTimeLeftMs(left);
      setUrgent(left > 0 && left <= 5000);
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setScreen('ended');
        screenRef.current = 'ended';
      }
    }, 100);
  }, [clearTimers, loadNextHeart]);

  const startCountdown = useCallback(() => {
    setScreen('countdown');
    screenRef.current = 'countdown';
    setCountdown(3);
    const tick = (n: number) => {
      setCountdown(n);
      if (n <= 0) {
        setCountdown(null);
        startPlaying();
        return;
      }
      countdownRef.current = setTimeout(() => tick(n - 1), 850);
    };
    countdownRef.current = setTimeout(() => tick(2), 850);
  }, [startPlaying]);

  const goToTutorial = useCallback(() => {
    setScreen('tutorial');
    screenRef.current = 'tutorial';
  }, []);

  const skipTutorialAndStart = useCallback(() => {
    startCountdown();
  }, [startCountdown]);

  const scheduleNextHeart = useCallback(
    (message: string, kind: FeedbackKind, nextHeartState: HeartVisualState, delay = TRANSITION_MS) => {
      setHeartState(nextHeartState);
      heartStateRef.current = nextHeartState;
      setFlashMessage(message);
      setFeedbackKind(kind);
      if (kind === 'success') {
        setXiaoiMood('holding');
        setReactionText(REACTION_SUCCESS);
      } else if (kind === 'fail') {
        setXiaoiMood('sad');
        setReactionText(REACTION_FAIL);
      }
      transitionRef.current = setTimeout(() => {
        if (screenRef.current !== 'playing') return;
        heartNumberRef.current += 1;
        loadNextHeart();
      }, delay);
    },
    [loadNextHeart]
  );

  const failHeart = useCallback(() => {
    setFailCount((c) => c + 1);
    setCurrentStreak(0);
    clearHold();
    setDoubleHintLineId(null);
    setDoubleTapStep(0);
    doubleTapRef.current = null;
    scheduleNextHeart(REACTION_FAIL, 'fail', 'breaking');
  }, [clearHold, scheduleNextHeart]);

  const completeStep = useCallback(
    (lineId: string) => {
      if (!puzzle) return;

      const nextLines: HeartLine[] = puzzle.lines.map((l) =>
        l.id === lineId ? { ...l, cut: true } : l
      );
      const nextIndex = cutIndex + 1;
      setPuzzle({ ...puzzle, lines: nextLines });
      setCutIndex(nextIndex);
      setFlashMessage(REACTION_STEP_PROGRESS);
      setFeedbackKind('step');
      setReactionText(REACTION_STEP_OK);
      pulseHappy();
      clearHold();
      setDoubleHintLineId(null);
      setDoubleTapStep(0);
      doubleTapRef.current = null;

      if (nextIndex >= puzzle.sequence.length) {
        setSuccessCount((c) => c + 1);
        setCurrentStreak((s) => {
          const next = s + 1;
          setMaxStreak((m) => Math.max(m, next));
          return next;
        });
        setXiaoiMood('celebrate');
        scheduleNextHeart('修好了！', 'success', 'repaired', SUCCESS_TRANSITION_MS);
        return;
      }

      const nextLine = nextLines.find((l) => l.orderIndex === nextIndex);
      if (nextLine) {
        setTimeout(() => {
          if (screenRef.current === 'playing' && heartStateRef.current === 'active') {
            setReactionText(reactionForNextStep(nextLine.emotion, nextLine.interaction));
            setFlashMessage(null);
            setFeedbackKind(null);
          }
        }, 420);
      }
    },
    [clearHold, cutIndex, puzzle, pulseHappy, scheduleNextHeart]
  );

  const tryInteract = useCallback(
    (lineId: string): { line: HeartLine } | null => {
      if (screenRef.current !== 'playing' || heartStateRef.current !== 'active' || !puzzle) {
        return null;
      }
      const line = puzzle.lines.find((l) => l.id === lineId);
      if (!line || line.cut) return null;
      if (line.orderIndex !== cutIndex) {
        failHeart();
        return null;
      }
      return { line };
    },
    [cutIndex, failHeart, puzzle]
  );

  const onLineTap = useCallback(
    (lineId: string) => {
      const ctx = tryInteract(lineId);
      if (!ctx) return;
      const { line } = ctx;

      if (line.interaction === 'tap') {
        completeStep(lineId);
        return;
      }

      if (line.interaction === 'double') {
        const now = Date.now();
        const prev = doubleTapRef.current;
        if (prev && prev.lineId === lineId && now - prev.at <= DOUBLE_TAP_WINDOW_MS) {
          completeStep(lineId);
          return;
        }
        doubleTapRef.current = { lineId, at: now };
        setDoubleHintLineId(lineId);
        setDoubleTapStep(1);
        setReactionText(REACTION_DOUBLE_HINT);
      }
    },
    [completeStep, tryInteract]
  );

  const onLineHoldStart = useCallback(
    (lineId: string) => {
      const ctx = tryInteract(lineId);
      if (!ctx) return;
      const { line } = ctx;
      if (line.interaction !== 'hold') return;

      clearHold();
      setHoldLineId(lineId);
      holdStartedAtRef.current = Date.now();
      holdRef.current = setInterval(() => {
        const elapsed = Date.now() - holdStartedAtRef.current;
        const progress = Math.min(1, elapsed / HOLD_MS);
        setHoldProgress(progress);
        if (progress >= 1) {
          clearHold();
          completeStep(lineId);
        }
      }, 40);
    },
    [clearHold, completeStep, tryInteract]
  );

  const onLineHoldEnd = useCallback(
    (lineId: string) => {
      if (holdLineId !== lineId) return;
      clearHold();
    },
    [clearHold, holdLineId]
  );

  const resetGame = useCallback(() => {
    clearTimers();
    seedRef.current = Math.floor(Math.random() * 1000);
    heartNumberRef.current = 1;
    setScreen('intro');
    screenRef.current = 'intro';
    setCountdown(null);
    setPuzzle(null);
    setCutIndex(0);
    setHeartState('active');
    heartStateRef.current = 'active';
    setSuccessCount(0);
    setFailCount(0);
    setMaxStreak(0);
    setCurrentStreak(0);
    setFlashMessage(null);
    setFeedbackKind(null);
    setUrgent(false);
    setXiaoiMood('nervous');
    setXiaoiJump(false);
    setReactionText('一起把裂痕接住吧…');
    setHoldLineId(null);
    setHoldProgress(0);
    setDoubleHintLineId(null);
    setDoubleTapStep(0);
    setTimeLeftMs(LOVE_CRISIS_DURATION_MS);
  }, [clearTimers]);

  useEffect(() => {
    if (!urgent || screen !== 'playing' || heartState !== 'active') return;
    setXiaoiMood('panic');
    setReactionText(REACTION_URGENT);
  }, [heartState, screen, urgent, puzzle?.id]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const result = useMemo<LoveCrisisGameResult | null>(() => {
    if (screen !== 'ended') return null;
    return buildGameResult(successCount, failCount, maxStreak);
  }, [screen, successCount, failCount, maxStreak]);

  const repairProgress =
    puzzle && puzzle.sequence.length > 0 ? cutIndex / puzzle.sequence.length : 0;

  const timerProgress = timeLeftMs / LOVE_CRISIS_DURATION_MS;

  return {
    screen,
    countdown,
    timeLeftMs,
    timerProgress,
    puzzle,
    cutIndex,
    heartState,
    successCount,
    failCount,
    maxStreak,
    currentStreak,
    flashMessage,
    feedbackKind,
    urgent,
    repairProgress,
    xiaoiMood,
    xiaoiJump,
    reactionText,
    holdLineId,
    holdProgress,
    doubleHintLineId,
    doubleTapStep,
    result,
    goToTutorial,
    skipTutorialAndStart,
    startCountdown,
    onLineTap,
    onLineHoldStart,
    onLineHoldEnd,
    resetGame,
  };
}

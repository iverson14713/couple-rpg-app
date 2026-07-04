import { ChevronLeft } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import {
  GameHud,
  GameInstructionCard,
  GameMascotBubble,
  GamePageShell,
  GameStoryText,
  type GameInstructionChip,
  type GameMascotState,
} from '../shared';
import { buildHintSequenceText, chipLabel, EMOTION_META } from '../loveCrisis/loveCrisisEmotions';
import type {
  FeedbackKind,
  HeartPuzzle,
  HeartVisualState,
  XiaoiMood,
} from '../loveCrisis/loveCrisisTypes';
import { LoveCrisisPlayStage } from './LoveCrisisPlayStage';

type Props = {
  onBack: () => void;
  puzzle: HeartPuzzle;
  cutIndex: number;
  heartState: HeartVisualState;
  repairProgress: number;
  timeLeftMs: number;
  timerProgress: number;
  successCount: number;
  currentStreak: number;
  urgent: boolean;
  flashMessage: string | null;
  feedbackKind: FeedbackKind;
  xiaoiMood: XiaoiMood;
  xiaoiJump: boolean;
  reactionText: string;
  holdLineId: string | null;
  holdProgress: number;
  doubleHintLineId: string | null;
  doubleTapStep: 0 | 1;
  onLineTap: (lineId: string) => void;
  onLineHoldStart: (lineId: string) => void;
  onLineHoldEnd: (lineId: string) => void;
};

function formatTime(ms: number): string {
  const sec = Math.ceil(ms / 1000);
  return `0:${sec.toString().padStart(2, '0')}`;
}

function chipTone(
  index: number,
  cutIndex: number,
  interaction: HeartPuzzle['lines'][0]['interaction']
): GameInstructionChip['tone'] {
  const done = index < cutIndex;
  const active = index === cutIndex;
  if (done) return 'done';
  if (active) {
    if (interaction === 'hold') return 'hold';
    if (interaction === 'double') return 'double';
    return 'active';
  }
  if (interaction === 'hold') return 'hold';
  if (interaction === 'double') return 'double';
  return 'default';
}

function toMascotState(mood: XiaoiMood): GameMascotState {
  const map: Record<XiaoiMood, GameMascotState> = {
    nervous: 'nervous',
    happy: 'happy',
    sad: 'sad',
    panic: 'sleepy',
    celebrate: 'celebrate',
    holding: 'happy',
  };
  return map[mood];
}

function blockSelect(e: SyntheticEvent) {
  e.preventDefault();
}

export function LoveCrisisPlayView({
  onBack,
  puzzle,
  cutIndex,
  heartState,
  repairProgress,
  timeLeftMs,
  timerProgress,
  successCount,
  currentStreak,
  urgent,
  flashMessage,
  feedbackKind,
  xiaoiMood,
  xiaoiJump,
  reactionText,
  holdLineId,
  holdProgress,
  doubleHintLineId,
  doubleTapStep,
  onLineTap,
  onLineHoldStart,
  onLineHoldEnd,
}: Props) {
  const hintLines = puzzle.lines
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((line) => ({ emotion: line.emotion, interaction: line.interaction }));
  const hintText = buildHintSequenceText(hintLines);

  const chips: GameInstructionChip[] = hintLines.map((line, i) => ({
    id: `${puzzle.id}-${i}`,
    label: chipLabel(EMOTION_META[line.emotion].task, line.interaction),
    tone: chipTone(i, cutIndex, line.interaction),
  }));

  const scoreLabel =
    currentStreak >= 2 ? `修復 ${successCount} · 連續 ${currentStreak}` : `修復 ${successCount}`;

  return (
    <div className="lq-love-crisis-play-page">
      <GamePageShell immersive className="lq-crisis-play-shell">
        <div
          className={`lq-crisis-play lq-crisis-play--interactive ${
            urgent ? 'lq-crisis-play--urgent' : ''
          }`}
          onContextMenu={blockSelect}
        >
          <div className="lq-crisis-play__bg" aria-hidden>
            <span className="lq-crisis-play__glow lq-crisis-play__glow--1" />
            <span className="lq-crisis-play__glow lq-crisis-play__glow--2" />
            <span className="lq-crisis-play__float">💗</span>
            <span className="lq-crisis-play__float">✨</span>
            <span className="lq-crisis-play__float">💕</span>
            <span className="lq-crisis-play__float">⭐</span>
          </div>

          <div className="lq-crisis-play-top">
            <button
              type="button"
              onClick={onBack}
              className="lq-crisis-play-back flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              回遊戲列表
            </button>

            <GameHud
              className="lq-crisis-play-hud"
              timerLabel={formatTime(timeLeftMs)}
              scoreLabel={scoreLabel}
              progressPercent={timerProgress}
              urgent={urgent}
              barPosition="below"
            />
          </div>

          <GameInstructionCard
            className="lq-crisis-play-instruction"
            hint={`照順序修復：${hintText}`}
            chips={chips}
            lines={2}
          />

          <GameStoryText className="lq-crisis-play-story">{puzzle.story}</GameStoryText>

          <div className="lq-crisis-play-stage-column">
            <LoveCrisisPlayStage
              puzzle={puzzle}
              cutIndex={cutIndex}
              heartState={heartState}
              repairProgress={repairProgress}
              flashMessage={flashMessage}
              feedbackKind={feedbackKind}
              holdLineId={holdLineId}
              holdProgress={holdProgress}
              doubleHintLineId={doubleHintLineId}
              doubleTapStep={doubleTapStep}
              canPlay={heartState === 'active'}
              onLineTap={onLineTap}
              onLineHoldStart={onLineHoldStart}
              onLineHoldEnd={onLineHoldEnd}
            />

            <div className="lq-crisis-play-mascot-row">
              <GameMascotBubble
                state={toMascotState(xiaoiMood)}
                message={reactionText}
                placement="bottom-left"
                bubbleLayout="beside"
                jump={xiaoiJump}
              />
            </div>
          </div>
        </div>
      </GamePageShell>
    </div>
  );
}

import type { CSSProperties } from 'react';
import { GameStage, LOVE_CRISIS_STAGE_SIZE } from '../shared';
import type {
  FeedbackKind,
  HeartPuzzle,
  HeartVisualState,
} from '../loveCrisis/loveCrisisTypes';
import { LoveCrisisStageLine } from './LoveCrisisStageLine';

type Props = {
  puzzle: HeartPuzzle;
  cutIndex: number;
  heartState: HeartVisualState;
  repairProgress: number;
  flashMessage: string | null;
  feedbackKind: FeedbackKind;
  holdLineId: string | null;
  holdProgress: number;
  doubleHintLineId: string | null;
  doubleTapStep: 0 | 1;
  canPlay: boolean;
  onLineTap: (lineId: string) => void;
  onLineHoldStart: (lineId: string) => void;
  onLineHoldEnd: (lineId: string) => void;
};

export function LoveCrisisPlayStage({
  puzzle,
  cutIndex,
  heartState,
  repairProgress,
  flashMessage,
  feedbackKind,
  holdLineId,
  holdProgress,
  doubleHintLineId,
  doubleTapStep,
  canPlay,
  onLineTap,
  onLineHoldStart,
  onLineHoldEnd,
}: Props) {
  return (
    <div
      className={`lq-game-stage-area lq-crisis-stage-area ${
        feedbackKind === 'fail' ? 'lq-crisis-stage-area--shake' : ''
      }`}
    >
      <GameStage
        className="lq-crisis-game-stage-wrap"
        stageClassName="lq-crisis-game-stage"
        sizeConfig={LOVE_CRISIS_STAGE_SIZE}
      >
        {({ coord }) => (
          <>
            <div className="lq-crisis-stage-arena__sparkles" aria-hidden>
              <span>✨</span>
              <span>💗</span>
              <span>⭐</span>
              <span>✨</span>
            </div>

            {puzzle.lines.map((line) => (
              <LoveCrisisStageLine
                key={line.id}
                line={line}
                coord={coord}
                disabled={!canPlay}
                isNext={line.orderIndex === cutIndex && !line.cut}
                holdProgress={holdLineId === line.id ? holdProgress : 0}
                doubleTapStep={doubleHintLineId === line.id ? doubleTapStep : 0}
                showDoubleHint={doubleHintLineId === line.id}
                onTap={onLineTap}
                onHoldStart={onLineHoldStart}
                onHoldEnd={onLineHoldEnd}
              />
            ))}

            {feedbackKind === 'success' ? (
              <span
                className="lq-crisis-success-ring"
                style={{
                  left: coord.centerX,
                  top: coord.centerY,
                  width: coord.size * 0.58,
                  height: coord.size * 0.58,
                }}
                aria-hidden
              />
            ) : null}

            <div
              className={`lq-crisis-heart lq-crisis-heart--${heartState}`}
              style={
                {
                  left: coord.centerX,
                  top: coord.centerY,
                  '--repair': String(repairProgress),
                } as CSSProperties
              }
            >
              <span className="lq-crisis-heart__glow" aria-hidden />
              <span className="lq-crisis-heart__icon" aria-hidden>
                {heartState === 'repaired' ? '❤️' : '💔'}
              </span>
            </div>

            {flashMessage ? (
              <p
                className={`lq-crisis-flash lq-crisis-flash--${feedbackKind ?? 'step'}`}
                style={{ left: coord.centerX, top: coord.centerY + 78 }}
              >
                {flashMessage}
              </p>
            ) : null}
          </>
        )}
      </GameStage>
    </div>
  );
}

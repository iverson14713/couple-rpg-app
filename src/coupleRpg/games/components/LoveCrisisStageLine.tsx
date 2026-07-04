import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import {
  labelAnchorAlongAngle,
  lineEndpoint,
  type GameStageCoord,
} from '../shared';
import { EMOTION_META, INTERACTION_BADGE, INTERACTION_HINT } from '../loveCrisis/loveCrisisEmotions';
import type { HeartLine } from '../loveCrisis/loveCrisisTypes';

/** 愛情危機：線長為舞台邊長的比例 */
const LINE_LENGTH_RATIO = 0.4;
const DOT_RADIUS = 15;
const BEAM_HEIGHT = 12;

type Props = {
  line: HeartLine;
  coord: GameStageCoord;
  disabled: boolean;
  isNext: boolean;
  holdProgress: number;
  doubleTapStep: 0 | 1;
  showDoubleHint: boolean;
  onTap: (lineId: string) => void;
  onHoldStart: (lineId: string) => void;
  onHoldEnd: (lineId: string) => void;
};

function blockGesture(e: PointerEvent) {
  e.preventDefault();
}

const EMOTION_BEAM_CLASS: Record<HeartLine['emotion'], string> = {
  comfort: 'lq-crisis-line-beam--comfort',
  listen: 'lq-crisis-line-beam--listen',
  affirm: 'lq-crisis-line-beam--affirm',
  calm: 'lq-crisis-line-beam--calm',
  action: 'lq-crisis-line-beam--action',
};

const EMOTION_NODE_CLASS: Record<HeartLine['emotion'], string> = {
  comfort: 'lq-crisis-line-node--comfort',
  listen: 'lq-crisis-line-node--listen',
  affirm: 'lq-crisis-line-node--affirm',
  calm: 'lq-crisis-line-node--calm',
  action: 'lq-crisis-line-node--action',
};

export function LoveCrisisStageLine({
  line,
  coord,
  disabled,
  isNext,
  holdProgress,
  doubleTapStep,
  showDoubleHint,
  onTap,
  onHoldStart,
  onHoldEnd,
}: Props) {
  const { centerX, centerY } = coord;
  const angle = line.angle;
  const lineLength = coord.size * LINE_LENGTH_RATIO;
  const end = lineEndpoint(centerX, centerY, angle, lineLength);
  const label = labelAnchorAlongAngle(coord, angle, lineLength, { estWidth: 76 });

  const badge = INTERACTION_BADGE[line.interaction];
  const modeHint = INTERACTION_HINT[line.interaction];
  const isHolding = holdProgress > 0 && holdProgress < 1;
  const isSpecial = line.interaction !== 'tap';
  const showModeUi = isSpecial && !line.cut;
  const doubleBadgeText =
    line.interaction === 'double' && showDoubleHint && doubleTapStep === 1 ? '1/2' : badge;

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || line.cut) return;
    blockGesture(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (line.interaction === 'hold') onHoldStart(line.id);
  };

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (line.interaction === 'hold') onHoldEnd(line.id);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (disabled || line.cut || line.interaction === 'hold') return;
    onTap(line.id);
  };

  if (line.cut) return null;

  const beamClass = EMOTION_BEAM_CLASS[line.emotion];
  const nodeClass = EMOTION_NODE_CLASS[line.emotion];

  return (
    <div className={`lq-crisis-line-group ${isNext ? 'lq-crisis-line-group--next' : ''}`}>
      <div
        className={`lq-crisis-line-beam ${beamClass}`}
        style={
          {
            left: centerX,
            top: centerY,
            width: lineLength,
            transform: `translateY(-50%) rotate(${angle}deg)`,
            transformOrigin: '0 50%',
          } as CSSProperties
        }
        aria-hidden
      >
        <span className="lq-crisis-line-beam__core" />
        <span className="lq-crisis-line-beam__glow" />
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={line.interaction === 'hold' ? () => onHoldEnd(line.id) : undefined}
        onContextMenu={(e) => e.preventDefault()}
        className={`lq-crisis-line-node ${nodeClass} ${isNext ? 'lq-crisis-line-node--next' : ''} ${
          isHolding ? 'lq-crisis-line-node--holding' : ''
        }`}
        style={{
          left: end.x,
          top: end.y,
          width: DOT_RADIUS * 2,
          height: DOT_RADIUS * 2,
          transform: 'translate(-50%, -50%)',
        }}
        aria-label={`修復${EMOTION_META[line.emotion].task}`}
      >
        {line.interaction === 'hold' && isHolding ? (
          <span
            className="lq-crisis-line-node__hold-ring"
            style={{ '--hold-progress': String(holdProgress) } as CSSProperties}
            aria-hidden
          />
        ) : null}
      </button>

      {showModeUi && doubleBadgeText ? (
        <span
          className={`lq-crisis-line-badge lq-crisis-line-badge--${line.interaction} ${
            isNext ? 'lq-crisis-line-badge--active' : ''
          }`}
          style={{
            left: end.x,
            top: end.y - DOT_RADIUS - 20,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {doubleBadgeText}
        </span>
      ) : null}

      {showModeUi && modeHint && isNext ? (
        <span
          className="lq-crisis-line-hint"
          style={{
            left: end.x,
            top: end.y - DOT_RADIUS - 36,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {modeHint}
        </span>
      ) : null}

      <span
        className="lq-crisis-line-label"
        style={{ left: label.x, top: label.y, transform: 'translate(-50%, -50%)' }}
      >
        {EMOTION_META[line.emotion].task}
      </span>
    </div>
  );
}

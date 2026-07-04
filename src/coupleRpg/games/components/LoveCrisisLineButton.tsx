import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import { EMOTION_META, INTERACTION_BADGE, INTERACTION_HINT } from '../loveCrisis/loveCrisisEmotions';
import { getLineLabelLayout } from '../loveCrisis/loveCrisisLineLayout';
import type { HeartLine } from '../loveCrisis/loveCrisisTypes';

type Props = {
  line: HeartLine;
  disabled: boolean;
  isNext: boolean;
  holdProgress: number;
  doubleTapStep: 0 | 1;
  showDoubleHint: boolean;
  onTap: (lineId: string) => void;
  onHoldStart: (lineId: string) => void;
  onHoldEnd: (lineId: string) => void;
};

function blockNativeGesture(e: PointerEvent<HTMLButtonElement>) {
  e.preventDefault();
}

export function LoveCrisisLineButton({
  line,
  disabled,
  isNext,
  holdProgress,
  doubleTapStep,
  showDoubleHint,
  onTap,
  onHoldStart,
  onHoldEnd,
}: Props) {
  const badge = INTERACTION_BADGE[line.interaction];
  const modeHint = INTERACTION_HINT[line.interaction];
  const isHolding = holdProgress > 0 && holdProgress < 1;
  const isSpecial = line.interaction !== 'tap';
  const showModeUi = isSpecial && !line.cut;

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || line.cut) return;
    blockNativeGesture(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (line.interaction === 'hold') {
      onHoldStart(line.id);
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (line.interaction === 'hold') {
      onHoldEnd(line.id);
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (disabled || line.cut) return;
    if (line.interaction === 'hold') return;
    onTap(line.id);
  };

  const doubleBadgeText =
    line.interaction === 'double' && showDoubleHint && doubleTapStep === 1 ? '1/2' : badge;

  return (
    <button
      type="button"
      disabled={disabled || line.cut}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={line.interaction === 'hold' ? () => onHoldEnd(line.id) : undefined}
      onContextMenu={(e) => e.preventDefault()}
      className={`lq-love-crisis-line ${EMOTION_META[line.emotion].lineClass} ${
        line.cut ? 'lq-love-crisis-line--cut' : ''
      } ${isNext ? 'lq-love-crisis-line--next' : ''} ${
        line.interaction === 'hold' ? 'lq-love-crisis-line--hold' : ''
      } ${line.interaction === 'double' ? 'lq-love-crisis-line--double' : ''
      } ${showDoubleHint ? 'lq-love-crisis-line--double-hint' : ''} ${
        isHolding ? 'lq-love-crisis-line--holding' : ''
      }`}
      style={
        {
          '--line-angle': `${line.angle}deg`,
          ...getLineLabelLayout(line.angle),
        } as CSSProperties
      }
      aria-label={`修復${EMOTION_META[line.emotion].task}`}
    >
      <span className="lq-love-crisis-line__hitarea" aria-hidden />

      <span className="lq-love-crisis-line__ribbon" />
      <span className="lq-love-crisis-line__glow" aria-hidden />
      <span className="lq-love-crisis-line__dot" />

      {showModeUi && doubleBadgeText ? (
        <span
          className={`lq-love-crisis-line__mode-badge lq-love-crisis-line__mode-badge--${line.interaction} ${
            isNext ? 'lq-love-crisis-line__mode-badge--active' : ''
          }`}
        >
          {doubleBadgeText}
        </span>
      ) : null}

      {showModeUi && modeHint && isNext ? (
        <span className="lq-love-crisis-line__mode-hint">{modeHint}</span>
      ) : null}

      {line.interaction === 'hold' && (isHolding || isNext) ? (
        <span
          className="lq-love-crisis-line__hold-ring"
          style={{ '--hold-progress': String(isHolding ? holdProgress : 0) } as CSSProperties}
          aria-hidden
        />
      ) : null}

      {line.interaction === 'hold' && isHolding ? (
        <span
          className="lq-love-crisis-line__hold-bar"
          style={{ '--hold-progress': String(holdProgress) } as CSSProperties}
          aria-hidden
        />
      ) : null}

      <span className="lq-love-crisis-line__label">{EMOTION_META[line.emotion].task}</span>
    </button>
  );
}

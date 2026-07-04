import type { CSSProperties } from 'react';
import type { GameStageCoord } from './gameLayoutTypes';
import {
  labelAnchorAlongAngle,
  lineEndpoint,
} from './gameStageLayout';

const DEMO_LINES = [
  { id: 'top', label: '安慰', angle: -90, color: '#f472b6' },
  { id: 'right', label: '傾聽', angle: 0, color: '#a78bfa' },
  { id: 'bottom', label: '肯定', angle: 90, color: '#f59e0b' },
  { id: 'left', label: '冷靜', angle: 180, color: '#60a5fa' },
] as const;

const LINE_RATIO = 0.38;
const DOT_RADIUS = 14;

type DemoLineProps = {
  coord: GameStageCoord;
  angle: number;
  label: string;
  color: string;
};

function DemoStageLine({ coord, angle, label, color }: DemoLineProps) {
  const lineLength = coord.size * LINE_RATIO;
  const end = lineEndpoint(coord.centerX, coord.centerY, angle, lineLength);
  const labelPos = labelAnchorAlongAngle(coord, angle, lineLength, { estWidth: 48 });

  return (
    <>
      <div
        className="lq-game-stage-demo__beam"
        style={
          {
            left: coord.centerX,
            top: coord.centerY,
            width: lineLength,
            transform: `translateY(-50%) rotate(${angle}deg)`,
            '--beam-color': color,
          } as CSSProperties
        }
        aria-hidden
      />
      <span
        className="lq-game-stage-demo__dot"
        style={{
          left: end.x - DOT_RADIUS,
          top: end.y - DOT_RADIUS,
          width: DOT_RADIUS * 2,
          height: DOT_RADIUS * 2,
          background: color,
        }}
        aria-hidden
      />
      <span
        className="lq-game-stage-demo__label"
        style={{ left: labelPos.x, top: labelPos.y, transform: 'translate(-50%, -50%)' }}
      >
        {label}
      </span>
    </>
  );
}

type Props = {
  coord: GameStageCoord;
};

/** GameStage 示範：中心愛心 + 四條放射線 + clamp label */
export function GameStageDemoContent({ coord }: Props) {
  return (
    <>
      {DEMO_LINES.map((line) => (
        <DemoStageLine
          key={line.id}
          coord={coord}
          angle={line.angle}
          label={line.label}
          color={line.color}
        />
      ))}
      <div
        className="lq-game-stage-demo__heart"
        style={{ left: coord.centerX, top: coord.centerY }}
        aria-hidden
      >
        <span className="lq-game-stage-demo__heart-icon">💔</span>
      </div>
    </>
  );
}

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { GameStageCoord, GameStageProps } from './gameLayoutTypes';
import {
  computeGameStageCoord,
  computeGameStageSize,
  readViewportWidth,
} from './gameStageLayout';

const GameStageContext = createContext<GameStageCoord | null>(null);

export function useGameStage(): GameStageCoord {
  const ctx = useContext(GameStageContext);
  if (!ctx) {
    throw new Error('useGameStage must be used within GameStage');
  }
  return ctx;
}

type GameStageSurfaceProps = {
  coord: GameStageCoord;
  className?: string;
  children: ReactNode;
};

/** 固定尺寸舞台容器；子元素請用 absolute + x/y 定位 */
export function GameStageSurface({ coord, className = '', children }: GameStageSurfaceProps) {
  return (
    <div
      className={`lq-game-stage ${className}`.trim()}
      style={{ width: coord.size, height: coord.size } as CSSProperties}
      data-stage-size={coord.size}
    >
      <div className="lq-game-stage__halo" aria-hidden />
      <div className="lq-game-stage__content">{children}</div>
    </div>
  );
}

export function GameStage({
  className = '',
  stageClassName = '',
  sizeConfig,
  children,
}: GameStageProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [coord, setCoord] = useState<GameStageCoord | null>(null);
  const useViewport = sizeConfig?.measureSource === 'viewport';

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      const width = useViewport ? readViewportWidth() : el.getBoundingClientRect().width;
      if (width > 0) {
        const size = computeGameStageSize(width, sizeConfig);
        setCoord(computeGameStageCoord(size));
      }
    };

    measure();

    if (useViewport) {
      window.addEventListener('resize', measure);
      window.visualViewport?.addEventListener('resize', measure);
      return () => {
        window.removeEventListener('resize', measure);
        window.visualViewport?.removeEventListener('resize', measure);
      };
    }

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sizeConfig, useViewport]);

  return (
    <div ref={measureRef} className={`lq-game-stage-wrap ${className}`.trim()}>
      {coord ? (
        <GameStageContext.Provider value={coord}>
          <GameStageSurface coord={coord} className={stageClassName}>
            {children({ coord })}
          </GameStageSurface>
        </GameStageContext.Provider>
      ) : (
        <div
          className="lq-game-stage lq-game-stage--measuring"
          style={
            useViewport
              ? ({
                  width: computeGameStageSize(readViewportWidth(), sizeConfig),
                  height: computeGameStageSize(readViewportWidth(), sizeConfig),
                } as CSSProperties)
              : undefined
          }
          aria-hidden
        />
      )}
    </div>
  );
}

import type { GameStoryTextProps } from './gameLayoutTypes';

export function GameStoryText({ children, className = '' }: GameStoryTextProps) {
  return (
    <p className={`lq-game-story-text ${className}`.trim()} title={children}>
      {children}
    </p>
  );
}

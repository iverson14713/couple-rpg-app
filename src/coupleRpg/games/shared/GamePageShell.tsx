import { useEffect, type ReactNode } from 'react';
import type { GamePageShellProps } from './gameLayoutTypes';

export function GamePageShell({
  immersive = false,
  backButton,
  header,
  children,
  result,
  className = '',
}: GamePageShellProps) {
  useEffect(() => {
    document.documentElement.classList.toggle('lq-game-immersive', immersive);
    return () => document.documentElement.classList.remove('lq-game-immersive');
  }, [immersive]);

  return (
    <div
      className={`lq-game-page-shell ${immersive ? 'lq-game-page-shell--immersive' : ''} ${className}`.trim()}
    >
      {backButton ? <div className="lq-game-page-shell__back">{backButton}</div> : null}
      {header ? <header className="lq-game-page-shell__header">{header}</header> : null}
      <div className="lq-game-page-shell__content">{children}</div>
      {result ? <div className="lq-game-page-shell__result">{result}</div> : null}
    </div>
  );
}

type GamePageBackButtonProps = {
  label?: string;
  onClick: () => void;
};

export function GamePageBackButton({ label = '回遊戲列表', onClick }: GamePageBackButtonProps) {
  return (
    <button type="button" onClick={onClick} className="lq-game-page-shell__back-btn">
      <span className="lq-game-page-shell__back-icon" aria-hidden>
        ‹
      </span>
      {label}
    </button>
  );
}

export function GamePageHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="lq-game-page-shell__header-inner">
      {emoji ? <span className="lq-game-page-shell__header-emoji">{emoji}</span> : null}
      <div className="lq-game-page-shell__header-text">
        <h1 className="lq-game-page-shell__header-title">{title}</h1>
        {subtitle ? <p className="lq-game-page-shell__header-subtitle">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function GamePageShellContent({ children }: { children: ReactNode }) {
  return <div className="lq-game-page-shell__play">{children}</div>;
}

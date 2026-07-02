type Props = {
  message: string | null;
};

export function TurnChangeOverlay({ message }: Props) {
  if (!message) return null;

  return (
    <div className="lq-turn-notice" role="status" aria-live="polite">
      <div className="lq-turn-notice__card">
        <span className="text-lg" aria-hidden>
          💕
        </span>
        <p className="lq-turn-notice__text">{message}</p>
      </div>
    </div>
  );
}

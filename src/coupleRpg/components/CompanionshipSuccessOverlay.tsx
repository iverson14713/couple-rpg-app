import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  message: string;
};

export function CompanionshipSuccessOverlay({ open, message }: Props) {
  if (!open) return null;

  const overlay = (
    <div
      className="lq-companion-success-overlay"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="lq-companion-success-overlay__backdrop" aria-hidden />
      <div className="lq-companion-success-overlay__content">
        <div className="lq-companion-success-overlay__heart-wrap">
          <span className="lq-companion-success-overlay__heart-trail" aria-hidden>
            💕
          </span>
          <span className="lq-companion-success-overlay__heart" aria-hidden>
            ❤️
          </span>
        </div>
        <p className="lq-companion-success-overlay__text">{message}</p>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return overlay;
  return createPortal(overlay, document.body);
}

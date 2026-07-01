import type { CustomQuestion } from '../storage/customQuestionBankStore';
import { emojiForCustomCategory } from '../lib/customQuestionDrawUx';
import { lq } from '../theme';

export type CustomDrawPhase =
  | 'idle'
  | 'shuffle'
  | 'carousel'
  | 'revealing'
  | 'revealed'
  | 'flipping'
  | 'completed';

type CarouselPreview = {
  emoji: string;
  label: string;
};

type Props = {
  phase: CustomDrawPhase;
  question: CustomQuestion | null;
  moodLine: string | null;
  carouselPreview: CarouselPreview | null;
  showCelebration: boolean;
  enabledCount: number;
};

export function CustomQuestionDrawCard({
  phase,
  question,
  moodLine,
  carouselPreview,
  showCelebration,
  enabledCount,
}: Props) {
  const isAnimating =
    phase === 'shuffle' || phase === 'carousel' || phase === 'revealing' || phase === 'flipping';
  const showStableResult =
    (phase === 'revealed' || phase === 'completed' || phase === 'flipping') && question;
  const flipClass = phase === 'flipping' ? 'custom-draw-card--flip' : '';
  const revealClass = phase === 'revealing' || phase === 'revealed' ? 'custom-draw-card--reveal' : '';

  return (
    <div
      className="custom-draw-scene"
      aria-live="polite"
      aria-busy={isAnimating}
    >
      {showCelebration ? (
        <div className="custom-draw-celebration" aria-hidden>
          <span className="custom-draw-celebration__heart">💕</span>
          <span className="custom-draw-celebration__heart custom-draw-celebration__heart--2">❤️</span>
          <span className="custom-draw-celebration__heart custom-draw-celebration__heart--3">✨</span>
        </div>
      ) : null}

      <div className={`custom-draw-flip-inner ${flipClass} ${revealClass}`}>
        <div className="custom-draw-face custom-draw-face--front">
          {phase === 'idle' ? (
            <IdleContent enabledCount={enabledCount} />
          ) : phase === 'shuffle' ? (
            <ShuffleContent />
          ) : phase === 'carousel' && carouselPreview ? (
            <CarouselContent emoji={carouselPreview.emoji} label={carouselPreview.label} />
          ) : showStableResult ? (
            <ResultContent
              question={question!}
              moodLine={moodLine}
              completed={phase === 'completed'}
            />
          ) : phase === 'revealing' && question ? (
            <ResultContent question={question} moodLine={moodLine} pop />
          ) : null}
        </div>

        <div className="custom-draw-face custom-draw-face--back" aria-hidden>
          <div className="custom-draw-back-pattern" />
        </div>
      </div>
    </div>
  );
}

function IdleContent({ enabledCount }: { enabledCount: number }) {
  return (
    <>
      <span className="custom-draw-idle-emoji" aria-hidden>
        📝
      </span>
      <p className={`custom-draw-title ${lq.text}`}>準備抽一題？</p>
      {enabledCount > 0 ? (
        <p className={`custom-draw-subtitle ${lq.textSecondary}`}>
          可抽 {enabledCount} 題 · 只玩你的專屬題庫
        </p>
      ) : null}
    </>
  );
}

function ShuffleContent() {
  return (
    <>
      <div className="custom-draw-stack" aria-hidden>
        <div className="custom-draw-stack__card custom-draw-stack__card--3" />
        <div className="custom-draw-stack__card custom-draw-stack__card--2" />
        <div className="custom-draw-stack__card custom-draw-stack__card--1" />
      </div>
      <p className={`custom-draw-shuffle-text ${lq.textSecondary}`}>
        正在挑選今天最適合你們的題目...
      </p>
    </>
  );
}

function CarouselContent({ emoji, label }: { emoji: string; label: string }) {
  return (
    <>
      <span className="custom-draw-carousel-emoji" aria-hidden>
        {emoji}
      </span>
      <p className={`custom-draw-carousel-label ${lq.text}`}>{label}</p>
    </>
  );
}

function ResultContent({
  question,
  moodLine,
  completed,
  pop,
}: {
  question: CustomQuestion;
  moodLine: string | null;
  completed?: boolean;
  pop?: boolean;
}) {
  const emoji = emojiForCustomCategory(question.category);

  return (
    <>
      <span
        className={`custom-draw-result-emoji ${pop ? 'custom-draw-result-emoji--pop' : ''}`}
        aria-hidden
      >
        {emoji}
      </span>
      <p className="custom-draw-result-category">{question.category}</p>
      <p className={`custom-draw-result-text ${lq.text}`}>{question.text}</p>
      {completed ? (
        <p className="custom-draw-complete-msg">今天又更愛對方一點 ❤️</p>
      ) : moodLine ? (
        <p className="custom-draw-mood-line">{moodLine}</p>
      ) : null}
    </>
  );
}

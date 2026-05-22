import { forwardRef } from 'react';
import type { AiShareCardPayload } from '../lib/aiShareCardContent';
import { AI_SHARE_CARD_CAPTURE_SIZE } from '../lib/aiShareCardExport';

type Mode = 'preview' | 'capture';

type Props = {
  payload: AiShareCardPayload;
  mode?: Mode;
  className?: string;
};

const CARD_GRADIENT =
  'linear-gradient(165deg, #fce7f3 0%, #fdf2f8 28%, #faf5ff 55%, #fff1f2 100%)';

export const AiShareCardVisual = forwardRef<HTMLDivElement, Props>(function AiShareCardVisual(
  { payload, mode = 'preview', className = '' },
  ref
) {
  const kindLabel = payload.kind === 'date_itinerary' ? '約會行程' : '重要日子安排';
  const isCapture = mode === 'capture';

  return (
    <div
      ref={ref}
      data-ai-share-card={isCapture ? 'capture' : 'preview'}
      className={`overflow-hidden rounded-3xl border border-rose-200/50 shadow-[0_20px_50px_-16px_rgba(244,114,182,0.45)] ${className}`}
      style={{
        backgroundImage: CARD_GRADIENT,
        ...(isCapture
          ? {
              width: AI_SHARE_CARD_CAPTURE_SIZE.width,
              height: AI_SHARE_CARD_CAPTURE_SIZE.height,
            }
          : undefined),
      }}
    >
      <div className={`flex h-full flex-col ${isCapture ? 'p-6' : 'p-5'}`}>
        <p
          className={`text-center font-bold uppercase tracking-[0.2em] text-rose-400/90 ${
            isCapture ? 'text-[12px]' : 'text-[11px]'
          }`}
        >
          LoveQuest
        </p>
        <p className={`mt-1 text-center font-semibold text-rose-500/80 ${isCapture ? 'text-[11px]' : 'text-[10px]'}`}>
          {kindLabel}
        </p>

        <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
          <span className={isCapture ? 'text-6xl leading-none' : 'text-5xl leading-none'} aria-hidden>
            {payload.emoji}
          </span>
          <h2
            className={`mt-4 font-extrabold leading-tight text-[#3a2e34] ${
              isCapture ? 'text-[24px]' : 'text-[22px]'
            }`}
          >
            {payload.title}
          </h2>
          <p className={`mt-2 font-semibold text-rose-600/90 ${isCapture ? 'text-[14px]' : 'text-[13px]'}`}>
            {payload.dateLabel}
          </p>
          <p className={`mt-1 text-[#8a7a84] ${isCapture ? 'text-[13px]' : 'text-[12px]'}`}>{payload.subtitle}</p>

          {payload.summaryLines.length > 0 ? (
            <ul
              className={`mt-5 w-full space-y-2 rounded-2xl bg-white/45 px-3 py-3 text-left backdrop-blur-sm ${
                isCapture ? 'text-[13px]' : 'text-[12px]'
              }`}
            >
              {payload.summaryLines.map((line, i) => (
                <li key={i} className="leading-snug text-[#4a3c44]">
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <footer className="mt-auto border-t border-rose-200/35 pt-3 text-center">
          <p className={`font-semibold text-rose-500/90 ${isCapture ? 'text-[11px]' : 'text-[10px]'}`}>
            Made with LoveQuest ❤️
          </p>
          <p className={`mt-0.5 font-medium text-rose-400/75 ${isCapture ? 'text-[10px]' : 'text-[9px]'}`}>
            lovequest.app
          </p>
        </footer>
      </div>
    </div>
  );
});

import { createPortal } from 'react-dom';
import { Image, X } from 'lucide-react';
import type { AiShareCardPayload } from '../lib/aiShareCardContent';
import { lq } from '../theme';

type Props = {
  payload: AiShareCardPayload;
  onClose: () => void;
};

export function AiShareCardModal({ payload, onClose }: Props) {
  const kindLabel = payload.kind === 'date_itinerary' ? '約會行程' : '重要日子安排';

  const modal = (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-end sm:justify-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/50"
        aria-label="關閉"
        onClick={onClose}
      />
      <div className="relative z-10 mx-auto w-full max-w-sm px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:pb-8">
        <div className="mb-3 flex items-center justify-between">
          <p className={`flex items-center gap-1.5 text-[14px] font-bold ${lq.text}`}>
            <Image className="h-4 w-4 text-rose-500" aria-hidden />
            分享卡預覽
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-sm"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="mx-auto aspect-[9/16] max-h-[min(70vh,520px)] w-full overflow-hidden rounded-3xl border border-rose-200/50 shadow-[0_20px_50px_-16px_rgba(244,114,182,0.45)]"
          style={{
            backgroundImage:
              'linear-gradient(165deg, #fce7f3 0%, #fdf2f8 28%, #faf5ff 55%, #fff1f2 100%)',
          }}
        >
          <div className="flex h-full flex-col p-5">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-rose-400/90">
              LoveQuest
            </p>
            <p className="mt-1 text-center text-[10px] font-semibold text-rose-500/80">{kindLabel}</p>

            <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
              <span className="text-5xl leading-none" aria-hidden>
                {payload.emoji}
              </span>
              <h2 className="mt-4 text-[22px] font-extrabold leading-tight text-[#3a2e34]">{payload.title}</h2>
              <p className="mt-2 text-[13px] font-semibold text-rose-600/90">{payload.dateLabel}</p>
              <p className="mt-1 text-[12px] text-[#8a7a84]">{payload.subtitle}</p>

              {payload.summaryLines.length > 0 ? (
                <ul className="mt-5 w-full space-y-2 rounded-2xl bg-white/45 px-3 py-3 text-left backdrop-blur-sm">
                  {payload.summaryLines.map((line, i) => (
                    <li key={i} className="text-[12px] leading-snug text-[#4a3c44]">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <p className="mt-auto text-center text-[10px] font-medium text-rose-400/70">
              和我們一起 LoveQuest 💕
            </p>
          </div>
        </div>

        <p className={`mt-3 text-center text-[11px] ${lq.textMuted}`}>
          截圖即可分享到 IG 限動或傳給另一半（下載功能之後再加）
        </p>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

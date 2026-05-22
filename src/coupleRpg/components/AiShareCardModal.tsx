import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image, Loader2, Share2, Sparkles, X } from 'lucide-react';
import type { AiShareCardPayload } from '../lib/aiShareCardContent';
import {
  canSharePngFile,
  canUseNativeShare,
  captureShareCardElement,
  createShareCardPreviewUrl,
  revokeShareCardPreviewUrl,
  shareShareCardBlob,
} from '../lib/aiShareCardExport';
import { AiShareCardVisual } from './AiShareCardVisual';
import { useAiToast } from '../context/AiToastContext';
import { lq } from '../theme';

type Props = {
  payload: AiShareCardPayload;
  onClose: () => void;
};

type Step = 'compose' | 'image';

export function AiShareCardModal({ payload, onClose }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>('compose');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { showSuccess, showError } = useAiToast();

  const nativeShareAvailable = canUseNativeShare();
  const fileShareAvailable = imageBlob ? canSharePngFile(imageBlob, payload) : false;

  useEffect(() => {
    return () => {
      if (imageUrl) revokeShareCardPreviewUrl(imageUrl);
    };
  }, [imageUrl]);

  const handleGenerate = useCallback(async () => {
    const el = captureRef.current;
    if (!el) {
      showError('分享卡尚未準備好，請稍後再試');
      return;
    }
    setGenerating(true);
    try {
      const blob = await captureShareCardElement(el);
      if (imageUrl) revokeShareCardPreviewUrl(imageUrl);
      const url = createShareCardPreviewUrl(blob);
      setImageBlob(blob);
      setImageUrl(url);
      setStep('image');
    } catch (e) {
      console.error('[ai-share-card] generate', e);
      showError('產生分享圖失敗，請再試一次');
    } finally {
      setGenerating(false);
    }
  }, [imageUrl, showError]);

  const handleShare = useCallback(async () => {
    if (!imageBlob) return;
    if (!nativeShareAvailable) {
      showError('此裝置不支援系統分享，請長按圖片儲存');
      return;
    }
    setSharing(true);
    try {
      const result = await shareShareCardBlob(imageBlob, payload);
      if (result === 'cancelled') return;
      if (result === 'unsupported') {
        showError('此裝置不支援系統分享，請長按圖片儲存');
        return;
      }
      if (result === 'text_only') {
        showSuccess('已開啟分享（請長按圖片儲存到相簿）');
        return;
      }
      showSuccess('已開啟分享，可傳給另一半或分享到社群');
    } catch (e) {
      console.error('[ai-share-card] share', e);
      showError('分享失敗，請再試一次');
    } finally {
      setSharing(false);
    }
  }, [imageBlob, nativeShareAvailable, payload, showError, showSuccess]);

  const handleBackToCompose = () => {
    if (imageUrl) revokeShareCardPreviewUrl(imageUrl);
    setImageUrl(null);
    setImageBlob(null);
    setStep('compose');
  };

  const shareChannelsHint = fileShareAvailable
    ? '可分享到 LINE、IG、Messenger、AirDrop 等'
    : '此裝置可能無法附圖分享，請優先長按圖片儲存';

  const modal = (
    <div
      className="fixed inset-0 z-[110] flex flex-col items-center justify-end sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-share-card-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/50"
        aria-label="關閉"
        onClick={onClose}
      />
      <div className="relative z-10 mx-auto flex max-h-[100dvh] w-full max-w-sm flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:max-h-[92vh] sm:pb-8">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <p id="ai-share-card-title" className={`flex items-center gap-1.5 text-[14px] font-bold ${lq.text}`}>
            <Image className="h-4 w-4 text-rose-500" aria-hidden />
            {step === 'image' ? '分享圖預覽' : '分享卡'}
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {step === 'compose' ? (
            <AiShareCardVisual
              payload={payload}
              mode="preview"
              className="mx-auto aspect-[9/16] max-h-[min(52vh,480px)] w-full"
            />
          ) : imageUrl ? (
            <div className="mx-auto w-full max-w-[280px]">
              <div
                className={`overflow-hidden rounded-2xl border border-rose-200/50 bg-gradient-to-b from-rose-50/80 to-pink-50/60 p-2 shadow-[0_16px_40px_-14px_rgba(244,114,182,0.35)] ${lq.card}`}
              >
                <img
                  src={imageUrl}
                  alt={`${payload.title} — LoveQuest 分享圖`}
                  className="mx-auto block w-full rounded-xl object-contain"
                  style={{ WebkitTouchCallout: 'default', maxHeight: 'min(58vh, 520px)' }}
                  draggable={false}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0" aria-hidden>
          <AiShareCardVisual ref={captureRef} payload={payload} mode="capture" />
        </div>

        <div className="mt-3 shrink-0 space-y-2 border-t border-rose-100/60 pt-3">
          {step === 'compose' ? (
            <button
              type="button"
              disabled={generating}
              onClick={() => void handleGenerate()}
              className={`w-full ${lq.btnPrimary} disabled:opacity-60`}
            >
              {generating ? (
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="mr-2 inline h-4 w-4" aria-hidden />
              )}
              產生分享圖
            </button>
          ) : (
            <>
              <SaveToPhotosHintCard
                emphasize={!fileShareAvailable}
                subline={!fileShareAvailable ? '或使用下方「分享」傳給另一半' : undefined}
              />
              <button
                type="button"
                disabled={sharing || !imageBlob}
                onClick={() => void handleShare()}
                className={`w-full ${lq.btnPrimary} disabled:opacity-60`}
              >
                {sharing ? (
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Share2 className="mr-2 inline h-4 w-4" aria-hidden />
                )}
                分享
              </button>
              <button
                type="button"
                onClick={handleBackToCompose}
                className={`w-full ${lq.btnSecondary}`}
              >
                重新調整分享卡
              </button>
              <p className="text-center text-[11px] leading-relaxed text-slate-500">
                {shareChannelsHint}
              </p>
            </>
          )}

          {step === 'compose' ? (
            <p className="text-center text-[11px] leading-relaxed text-slate-500">
              先產生分享圖，再長按儲存或一鍵分享
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

/** 次操作：iOS / PWA 長按存相簿說明（高對比、獨立提示卡） */
function SaveToPhotosHintCard({
  subline,
  emphasize = false,
}: {
  subline?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-3.5 py-3.5 shadow-sm ${
        emphasize
          ? 'border-slate-300/90 bg-white ring-1 ring-slate-200/80'
          : 'border-slate-200/90 bg-white/95 ring-1 ring-black/[0.04]'
      }`}
      role="note"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg"
        aria-hidden
      >
        📱
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[14px] font-semibold leading-snug text-slate-700">
          長按圖片可儲存到手機相簿
        </p>
        {subline ? (
          <p className="mt-1.5 text-[12px] font-medium leading-snug text-slate-600">{subline}</p>
        ) : null}
      </div>
    </div>
  );
}

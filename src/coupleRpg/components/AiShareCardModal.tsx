import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Image, Loader2, Share2, X } from 'lucide-react';
import type { AiShareCardPayload } from '../lib/aiShareCardContent';
import {
  canUseNativeShare,
  captureShareCardElement,
  createShareCardPreviewDataUrl,
  revokeShareCardPreviewUrl,
  saveShareCardToAlbum,
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
  const generateInFlight = useRef(false);
  const imageReadyRef = useRef(false);
  const [step, setStep] = useState<Step>('image');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useAiToast();

  const nativeShareAvailable = canUseNativeShare();

  useEffect(() => {
    return () => {
      if (imageUrl) revokeShareCardPreviewUrl(imageUrl);
    };
  }, [imageUrl]);

  const handleClose = useCallback(() => {
    if (imageUrl) revokeShareCardPreviewUrl(imageUrl);
    onClose();
  }, [imageUrl, onClose]);

  const handleGenerate = useCallback(async () => {
    if (generateInFlight.current || imageReadyRef.current) return;
    const el = captureRef.current;
    if (!el) {
      showError('分享卡尚未準備好，請稍後再試');
      setGenerating(false);
      return;
    }
    generateInFlight.current = true;
    setGenerating(true);
    try {
      const blob = await captureShareCardElement(el);
      const url = await createShareCardPreviewDataUrl(blob);
      setImageBlob(blob);
      setImageUrl((prevUrl) => {
        if (prevUrl) revokeShareCardPreviewUrl(prevUrl);
        return url;
      });
      setStep('image');
      imageReadyRef.current = true;
    } catch (e) {
      console.error('[ai-share-card] generate', e);
      showError('產生分享圖失敗，請再試一次');
      setStep('compose');
    } finally {
      setGenerating(false);
      generateInFlight.current = false;
    }
  }, [showError]);

  const handleGenerateRef = useRef(handleGenerate);
  handleGenerateRef.current = handleGenerate;

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      void handleGenerateRef.current();
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleSave = useCallback(async () => {
    if (!imageBlob) return;
    setSaving(true);
    try {
      const result = await saveShareCardToAlbum(imageBlob, payload);
      if (result === 'saved') {
        showSuccess('已儲存到相簿');
      } else {
        showError('儲存失敗，請改用分享按鈕');
      }
    } catch (e) {
      console.error('[ai-share-card] save', e);
      showError('儲存失敗，請改用分享按鈕');
    } finally {
      setSaving(false);
    }
  }, [imageBlob, payload, showError, showSuccess]);

  const handleShare = useCallback(async () => {
    if (!imageBlob) return;
    if (!nativeShareAvailable) {
      showError('此裝置不支援系統分享，請改用「儲存圖片」');
      return;
    }
    setSharing(true);
    try {
      const result = await shareShareCardBlob(imageBlob, payload);
      if (result === 'cancelled') return;
      if (result === 'unsupported') {
        showError('此裝置不支援系統分享，請改用「儲存圖片」');
        return;
      }
      if (result === 'text_only') {
        showSuccess('已開啟分享');
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
    imageReadyRef.current = false;
    setImageUrl(null);
    setImageBlob(null);
    setStep('compose');
    requestAnimationFrame(() => {
      void handleGenerateRef.current();
    });
  };

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
        onClick={handleClose}
      />
      <div className="relative z-10 mx-auto flex max-h-[100dvh] w-full max-w-sm flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:max-h-[92vh] sm:pb-8">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <p id="ai-share-card-title" className={`flex items-center gap-1.5 text-[14px] font-bold ${lq.text}`}>
            <Image className="h-4 w-4 text-rose-500" aria-hidden />
            {generating || step === 'image' ? '分享圖預覽' : '分享卡'}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-sm"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {generating ? (
            <div className="flex min-h-[min(52vh,480px)] flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500" aria-hidden />
              <p className="text-[14px] font-medium text-stone-600">分享圖產生中…</p>
            </div>
          ) : step === 'compose' && !imageUrl ? (
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
                  className="pointer-events-none mx-auto block w-full select-none rounded-xl object-contain"
                  style={{
                    WebkitTouchCallout: 'none',
                    maxHeight: 'min(58vh, 520px)',
                  }}
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
          {generating ? null : imageUrl && imageBlob ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className={`w-full ${lq.btnPrimary} disabled:opacity-60`}
              >
                {saving ? (
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="mr-2 inline h-4 w-4" aria-hidden />
                )}
                儲存圖片
              </button>
              <button
                type="button"
                disabled={sharing}
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
                className={`w-full ${lq.btnSecondary} !border-stone-200 !bg-white/80 !text-stone-600`}
              >
                重新調整分享卡
              </button>
              <p className="text-center text-[11px] leading-relaxed text-slate-500">
                可儲存到相簿，或分享到 LINE、IG、AirDrop 等
              </p>
            </>
          ) : step === 'compose' ? (
            <button
              type="button"
              onClick={() => void handleGenerate()}
              className={`w-full ${lq.btnPrimary}`}
            >
              產生分享圖
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

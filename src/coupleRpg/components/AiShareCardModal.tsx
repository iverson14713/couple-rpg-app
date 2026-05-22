import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Image, Loader2, Share2, X } from 'lucide-react';
import type { AiShareCardPayload } from '../lib/aiShareCardContent';
import { saveShareCardImage, shareShareCardToPartner, canUseNativeShare } from '../lib/aiShareCardExport';
import { AiShareCardVisual } from './AiShareCardVisual';
import { useAiToast } from '../context/AiToastContext';
import { lq } from '../theme';

type Props = {
  payload: AiShareCardPayload;
  onClose: () => void;
};

type BusyAction = 'save' | 'share' | null;

export function AiShareCardModal({ payload, onClose }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const { showSuccess, showError } = useAiToast();
  const nativeShareAvailable = canUseNativeShare();

  const runCaptureAction = useCallback(
    async (action: 'save' | 'share') => {
      const el = captureRef.current;
      if (!el) {
        showError('分享卡尚未準備好，請稍後再試');
        return;
      }

      setBusy(action);
      try {
        if (action === 'save') {
          await saveShareCardImage(el, payload);
          showSuccess('分享卡已儲存到裝置');
          return;
        }

        if (!nativeShareAvailable) {
          showError('此裝置不支援系統分享，請改用「儲存圖片」');
          return;
        }

        const result = await shareShareCardToPartner(el, payload);
        if (result === 'cancelled') return;
        if (result === 'unsupported') {
          showError('此裝置不支援系統分享，請改用「儲存圖片」');
          return;
        }
        if (result === 'text_only') {
          showSuccess('已開啟分享（部分裝置請先儲存圖片再分享）');
          return;
        }
        showSuccess('已開啟分享，可傳給另一半或分享到社群');
      } catch (e) {
        console.error('[ai-share-card]', e);
        showError(action === 'save' ? '儲存圖片失敗，請再試一次' : '分享失敗，請再試一次');
      } finally {
        setBusy(null);
      }
    },
    [payload, nativeShareAvailable, showError, showSuccess]
  );

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
      <div className="relative z-10 mx-auto flex w-full max-w-sm max-h-[100dvh] flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:max-h-[92vh] sm:pb-8">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <p id="ai-share-card-title" className={`flex items-center gap-1.5 text-[14px] font-bold ${lq.text}`}>
            <Image className="h-4 w-4 text-rose-500" aria-hidden />
            分享卡
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
          <AiShareCardVisual
            payload={payload}
            mode="preview"
            className="mx-auto aspect-[9/16] max-h-[min(52vh,480px)] w-full"
          />
        </div>

        {/* 離屏高解析度擷取用（與預覽同內容） */}
        <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0" aria-hidden>
          <AiShareCardVisual ref={captureRef} payload={payload} mode="capture" />
        </div>

        <div className="mt-3 shrink-0 space-y-2 border-t border-rose-100/60 pt-3">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => runCaptureAction('save')}
            className={`w-full ${lq.btnPrimary} disabled:opacity-60`}
          >
            {busy === 'save' ? (
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="mr-2 inline h-4 w-4" aria-hidden />
            )}
            儲存圖片
          </button>
          <button
            type="button"
            disabled={busy !== null || !nativeShareAvailable}
            onClick={() => runCaptureAction('share')}
            className={`w-full ${lq.btnSecondary} disabled:opacity-60`}
          >
            {busy === 'share' ? (
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Share2 className="mr-2 inline h-4 w-4" aria-hidden />
            )}
            分享給另一半
          </button>
          <p className={`text-center text-[11px] leading-relaxed ${lq.textMuted}`}>
            {nativeShareAvailable
              ? '可分享到 LINE、IG、Messenger、AirDrop 等'
              : '此瀏覽器不支援一鍵分享，請使用「儲存圖片」'}
          </p>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

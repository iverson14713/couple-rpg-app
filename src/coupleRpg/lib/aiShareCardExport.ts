import html2canvas from 'html2canvas';
import {
  buildNativeShareText,
  buildNativeShareTitle,
  LOVEQUEST_APP_URL,
  shareCardFilename,
} from './aiShareConfig';
import type { AiShareCardPayload } from './aiShareCardContent';

const CAPTURE_WIDTH = 360;
const CAPTURE_HEIGHT = 640;

export const AI_SHARE_CARD_CAPTURE_SIZE = {
  width: CAPTURE_WIDTH,
  height: CAPTURE_HEIGHT,
} as const;

export async function captureShareCardElement(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    width: element.offsetWidth || CAPTURE_WIDTH,
    height: element.offsetHeight || CAPTURE_HEIGHT,
    scale: 2,
    useCORS: true,
    backgroundColor: '#fce7f3',
    logging: false,
    foreignObjectRendering: false,
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1));
  if (!blob) throw new Error('無法產生分享卡圖片');
  return blob;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 儲存 PNG（桌面下載；手機盡力觸發下載） */
export async function saveShareCardImage(
  element: HTMLElement,
  payload: AiShareCardPayload
): Promise<void> {
  const blob = await captureShareCardElement(element);
  const filename = shareCardFilename(payload);
  triggerDownload(blob, filename);
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

function canSharePngFile(file: File): boolean {
  if (!canUseNativeShare() || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * 原生分享：圖片 + 文案 + 連結（LINE / IG / Messenger / AirDrop 等系統分享）。
 * 若不支援 files，改分享文字並提示可另存圖片。
 */
export async function shareShareCardToPartner(
  element: HTMLElement,
  payload: AiShareCardPayload
): Promise<'shared' | 'text_only' | 'cancelled' | 'unsupported'> {
  if (!canUseNativeShare()) return 'unsupported';

  const blob = await captureShareCardElement(element);
  const filename = shareCardFilename(payload);
  const file = new File([blob], filename, { type: 'image/png' });
  const title = buildNativeShareTitle(payload);
  const text = buildNativeShareText(payload);

  const withFiles = canSharePngFile(file);

  try {
    if (withFiles) {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return 'shared';
    }

    await navigator.share({
      title,
      text: `${text}\n\n（此裝置無法附圖，請先用「儲存圖片」）`,
      url: LOVEQUEST_APP_URL,
    });
    return 'text_only';
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    throw e;
  }
}

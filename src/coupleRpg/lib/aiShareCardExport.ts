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

export function createShareCardPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeShareCardPreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function canSharePngFile(blob: Blob, payload: AiShareCardPayload): boolean {
  if (!canUseNativeShare() || !navigator.canShare) return false;
  try {
    const file = new File([blob], shareCardFilename(payload), { type: 'image/png' });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export type ShareCardBlobResult = 'shared' | 'text_only' | 'cancelled' | 'unsupported';

/**
 * 使用已產生的 PNG 分享（Web Share API files）。
 * 若不支援附檔，改分享文字並由 UI 提示長按儲存。
 */
export async function shareShareCardBlob(
  blob: Blob,
  payload: AiShareCardPayload
): Promise<ShareCardBlobResult> {
  if (!canUseNativeShare()) return 'unsupported';

  const filename = shareCardFilename(payload);
  const file = new File([blob], filename, { type: 'image/png' });
  const title = buildNativeShareTitle(payload);
  const text = buildNativeShareText(payload);
  const withFiles = canSharePngFile(blob, payload);

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
      text: `${text}\n\n${LOVEQUEST_APP_URL}`,
      url: LOVEQUEST_APP_URL,
    });
    return 'text_only';
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    throw e;
  }
}

/** @deprecated 請改用 App 內預覽 + 長按儲存；保留供桌面極少數環境 */
export async function downloadShareCardBlob(blob: Blob, payload: AiShareCardPayload): Promise<void> {
  const url = createShareCardPreviewUrl(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = shareCardFilename(payload);
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => revokeShareCardPreviewUrl(url), 2000);
}

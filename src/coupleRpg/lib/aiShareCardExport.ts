import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
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

export async function createShareCardPreviewDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string' && result.startsWith('data:')) {
        resolve(result);
        return;
      }
      reject(new Error('無法產生分享圖預覽'));
    };
    reader.onerror = () => reject(new Error('無法讀取分享圖'));
    reader.readAsDataURL(blob);
  });
}

/** @deprecated 預覽請用 createShareCardPreviewDataUrl；保留供下載連結 */
export function createShareCardPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeShareCardPreviewUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function canUseNativeShare(): boolean {
  if (Capacitor.isNativePlatform()) return true;
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
export type SaveShareCardResult = 'saved' | 'failed';

async function blobToBase64Payload(blob: Blob): Promise<string> {
  const dataUrl = await createShareCardPreviewDataUrl(blob);
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

async function writeShareCardCacheFile(blob: Blob, payload: AiShareCardPayload): Promise<string> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const filename = shareCardFilename(payload);
  await Filesystem.writeFile({
    path: filename,
    data: await blobToBase64Payload(blob),
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({
    path: filename,
    directory: Directory.Cache,
  });
  return uri;
}

/** 儲存分享卡到相簿（原生 Media）或觸發瀏覽器下載 */
export async function saveShareCardToAlbum(
  blob: Blob,
  payload: AiShareCardPayload
): Promise<SaveShareCardResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Media } = await import('@capacitor-community/media');
      const dataUrl = await createShareCardPreviewDataUrl(blob);
      await Media.savePhoto({ path: dataUrl });
      return 'saved';
    } catch (e) {
      console.error('[ai-share-card] save native', e);
      return 'failed';
    }
  }

  try {
    await downloadShareCardBlob(blob, payload);
    return 'saved';
  } catch (e) {
    console.error('[ai-share-card] save web', e);
    return 'failed';
  }
}

async function shareShareCardBlobNative(
  blob: Blob,
  payload: AiShareCardPayload
): Promise<ShareCardBlobResult> {
  const { Share } = await import('@capacitor/share');
  const fileUri = await writeShareCardCacheFile(blob, payload);
  try {
    await Share.share({
      title: buildNativeShareTitle(payload),
      text: buildNativeShareText(payload),
      files: [fileUri],
      dialogTitle: '分享 LoveQuest 分享卡',
    });
    return 'shared';
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    throw e;
  }
}

/**
 * 分享已產生的 PNG（Capacitor Share 或 Web Share API）。
 */
export async function shareShareCardBlob(
  blob: Blob,
  payload: AiShareCardPayload
): Promise<ShareCardBlobResult> {
  if (Capacitor.isNativePlatform()) {
    return shareShareCardBlobNative(blob, payload);
  }

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

/** 瀏覽器下載（非原生環境 fallback） */
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

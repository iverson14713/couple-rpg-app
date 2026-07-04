import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { LOVEQUEST_APP_URL } from '../../lib/aiShareConfig';
import { APP_NAME } from '../../theme';
import { waitForShareCardAssets } from '../heartCircle/loveQuestShareBrand';
import type { LoveCrisisGameResult } from './loveCrisisTypes';

export const LOVE_CRISIS_SHARE_CAPTURE_SIZE = {
  width: 360,
  height: 640,
} as const;

export type LoveCrisisSharePayload = {
  playerAName: string;
  playerBName: string;
  successCount: number;
  maxStreak: number;
  verdict: string;
};

export type LoveCrisisShareResult =
  | 'shared'
  | 'downloaded'
  | 'text_only'
  | 'copied'
  | 'cancelled'
  | 'failed';

export function buildLoveCrisisSharePayload(
  result: LoveCrisisGameResult,
  playerAName: string,
  playerBName: string
): LoveCrisisSharePayload {
  return {
    playerAName,
    playerBName,
    successCount: result.successCount,
    maxStreak: result.maxStreak,
    verdict: result.verdict,
  };
}

export function buildLoveCrisisShareTitle(payload: LoveCrisisSharePayload): string {
  return `愛情危機：成功修復 ${payload.successCount} 顆愛心！`;
}

export function buildLoveCrisisShareText(payload: LoveCrisisSharePayload): string {
  return `💕 ${payload.playerAName} × ${payload.playerBName} 在 LoveQuest「愛情危機」一起修復了 ${payload.successCount} 顆愛心！\n最高連續 ${payload.maxStreak} 次 · ${payload.verdict}\n和另一半一起挑戰 👉 ${LOVEQUEST_APP_URL}`;
}

function shareFilename(): string {
  return `lovequest-love-crisis-${Date.now()}.png`;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('無法讀取分享圖'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('無法讀取分享圖'));
    reader.readAsDataURL(blob);
  });
}

export async function captureLoveCrisisShareCard(element: HTMLElement): Promise<Blob> {
  await waitForShareCardAssets(element);

  const canvas = await html2canvas(element, {
    width: LOVE_CRISIS_SHARE_CAPTURE_SIZE.width,
    height: LOVE_CRISIS_SHARE_CAPTURE_SIZE.height,
    scale: 3,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15_000,
    backgroundColor: '#ede9fe',
    logging: false,
    foreignObjectRendering: false,
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll<HTMLImageElement>('img[data-share-asset]').forEach((img) => {
        img.crossOrigin = 'anonymous';
        img.decoding = 'sync';
      });
    },
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1));
  if (!blob) throw new Error('無法產生分享卡圖片');
  return blob;
}

export async function downloadLoveCrisisShareCard(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = shareFilename();
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function copyShareText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

async function shareNative(blob: Blob, payload: LoveCrisisSharePayload): Promise<LoveCrisisShareResult> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const filename = shareFilename();
  await Filesystem.writeFile({
    path: filename,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
  try {
    await Share.share({
      title: buildLoveCrisisShareTitle(payload),
      text: buildLoveCrisisShareText(payload),
      files: [uri],
      dialogTitle: `分享 ${APP_NAME}`,
    });
    return 'shared';
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    throw e;
  }
}

async function shareWeb(blob: Blob, payload: LoveCrisisSharePayload): Promise<LoveCrisisShareResult> {
  const title = buildLoveCrisisShareTitle(payload);
  const text = buildLoveCrisisShareText(payload);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const file = new File([blob], shareFilename(), { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        return 'shared';
      }
      await navigator.share({ title, text, url: LOVEQUEST_APP_URL });
      return 'text_only';
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    }
  }

  try {
    await downloadLoveCrisisShareCard(blob);
    return 'downloaded';
  } catch {
    if (await copyShareText(text)) return 'copied';
    return 'failed';
  }
}

export async function shareLoveCrisisCard(
  blob: Blob,
  payload: LoveCrisisSharePayload
): Promise<LoveCrisisShareResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      return shareNative(blob, payload);
    }
    return shareWeb(blob, payload);
  } catch (e) {
    console.error('[love-crisis-share]', e);
    const text = buildLoveCrisisShareText(payload);
    try {
      await downloadLoveCrisisShareCard(blob);
      return 'downloaded';
    } catch {
      if (await copyShareText(text)) return 'copied';
      return 'failed';
    }
  }
}

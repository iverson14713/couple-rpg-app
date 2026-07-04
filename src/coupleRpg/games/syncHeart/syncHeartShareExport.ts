import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { LOVEQUEST_APP_URL } from '../../lib/aiShareConfig';
import { APP_NAME } from '../../theme';
import { waitForShareCardAssets } from '../heartCircle/loveQuestShareBrand';
import type { SyncHeartGameResult } from './syncHeartTypes';

export const SYNC_HEART_SHARE_CAPTURE_SIZE = {
  width: 360,
  height: 640,
} as const;

export type SyncHeartSharePayload = {
  playerAName: string;
  playerBName: string;
  score: number;
  averageDiffSeconds: number | null;
  bestDiffSeconds: number | null;
  failCount: number;
  verdict: string;
};

export type SyncHeartShareResult =
  | 'shared'
  | 'downloaded'
  | 'text_only'
  | 'copied'
  | 'cancelled'
  | 'failed';

export function buildSyncHeartSharePayload(
  result: SyncHeartGameResult,
  playerAName: string,
  playerBName: string
): SyncHeartSharePayload {
  return {
    playerAName,
    playerBName,
    score: result.score,
    averageDiffSeconds: result.averageDiffSeconds,
    bestDiffSeconds: result.bestDiffSeconds,
    failCount: result.failCount,
    verdict: result.verdict,
  };
}

export function buildSyncHeartShareTitle(payload: SyncHeartSharePayload): string {
  return `心有靈犀 ${payload.score} 分！`;
}

export function buildSyncHeartShareText(payload: SyncHeartSharePayload): string {
  const avg =
    payload.averageDiffSeconds != null
      ? `平均差距 ${payload.averageDiffSeconds.toFixed(3)} 秒`
      : '本局沒有有效回合';
  const best =
    payload.bestDiffSeconds != null
      ? `最佳 ${payload.bestDiffSeconds.toFixed(3)} 秒`
      : '—';
  return `💕 ${payload.playerAName} × ${payload.playerBName} 在 LoveQuest「心有靈犀」默契挑戰！\n默契分數：${payload.score} 分\n${avg} · ${best}\n失敗回合：${payload.failCount}\n${payload.verdict}\n和另一半一起挑戰吧 👉 ${LOVEQUEST_APP_URL}`;
}

function shareFilename(): string {
  return `lovequest-sync-heart-${Date.now()}.png`;
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

export async function captureSyncHeartShareCard(element: HTMLElement): Promise<Blob> {
  await waitForShareCardAssets(element);

  const canvas = await html2canvas(element, {
    width: SYNC_HEART_SHARE_CAPTURE_SIZE.width,
    height: SYNC_HEART_SHARE_CAPTURE_SIZE.height,
    scale: 3,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15_000,
    backgroundColor: '#fce7f3',
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

export async function downloadSyncHeartShareCard(blob: Blob): Promise<void> {
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
    /* fallback below */
  }
  return false;
}

async function shareNative(blob: Blob, payload: SyncHeartSharePayload): Promise<SyncHeartShareResult> {
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
      title: buildSyncHeartShareTitle(payload),
      text: buildSyncHeartShareText(payload),
      files: [uri],
      dialogTitle: `分享 ${APP_NAME}`,
    });
    return 'shared';
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    throw e;
  }
}

async function shareWeb(blob: Blob, payload: SyncHeartSharePayload): Promise<SyncHeartShareResult> {
  const title = buildSyncHeartShareTitle(payload);
  const text = buildSyncHeartShareText(payload);

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
    await downloadSyncHeartShareCard(blob);
    return 'downloaded';
  } catch {
    if (await copyShareText(text)) return 'copied';
    return 'failed';
  }
}

export async function shareSyncHeartCard(
  blob: Blob,
  payload: SyncHeartSharePayload
): Promise<SyncHeartShareResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      return shareNative(blob, payload);
    }
    return shareWeb(blob, payload);
  } catch (e) {
    console.error('[sync-heart-share]', e);
    const text = buildSyncHeartShareText(payload);
    try {
      await downloadSyncHeartShareCard(blob);
      return 'downloaded';
    } catch {
      if (await copyShareText(text)) return 'copied';
      return 'failed';
    }
  }
}

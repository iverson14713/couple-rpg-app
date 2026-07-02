import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { LOVEQUEST_APP_URL } from '../../lib/aiShareConfig';
import { APP_NAME } from '../../theme';
import { waitForShareCardAssets } from './loveQuestShareBrand';

export const HEART_CIRCLE_SHARE_CAPTURE_SIZE = {
  width: 360,
  height: 640,
} as const;

export type HeartCircleSharePayload = {
  winnerName: string;
  loserName: string;
  totalRounds: number;
  dailyGamesToday: number;
  dailyGamesCap: number;
  quote: string;
};

export type HeartCircleShareResult =
  | 'shared'
  | 'downloaded'
  | 'text_only'
  | 'cancelled'
  | 'failed';

export function buildHeartCircleShareTitle(payload: HeartCircleSharePayload): string {
  return `${payload.winnerName} 贏了愛心圈圈戰！`;
}

export function buildHeartCircleShareText(payload: HeartCircleSharePayload): string {
  return `🎉 ${payload.winnerName} 在 LoveQuest 愛心圈圈戰獲勝！\n${payload.loserName} 這次沒地方可以圈了\n本局 ${payload.totalRounds} 回合 · 感情升溫 +1\n「${payload.quote}」\n和另一半一起挑戰吧 👉 ${LOVEQUEST_APP_URL}`;
}

function shareFilename(): string {
  return `lovequest-heart-circle-${Date.now()}.png`;
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

export async function captureHeartCircleShareCard(element: HTMLElement): Promise<Blob> {
  await waitForShareCardAssets(element);

  const canvas = await html2canvas(element, {
    width: HEART_CIRCLE_SHARE_CAPTURE_SIZE.width,
    height: HEART_CIRCLE_SHARE_CAPTURE_SIZE.height,
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

export async function downloadHeartCircleShareCard(blob: Blob): Promise<void> {
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

async function shareNative(blob: Blob, payload: HeartCircleSharePayload): Promise<HeartCircleShareResult> {
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
      title: buildHeartCircleShareTitle(payload),
      text: buildHeartCircleShareText(payload),
      files: [uri],
      dialogTitle: `分享 ${APP_NAME}`,
    });
    return 'shared';
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    throw e;
  }
}

async function shareWeb(blob: Blob, payload: HeartCircleSharePayload): Promise<HeartCircleShareResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    await downloadHeartCircleShareCard(blob);
    return 'downloaded';
  }

  const file = new File([blob], shareFilename(), { type: 'image/png' });
  const title = buildHeartCircleShareTitle(payload);
  const text = buildHeartCircleShareText(payload);

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, text, files: [file] });
      return 'shared';
    }
    await navigator.share({ title, text, url: LOVEQUEST_APP_URL });
    return 'text_only';
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    throw e;
  }
}

export async function shareHeartCircleCard(
  blob: Blob,
  payload: HeartCircleSharePayload
): Promise<HeartCircleShareResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      return shareNative(blob, payload);
    }
    return shareWeb(blob, payload);
  } catch (e) {
    console.error('[heart-circle-share]', e);
    try {
      await downloadHeartCircleShareCard(blob);
      return 'downloaded';
    } catch {
      return 'failed';
    }
  }
}

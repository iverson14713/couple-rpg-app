import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { LOVEQUEST_APP_URL } from './aiShareConfig';
import { waitForShareCardAssets } from '../games/heartCircle/loveQuestShareBrand';
import type { CoupleDailyNote } from '../storage/dailyNotesTypes';
import { dailyMemoryShareSourceLabel, formatMemoryDisplayDate } from './dailyMemoryLabels';
import { getTogetherDaysInfo } from './relationshipDays';

/**
 * Share card is rendered at full pixel size and captured with html2canvas scale: 1.
 * Never uses devicePixelRatio / screen size.
 */
export type MemoryShareFormat = 'story' | 'post';

export const MEMORY_SHARE_SIZES = {
  /** IG Story — fixed output PNG */
  story: { width: 1080, height: 1920 },
  /** Future IG feed post */
  post: { width: 1080, height: 1350 },
} as const;

export const MEMORY_SHARE_FORMAT: MemoryShareFormat = 'story';

export const MEMORY_SHARE_CAPTURE_SIZE = MEMORY_SHARE_SIZES[MEMORY_SHARE_FORMAT];

/** Always 1 — output pixels = DOM pixels (1080×1920). */
export const MEMORY_SHARE_OUTPUT_SCALE = 1;

/** IG Story UI safe zones (full-res px). */
export const MEMORY_SHARE_STORY_SAFE = {
  topPx: 180,
  bottomPx: 250,
} as const;

/** Share-card quote: max ~2 lines; truncate in JS (html2canvas clips line-clamp). */
export function truncateShareQuote(text: string, maxChars = 22): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(1, maxChars - 1))}…`;
}

export type MemorySharePayload = {
  noteDate: string;
  displayDate: string;
  content: string | null;
  photoDataUrl: string | null;
  nameA: string;
  nameB: string;
  togetherDays: number | null;
  sourceLabel: string | null;
};

export type MemoryShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

export async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string' && result.startsWith('data:')) resolve(result);
        else reject(new Error('invalid data url'));
      };
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function buildMemorySharePayload(
  note: CoupleDailyNote,
  nameA: string,
  nameB: string,
  relationshipStart: string
): Promise<MemorySharePayload> {
  const [y, m, d] = note.noteDate.split('-').map(Number);
  const from =
    y && m && d ? new Date(y, m - 1, d, 12, 0, 0, 0) : new Date();
  const together = getTogetherDaysInfo(relationshipStart, from);

  let photoDataUrl: string | null = null;
  if (note.photoUrl) {
    photoDataUrl = await urlToDataUrl(note.photoUrl);
  }

  const rawContent = note.content?.trim() || null;

  return {
    noteDate: note.noteDate,
    displayDate: formatMemoryDisplayDate(note.noteDate),
    content: rawContent ? truncateShareQuote(rawContent) : null,
    photoDataUrl,
    nameA,
    nameB,
    togetherDays: together.kind === 'active' ? together.days : null,
    sourceLabel: dailyMemoryShareSourceLabel(note.sourceType, note.sourceMeta),
  };
}

function shareFilename(): string {
  return `lovequest-memory-${Date.now()}.png`;
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

export async function captureMemoryShareCard(element: HTMLElement): Promise<Blob> {
  await waitForShareCardAssets(element);

  const outW = MEMORY_SHARE_CAPTURE_SIZE.width;
  const outH = MEMORY_SHARE_CAPTURE_SIZE.height;

  // html2canvas: fixed 1080×1920, scale:1 only. Do NOT use devicePixelRatio.
  const rendered = await html2canvas(element, {
    width: 1080,
    height: 1920,
    windowWidth: 1080,
    windowHeight: 1920,
    scale: 1,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15_000,
    backgroundColor: '#f7efe6',
    logging: false,
    foreignObjectRendering: false,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    onclone: (clonedDoc, clonedEl) => {
      const root = clonedEl as HTMLElement;
      root.style.width = `${outW}px`;
      root.style.height = `${outH}px`;
      root.style.transform = 'none';
      root.style.zoom = '1';
      clonedDoc.querySelectorAll<HTMLImageElement>('img[data-share-asset]').forEach((img) => {
        img.crossOrigin = 'anonymous';
        img.decoding = 'sync';
      });
    },
  });

  // Guarantee exact 1080×1920 even if html2canvas mis-reports size
  let canvas = rendered;
  if (rendered.width !== outW || rendered.height !== outH) {
    const fixed = document.createElement('canvas');
    fixed.width = outW;
    fixed.height = outH;
    const ctx = fixed.getContext('2d');
    if (!ctx) throw new Error('無法建立分享卡畫布');
    ctx.fillStyle = '#f7efe6';
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(rendered, 0, 0, outW, outH);
    canvas = fixed;
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1));
  if (!blob) throw new Error('無法產生分享卡圖片');
  return blob;
}

export function buildMemoryShareText(payload: MemorySharePayload): string {
  const line = payload.content ? `「${payload.content}」\n` : '';
  const days =
    payload.togetherDays != null ? `交往第 ${payload.togetherDays} 天 · ` : '';
  return `❤️ ${payload.nameA} × ${payload.nameB} 的今日小回憶\n${line}${days}${payload.displayDate}\n一起用 LoveQuest 留下回憶 👉 ${LOVEQUEST_APP_URL}`;
}

export function buildMemoryShareTitle(payload: MemorySharePayload): string {
  return `今日小回憶 · ${payload.displayDate}`;
}

async function downloadBlob(blob: Blob): Promise<void> {
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

async function shareNative(blob: Blob, payload: MemorySharePayload): Promise<MemoryShareResult> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const filename = shareFilename();
  await Filesystem.writeFile({
    path: filename,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({
    path: filename,
    directory: Directory.Cache,
  });

  try {
    await Share.share({
      title: buildMemoryShareTitle(payload),
      text: buildMemoryShareText(payload),
      files: [uri],
      dialogTitle: '分享回憶',
    });
    return 'shared';
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    throw e;
  }
}

async function shareWeb(blob: Blob, payload: MemorySharePayload): Promise<MemoryShareResult> {
  const file = new File([blob], shareFilename(), { type: 'image/png' });
  const title = buildMemoryShareTitle(payload);
  const text = buildMemoryShareText(payload);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        return 'shared';
      }
      await navigator.share({ title, text });
      return 'shared';
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    }
  }

  await downloadBlob(blob);
  return 'downloaded';
}

export async function shareMemoryCard(
  blob: Blob,
  payload: MemorySharePayload
): Promise<MemoryShareResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      return await shareNative(blob, payload);
    }
    return await shareWeb(blob, payload);
  } catch (e) {
    console.error('[memory-share]', e);
    return 'failed';
  }
}

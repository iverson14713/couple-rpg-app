import { toCanvas } from 'html-to-image';
import html2canvas from 'html2canvas';

/** Extra supersampling before downscale to App Store exact pixels */
const EXPORT_SUPERSAMPLE = 2;

export const EXPORT_CAPTURE_CLASS = 'lq-export-capture';

async function waitForPaint(): Promise<void> {
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  });
}

/**
 * Capture the on-screen preview viewport (the clipped box that includes CSS scale).
 * pixelRatio = targetWidth / viewportWidth so PNG matches what the user sees.
 */
export async function capturePreviewViewport(
  viewport: HTMLElement,
  width: number,
  height: number,
  backgroundColor?: string
): Promise<HTMLCanvasElement> {
  await waitForPaint();

  viewport.scrollIntoView({ block: 'center', inline: 'nearest' });
  await waitForPaint();

  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  if (vw < 1 || vh < 1) {
    throw new Error('Preview viewport is not visible — scroll it into view and retry');
  }

  const pixelRatio = (width / vw) * EXPORT_SUPERSAMPLE;

  try {
    const canvas = await toCanvas(viewport, {
      pixelRatio,
      cacheBust: true,
      width: vw,
      height: vh,
      backgroundColor,
      style: {
        margin: '0',
        padding: '0',
      },
    });
    return canvas;
  } catch (err) {
    console.warn('[export] html-to-image failed, using html2canvas fallback', err);
    return html2canvas(viewport, {
      scale: pixelRatio,
      width: vw,
      height: vh,
      useCORS: true,
      backgroundColor: backgroundColor ?? null,
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });
  }
}

export async function canvasToExactPngBlob(
  source: HTMLCanvasElement,
  width: number,
  height: number
): Promise<Blob> {
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png', 1));
  if (!blob) throw new Error('Failed to create PNG');
  return blob;
}

export function downloadPngBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportPreviewViewportToPng(
  viewport: HTMLElement,
  width: number,
  height: number,
  filename: string,
  backgroundColor?: string
): Promise<void> {
  const canvas = await capturePreviewViewport(viewport, width, height, backgroundColor);
  const blob = await canvasToExactPngBlob(canvas, width, height);
  downloadPngBlob(blob, filename);
}

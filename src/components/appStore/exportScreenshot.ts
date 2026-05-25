import html2canvas from 'html2canvas';
import { ASPECT_H, ASPECT_W } from './constants';
import {
  canvasToExactPngBlob,
  downloadPngBlob,
  EXPORT_RENDER_SCALE,
} from './exportCanvas';
import { ensureAppStoreFontsReady } from './fonts';

export async function exportScreenshotElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  await ensureAppStoreFontsReady();

  const canvas = await html2canvas(element, {
    width: ASPECT_W,
    height: ASPECT_H,
    scale: EXPORT_RENDER_SCALE,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    foreignObjectRendering: false,
  });

  const blob = await canvasToExactPngBlob(canvas, ASPECT_W, ASPECT_H);
  downloadPngBlob(blob, filename);
}

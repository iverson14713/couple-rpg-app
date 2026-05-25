import { ASPECT_H, ASPECT_W } from './constants';
import {
  canvasToExactPngBlob,
  captureElementForExport,
  downloadPngBlob,
} from './exportCanvas';
import { ensureAppStoreFontsReady } from './fonts';

/** First stop of slide gradient — solid fallback for html2canvas. */
const EXPORT_BG = '#fdba74';

export async function exportScreenshotElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  await ensureAppStoreFontsReady();

  const canvas = await captureElementForExport(element, ASPECT_W, ASPECT_H, EXPORT_BG);
  const blob = await canvasToExactPngBlob(canvas, ASPECT_W, ASPECT_H);
  downloadPngBlob(blob, filename);
}

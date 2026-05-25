import { ASPECT_H, ASPECT_W } from './constants';
import { exportPreviewViewportToPng } from './exportCanvas';
import { ensureAppStoreFontsReady } from './fonts';

const EXPORT_BG = '#fdba74';

export async function exportScreenshotElement(
  previewViewport: HTMLElement,
  filename: string
): Promise<void> {
  await ensureAppStoreFontsReady();
  await exportPreviewViewportToPng(previewViewport, ASPECT_W, ASPECT_H, filename, EXPORT_BG);
}

import { ensureAppStoreFontsReady } from '../../components/appStore/fonts';
import {
  canvasToExactPngBlob,
  captureElementForExport,
  downloadPngBlob,
} from '../../components/appStore/exportCanvas';
import { APP_STORE_SCREEN, type ShowcaseDeviceId } from './constants';

const EXPORT_BG = '#fff9fc';

export async function exportLoveQuestShowcase(
  element: HTMLElement,
  filename: string,
  _device: ShowcaseDeviceId = '6.5'
): Promise<void> {
  const { w, h } = APP_STORE_SCREEN;
  await ensureAppStoreFontsReady();

  const canvas = await captureElementForExport(element, w, h, EXPORT_BG);
  const blob = await canvasToExactPngBlob(canvas, w, h);
  downloadPngBlob(blob, filename);
}

import html2canvas from 'html2canvas';
import { ensureAppStoreFontsReady } from '../../components/appStore/fonts';
import {
  canvasToExactPngBlob,
  downloadPngBlob,
  EXPORT_RENDER_SCALE,
} from '../../components/appStore/exportCanvas';
import { APP_STORE_SCREEN, type ShowcaseDeviceId } from './constants';

export async function exportLoveQuestShowcase(
  element: HTMLElement,
  filename: string,
  _device: ShowcaseDeviceId = '6.5'
): Promise<void> {
  const { w, h } = APP_STORE_SCREEN;
  await ensureAppStoreFontsReady();

  const canvas = await html2canvas(element, {
    width: w,
    height: h,
    scale: EXPORT_RENDER_SCALE,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    foreignObjectRendering: false,
  });

  const blob = await canvasToExactPngBlob(canvas, w, h);
  downloadPngBlob(blob, filename);
}

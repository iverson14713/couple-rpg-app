import { exportPreviewViewportToPng } from '../../components/appStore/exportCanvas';
import { ensureAppStoreFontsReady } from '../../components/appStore/fonts';
import { APP_STORE_SCREEN, type ShowcaseDeviceId } from './constants';

const EXPORT_BG = '#fff9fc';

export async function exportLoveQuestShowcase(
  previewViewport: HTMLElement,
  filename: string,
  _device: ShowcaseDeviceId = '6.5'
): Promise<void> {
  const { w, h } = APP_STORE_SCREEN;
  await ensureAppStoreFontsReady();
  await exportPreviewViewportToPng(previewViewport, w, h, filename, EXPORT_BG);
}

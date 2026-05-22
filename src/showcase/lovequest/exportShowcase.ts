import html2canvas from 'html2canvas';
import { ensureAppStoreFontsReady } from '../../components/appStore/fonts';
import { SHOWCASE_DEVICES, type ShowcaseDeviceId } from './constants';

export async function exportLoveQuestShowcase(
  element: HTMLElement,
  filename: string,
  device: ShowcaseDeviceId
): Promise<void> {
  const { w, h } = SHOWCASE_DEVICES[device];
  await ensureAppStoreFontsReady();

  const canvas = await html2canvas(element, {
    width: w,
    height: h,
    scale: 1,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    foreignObjectRendering: false,
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1));
  if (!blob) throw new Error('Failed to create PNG');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

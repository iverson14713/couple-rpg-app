/** Render at 2× then downscale so PNG is exactly App Store dimensions with crisp type. */
const EXPORT_RENDER_SCALE = 2;

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

export { EXPORT_RENDER_SCALE };

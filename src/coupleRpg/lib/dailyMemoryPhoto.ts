const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.82;

export type CompressedMemoryPhoto = {
  blob: Blob;
  width: number;
  height: number;
  ext: 'jpg' | 'webp';
};

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_load_failed'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas_to_blob_failed'));
      },
      type,
      quality
    );
  });
}

/** Compress photo for daily memory upload (max edge 1200px, ~200–500KB). */
export async function compressMemoryPhoto(file: Blob): Promise<CompressedMemoryPhoto> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  try {
    const webp = await canvasToBlob(canvas, 'image/webp', JPEG_QUALITY);
    if (webp.size > 0 && webp.size <= 520_000) {
      return { blob: webp, width, height, ext: 'webp' };
    }
  } catch {
    /* fall through to jpeg */
  }

  const jpeg = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
  return { blob: jpeg, width, height, ext: 'jpg' };
}

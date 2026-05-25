import html2canvas from 'html2canvas';

/** Render at 2× then downscale so PNG is exactly App Store dimensions with crisp type. */
const EXPORT_RENDER_SCALE = 2;

/** Applied to cloned DOM so html2canvas matches on-screen preview (no blur wash). */
export const EXPORT_CAPTURE_CLASS = 'lq-export-capture';

const CAPTURE_RESET_STYLE =
  'position:fixed;left:0;top:0;z-index:2147483646;pointer-events:none;margin:0;opacity:1;visibility:visible;';

function findCaptureRoot(cloned: HTMLElement): HTMLElement {
  if (
    cloned.classList.contains('lq-showcase-canvas') ||
    cloned.classList.contains('app-store-slide')
  ) {
    return cloned;
  }
  const inner = cloned.querySelector<HTMLElement>('.lq-showcase-canvas, .app-store-slide');
  return inner ?? cloned;
}

function injectCaptureStyles(doc: Document): void {
  const style = doc.createElement('style');
  style.textContent = `
    .${EXPORT_CAPTURE_CLASS}, .${EXPORT_CAPTURE_CLASS} * {
      animation: none !important;
      transition: none !important;
    }
  `;
  doc.head.appendChild(style);
}

/**
 * Capture a full-size slide element. Briefly pins it in-viewport so filters/gradients
 * rasterize like the preview (off-screen -12000px breaks blur in many browsers).
 */
export async function captureElementForExport(
  element: HTMLElement,
  width: number,
  height: number,
  backgroundColor: string
): Promise<HTMLCanvasElement> {
  const prevStyle = element.getAttribute('style') ?? '';
  const parent = element.parentElement;
  const nextSibling = element.nextSibling;
  element.classList.add(EXPORT_CAPTURE_CLASS);
  document.body.appendChild(element);
  element.setAttribute('style', CAPTURE_RESET_STYLE);

  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  });

  try {
    return await html2canvas(element, {
      width,
      height,
      scale: EXPORT_RENDER_SCALE,
      useCORS: true,
      backgroundColor,
      logging: false,
      foreignObjectRendering: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height,
      onclone: (doc, clonedNode) => {
        injectCaptureStyles(doc);
        if (clonedNode instanceof HTMLElement) {
          const root = findCaptureRoot(clonedNode);
          root.classList.add(EXPORT_CAPTURE_CLASS);
        }
      },
    });
  } finally {
    element.classList.remove(EXPORT_CAPTURE_CLASS);
    if (prevStyle) element.setAttribute('style', prevStyle);
    else element.removeAttribute('style');
    if (parent) {
      if (nextSibling && nextSibling.parentElement === parent) {
        parent.insertBefore(element, nextSibling);
      } else {
        parent.appendChild(element);
      }
    }
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

export { EXPORT_RENDER_SCALE };

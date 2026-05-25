import html2canvas from 'html2canvas';

/** Render at 2× then downscale so PNG is exactly App Store dimensions with crisp type. */
const EXPORT_RENDER_SCALE = 2;

export const EXPORT_CAPTURE_CLASS = 'lq-export-capture';

const CAPTURE_PIN_STYLE =
  'position:fixed;left:0;top:0;z-index:2147483646;pointer-events:none;margin:0;opacity:1;visibility:visible;transform:none;';

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
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-stat-card,
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-feature-card,
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-ai-hero,
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-reminder-hero,
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-game-hero {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    .${EXPORT_CAPTURE_CLASS} [style*="filter"] {
      filter: none !important;
    }
  `;
  doc.head.appendChild(style);
}

type ScaleWrapState = {
  wrap: HTMLElement;
  prevWrapTransform: string;
  prevWrapOrigin: string;
  prevParentOverflow: string;
  prevParentWidth: string;
  prevParentHeight: string;
};

/** Undo preview scale(0.2) so capture matches what the user sees, at full resolution. */
function beginFullSizeFromPreviewWrap(canvas: HTMLElement): ScaleWrapState | null {
  const wrap = canvas.parentElement;
  if (!wrap || !wrap.style.transform.includes('scale')) return null;

  const parent = wrap.parentElement;
  const state: ScaleWrapState = {
    wrap,
    prevWrapTransform: wrap.style.transform,
    prevWrapOrigin: wrap.style.transformOrigin,
    prevParentOverflow: parent?.style.overflow ?? '',
    prevParentWidth: parent?.style.width ?? '',
    prevParentHeight: parent?.style.height ?? '',
  };

  if (parent) {
    parent.style.overflow = 'visible';
    parent.style.width = `${canvas.offsetWidth}px`;
    parent.style.height = `${canvas.offsetHeight}px`;
  }
  wrap.style.transform = 'none';
  wrap.style.transformOrigin = 'top left';

  return state;
}

function endFullSizeFromPreviewWrap(state: ScaleWrapState | null): void {
  if (!state) return;
  const parent = state.wrap.parentElement;
  state.wrap.style.transform = state.prevWrapTransform;
  state.wrap.style.transformOrigin = state.prevWrapOrigin;
  if (parent) {
    parent.style.overflow = state.prevParentOverflow;
    parent.style.width = state.prevParentWidth;
    parent.style.height = state.prevParentHeight;
  }
}

/**
 * Capture the same DOM node used in on-screen preview (WYSIWYG).
 * Temporarily removes preview scale and pins at 0,0 for reliable rasterization.
 */
export async function captureElementForExport(
  element: HTMLElement,
  width: number,
  height: number,
  backgroundColor: string
): Promise<HTMLCanvasElement> {
  const scaleState = beginFullSizeFromPreviewWrap(element);

  const prevStyle = element.getAttribute('style') ?? '';
  const parent = element.parentElement;
  const nextSibling = element.nextSibling;

  element.classList.add(EXPORT_CAPTURE_CLASS);
  document.body.appendChild(element);
  element.setAttribute('style', `${CAPTURE_PIN_STYLE}width:${width}px;height:${height}px;`);

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
          findCaptureRoot(clonedNode).classList.add(EXPORT_CAPTURE_CLASS);
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
    endFullSizeFromPreviewWrap(scaleState);
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

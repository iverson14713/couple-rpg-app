import { toCanvas } from 'html-to-image';
import html2canvas from 'html2canvas';

const EXPORT_RENDER_SCALE = 2;

export const EXPORT_CAPTURE_CLASS = 'lq-export-capture';

const PHONE_SCREEN_FILL = '#fef9fb';

type ExpandedPreviewState = {
  scaleWrap: HTMLElement | null;
  viewport: HTMLElement | null;
  viewportParent: HTMLElement | null;
  prevScaleTransform: string;
  prevScaleOrigin: string;
  prevViewportWidth: string;
  prevViewportHeight: string;
  prevViewportOverflow: string;
  prevParentOverflow: string;
};

async function waitForPaint(): Promise<void> {
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  });
}

function injectCaptureStyles(doc: Document): void {
  const style = doc.createElement('style');
  style.textContent = `
    .${EXPORT_CAPTURE_CLASS}, .${EXPORT_CAPTURE_CLASS} * {
      animation: none !important;
      transition: none !important;
    }
    .${EXPORT_CAPTURE_CLASS} .ai-result-enter-stagger > *,
    .${EXPORT_CAPTURE_CLASS} .ai-result-enter,
    .${EXPORT_CAPTURE_CLASS} .date-timeline-item,
    .${EXPORT_CAPTURE_CLASS} .date-timeline-node {
      opacity: 1 !important;
      transform: none !important;
    }
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-stat-card,
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-feature-card {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-phone-screen,
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-phone-screen-content {
      background-color: #fef9fb !important;
    }
    .${EXPORT_CAPTURE_CLASS} .lq-showcase-phone-screen {
      box-shadow: inset 0 0 0 4px #fef9fb !important;
    }
  `;
  doc.head.appendChild(style);
}

function expandPreviewToFullSize(
  viewport: HTMLElement,
  width: number,
  height: number
): ExpandedPreviewState {
  const scaleWrap = viewport.firstElementChild instanceof HTMLElement ? viewport.firstElementChild : null;
  const viewportParent = viewport.parentElement;

  const state: ExpandedPreviewState = {
    scaleWrap,
    viewport,
    viewportParent,
    prevScaleTransform: scaleWrap?.style.transform ?? '',
    prevScaleOrigin: scaleWrap?.style.transformOrigin ?? '',
    prevViewportWidth: viewport.style.width,
    prevViewportHeight: viewport.style.height,
    prevViewportOverflow: viewport.style.overflow,
    prevParentOverflow: viewportParent?.style.overflow ?? '',
  };

  if (scaleWrap) {
    scaleWrap.style.transform = 'none';
    scaleWrap.style.transformOrigin = 'top left';
  }
  viewport.style.width = `${width}px`;
  viewport.style.height = `${height}px`;
  viewport.style.overflow = 'visible';
  if (viewportParent) viewportParent.style.overflow = 'visible';

  return state;
}

function restoreExpandedPreview(state: ExpandedPreviewState): void {
  if (state.scaleWrap) {
    state.scaleWrap.style.transform = state.prevScaleTransform;
    state.scaleWrap.style.transformOrigin = state.prevScaleOrigin;
  }
  state.viewport.style.width = state.prevViewportWidth;
  state.viewport.style.height = state.prevViewportHeight;
  state.viewport.style.overflow = state.prevViewportOverflow;
  if (state.viewportParent) {
    state.viewportParent.style.overflow = state.prevParentOverflow;
  }
}

function findMarketingCanvas(viewport: HTMLElement): HTMLElement {
  const canvas = viewport.querySelector<HTMLElement>('.lq-showcase-canvas, .app-store-slide');
  if (!canvas) throw new Error('Marketing canvas not found inside preview');
  return canvas;
}

/**
 * Export the App Store marketing slide at full 1284×2778 (no preview scale).
 * Targets .lq-showcase-canvas inside the preview viewport.
 */
export async function captureMarketingSlide(
  viewport: HTMLElement,
  width: number,
  height: number,
  backgroundColor?: string
): Promise<HTMLCanvasElement> {
  const canvas = findMarketingCanvas(viewport);
  const expanded = expandPreviewToFullSize(viewport, width, height);

  canvas.classList.add(EXPORT_CAPTURE_CLASS);
  viewport.scrollIntoView({ block: 'center', inline: 'nearest' });

  await waitForPaint();
  await new Promise((r) => setTimeout(r, 120));

  try {
    return await html2canvas(canvas, {
      width,
      height,
      scale: EXPORT_RENDER_SCALE,
      useCORS: true,
      backgroundColor: backgroundColor ?? null,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height,
      onclone: (doc, node) => {
        injectCaptureStyles(doc);
        if (node instanceof HTMLElement) {
          node.classList.add(EXPORT_CAPTURE_CLASS);
          node.querySelector('.lq-showcase-canvas, .app-store-slide')?.classList.add(EXPORT_CAPTURE_CLASS);
        }
      },
    });
  } catch (err) {
    console.warn('[export] html2canvas failed, trying html-to-image', err);
    return toCanvas(canvas, {
      pixelRatio: EXPORT_RENDER_SCALE,
      cacheBust: true,
      width,
      height,
      backgroundColor,
    });
  } finally {
    canvas.classList.remove(EXPORT_CAPTURE_CLASS);
    restoreExpandedPreview(expanded);
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

export async function exportPreviewViewportToPng(
  viewport: HTMLElement,
  width: number,
  height: number,
  filename: string,
  backgroundColor?: string
): Promise<void> {
  const canvas = await captureMarketingSlide(viewport, width, height, backgroundColor);
  const blob = await canvasToExactPngBlob(canvas, width, height);
  downloadPngBlob(blob, filename);
}

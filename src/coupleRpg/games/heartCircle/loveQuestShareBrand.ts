/** 分享卡專用 App Icon（public PNG，html2canvas 可穩定捕捉） */
export const LOVEQUEST_SHARE_ICON_PNG = '/icon-512.png';

const ICON_CACHE_BUST = '1';

export function loveQuestShareIconUrl(): string {
  return `${LOVEQUEST_SHARE_ICON_PNG}?v=${ICON_CACHE_BUST}`;
}

export function preloadImage(src: string, timeoutMs = 12_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'sync';

    const timer = window.setTimeout(() => {
      reject(new Error(`圖片載入逾時: ${src}`));
    }, timeoutMs);

    img.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error(`圖片載入失敗: ${src}`));
    };
    img.src = src;
  });
}

/** 產生分享圖前預載 icon，並等待分享卡 DOM 內 img 完成 decode */
export async function waitForShareCardAssets(root?: HTMLElement | null): Promise<void> {
  try {
    await preloadImage(loveQuestShareIconUrl());
  } catch {
    /* 元件會顯示 CSS fallback */
  }

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  if (!root) return;

  const imgs = root.querySelectorAll<HTMLImageElement>('img[data-share-asset]');
  await Promise.all(
    Array.from(imgs).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        })
    )
  );
}

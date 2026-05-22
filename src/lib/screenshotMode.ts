/** LoveQuest / 上架截圖：?screenshotMode=true 隱藏 Tab、debug、多餘 chrome */
export function isScreenshotMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('screenshotMode') === 'true';
}

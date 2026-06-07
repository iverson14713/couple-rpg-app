/**
 * LoveQuest iPad 13" App Store screenshots — Chromium native capture (2064×2752).
 *
 * Prerequisites:
 *   npm run dev:client   (in another terminal)
 *   npx playwright install chromium   (first time only)
 *
 * Usage:
 *   npm run screenshot:lovequest-ipad
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'screenshots', 'lovequest');

const BASE_URL = (process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const VIEWPORT_W = 2064;
const VIEWPORT_H = 2752;

const SLIDES = [
  { index: 1, filename: 'ipad-01-main.png' },
  { index: 2, filename: 'ipad-02-anniversary.png' },
  { index: 3, filename: 'ipad-03-ai-date.png' },
  { index: 4, filename: 'ipad-04-level.png' },
  { index: 5, filename: 'ipad-05-custom-game.png' },
];

async function waitForScreenshotReady(page) {
  await page.waitForSelector('[data-screenshot-ready="true"]', { timeout: 60_000 });
  await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
  await page.waitForTimeout(600);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
    deviceScaleFactor: 1,
  });

  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Viewport: ${VIEWPORT_W}×${VIEWPORT_H}, deviceScaleFactor: 1`);
  console.log(`Output: ${OUT_DIR}\n`);

  for (const { index, filename } of SLIDES) {
    const url = `${BASE_URL}/app-store-screenshot/lovequest-ipad/${index}`;
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
      await waitForScreenshotReady(page);

      const outPath = path.join(OUT_DIR, filename);
      await page.screenshot({
        path: outPath,
        fullPage: false,
        type: 'png',
      });
      console.log(`✓ ${filename}  ←  ${url}`);
    } catch (err) {
      console.error(`✗ ${filename} failed:`, err);
      process.exitCode = 1;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

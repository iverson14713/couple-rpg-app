/**
 * 首頁插畫去背：移除白底／棋盤格，輸出真透明 PNG。
 */
import { existsSync } from 'fs';
import { mkdir, readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/coupleRpg/assets/home-icons');
const SRC_DIRS = [
  path.join(
    process.env.HOME || '',
    '.cursor/projects/Users-iverson14713-Projects-couple-rpg-app/assets'
  ),
  path.join(ROOT, 'src/coupleRpg/assets/home-icons'),
];

const PAIRS = [
  ['calendar', 'ChatGPT_Image_2026_6_4____08_22_36'],
  ['dinner', 'ChatGPT_Image_2026_6_4____08_23_40'],
  ['date', 'ChatGPT_Image_2026_6_4____08_24_44'],
  ['love-task', 'ChatGPT_Image_2026_6_4____08_25_37'],
  ['chores', 'ChatGPT_Image_2026_6_4____08_26_49'],
  ['dice', 'ChatGPT_Image_2026_6_4____08_27_23'],
  ['love-task-hero', 'ChatGPT_Image_2026_6_5____10_23_29'],
];

function isBg(r, g, b, a) {
  if (a < 12) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  if (max < 28 && sat < 24) return true;
  if (max > 228 && sat < 36) return true;
  if (max > 200 && sat < 22 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10) return true;
  return false;
}

function floodBackground(buf, w, h) {
  const visited = new Uint8Array(w * h);
  const q = [];
  const push = (x, y) => {
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isBg(buf[o], buf[o + 1], buf[o + 2], buf[o + 3])) return;
    visited[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (q.length) {
    const i = q.pop();
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  for (let i = 0; i < w * h; i++) {
    if (visited[i]) buf[i * 4 + 3] = 0;
  }
}

async function findSource(prefix) {
  for (const dir of SRC_DIRS) {
    if (!existsSync(dir)) continue;
    const files = await readdir(dir);
    const hit = files.find((f) => f.startsWith(prefix) && /\.(png|jpe?g)$/i.test(f));
    if (hit) return path.join(dir, hit);
  }
  return null;
}

async function processOne(name, prefix) {
  const src = await findSource(prefix);
  if (!src) {
    console.warn('skip (no source):', name);
    return;
  }

  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buf = Buffer.from(data);
  floodBackground(buf, info.width, info.height);

  await sharp(buf, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, `${name}.png`));

  console.log('ok', name, '←', path.basename(src));
}

await mkdir(OUT_DIR, { recursive: true });
for (const [name, prefix] of PAIRS) {
  await processOne(name, prefix);
}

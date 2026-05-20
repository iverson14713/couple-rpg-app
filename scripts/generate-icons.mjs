/**
 * Rasterize public/icons/lovequest-icon.svg into PWA / favicon / iOS sizes.
 * Run: node scripts/generate-icons.mjs
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SVG_PATH = join(ROOT, 'public', 'icons', 'lovequest-icon.svg');
const OUT_DIR = join(ROOT, 'public');

const OUTPUTS = [
  { file: 'favicon.png', size: 32 },
  { file: 'icon-192.png', size: 192 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-512.png', size: 512 },
];

const svg = readFileSync(SVG_PATH);

for (const { file, size } of OUTPUTS) {
  const out = join(OUT_DIR, file);
  await sharp(svg, { density: Math.max(192, size * 2) })
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(out);
  console.log(`Wrote ${file} (${size}x${size})`);
}

console.log('Done.');

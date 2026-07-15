/**
 * Generate crisp square brand logos + PWA icons from PWA artwork.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('Install sharp: npm install --no-save sharp');
  process.exit(1);
}

const LOGO = join(root, 'assets/pwa/infinity-pwa-icon-source.png');
const OUT192 = join(root, 'icon-192.png');
const OUT512 = join(root, 'icon-512.png');

const BRAND_EXPORTS = [
  { rel: 'assets/logos/infinity-studio-cr-nav.png', size: 256 },
  { rel: 'assets/logos/infinity-studio-cr-nav@2x.png', size: 512 },
  { rel: 'assets/logos/infinity-studio-cr.png', size: 512 },
  { rel: 'assets/logos/infinity-studio-cr-logo.png', size: 1024 },
  { rel: 'assets/logos/infinity-studio-cr-transparent.png', size: 512 },
  { rel: 'assets/logos/infinity-logo.png', size: 512 },
];

async function squareMaster() {
  const meta = await sharp(LOGO).metadata();
  const side = Math.min(meta.width, meta.height);
  const left = Math.max(0, Math.floor((meta.width - side) / 2));
  const top = Math.max(0, Math.floor((meta.height - side) / 2));
  return sharp(LOGO)
    .extract({ left, top, width: side, height: side })
    .png({ compressionLevel: 6, adaptiveFiltering: true });
}

async function exportSquare(base, size, dest) {
  const buf = await base
    .clone()
    .resize(size, size, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 6, adaptiveFiltering: true })
    .toBuffer();
  writeFileSync(dest, buf);
  console.log('Wrote', dest, `(${size}x${size}, ${buf.length} bytes)`);
}

const master = await squareMaster();
for (const { rel, size } of BRAND_EXPORTS) {
  await exportSquare(master, size, join(root, rel));
}
await exportSquare(master, 192, OUT192);
await exportSquare(master, 512, OUT512);

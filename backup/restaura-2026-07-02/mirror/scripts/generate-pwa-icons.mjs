/**
 * Generate PWA icons (192 + 512) from Infinity PWA artwork.
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

async function buildIcon(size) {
  return sharp(LOGO)
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

writeFileSync(OUT192, await buildIcon(192));
writeFileSync(OUT512, await buildIcon(512));
console.log('Wrote', OUT192, OUT512);

/**
 * Generate PWA icons (192 + 512) from Infinity PWA artwork.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { createRequire } from 'module';
import { writeFileSync, copyFileSync } from 'fs';
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
const BRAND_LOGOS = [
  'assets/logos/infinity-studio-cr-nav.png',
  'assets/logos/infinity-studio-cr.png',
  'assets/logos/infinity-studio-cr-logo.png',
  'assets/logos/infinity-studio-cr-transparent.png',
  'assets/logos/infinity-logo.png',
];

for (const rel of BRAND_LOGOS) {
  const dest = join(root, rel);
  copyFileSync(LOGO, dest);
  console.log('Synced brand logo ->', rel);
}

async function buildIcon(size) {
  return sharp(LOGO)
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

writeFileSync(OUT192, await buildIcon(192));
writeFileSync(OUT512, await buildIcon(512));
console.log('Wrote', OUT192, OUT512);

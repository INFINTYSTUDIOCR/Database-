/**
 * Generate PWA icons (192 + 512) from Infinity Studio CR logo.
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

const BG = { r: 91, g: 33, b: 182, alpha: 1 }; // #5B21B6
const LOGO = join(root, 'assets/logos/infinity-studio-cr-nav.png');
const OUT192 = join(root, 'icon-192.png');
const OUT512 = join(root, 'icon-512.png');

async function buildIcon(size) {
  const pad = Math.round(size * 0.08);
  const inner = size - pad * 2;
  const logo = await sharp(LOGO)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG
    }
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const buf192 = await buildIcon(192);
const buf512 = await buildIcon(512);
writeFileSync(OUT192, buf192);
writeFileSync(OUT512, buf512);
console.log('Wrote', OUT192, OUT512);

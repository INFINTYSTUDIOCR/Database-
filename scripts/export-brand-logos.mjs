import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const input = path.join(root, 'assets/logos/infinity-studio-cr-logo.png');
const outFull = path.join(root, 'assets/logos/infinity-studio-cr.png');
const outNav = path.join(root, 'assets/logos/infinity-studio-cr-nav.png');

/** Original Off The Clock CSS display heights */
const HERO_CSS_PX = 160;
const NAV_CSS_PX = 52;

const base = sharp(input)
  .trim({ background: '#FFFFFF', threshold: 14 })
  .extend({ top: 10, bottom: 10, left: 12, right: 12, background: '#FFFFFF' });

await base
  .clone()
  .resize({ height: HERO_CSS_PX * 2, withoutEnlargement: true })
  .flatten({ background: '#FFFFFF' })
  .png({ compressionLevel: 9 })
  .toFile(outFull);

await base
  .clone()
  .resize({ height: NAV_CSS_PX * 2, withoutEnlargement: true })
  .flatten({ background: '#FFFFFF' })
  .png({ compressionLevel: 9 })
  .toFile(outNav);

const full = await sharp(outFull).metadata();
const nav = await sharp(outNav).metadata();
console.log('Wrote', outFull, `${full.width}x${full.height}`, '(hero', HERO_CSS_PX + 'px)');
console.log('Wrote', outNav, `${nav.width}x${nav.height}`, '(nav', NAV_CSS_PX + 'px)');

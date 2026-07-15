import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const input = path.join(root, 'assets/logos/infinity-logo-improved.png');
const output = path.join(root, 'assets/logos/infinity-studio-cr-transparent.png');

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const px = data;

for (let i = 0; i < px.length; i += channels) {
  const r = px[i];
  const g = px[i + 1];
  const b = px[i + 2];
  const lum = (r + g + b) / 3;
  const maxC = Math.max(r, g, b);

  // Pure/near-black → fully transparent
  if (maxC <= 22) {
    px[i + 3] = 0;
    continue;
  }

  // Glow fringe: soft alpha so halos survive on light backgrounds
  if (maxC <= 95 && lum < 90) {
    const t = (maxC - 22) / (95 - 22);
    px[i + 3] = Math.round(Math.pow(t, 0.65) * 220);
    continue;
  }

  px[i + 3] = 255;
}

await sharp(px, { raw: { width, height, channels } })
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log('Wrote', output, `${width}x${height}`);

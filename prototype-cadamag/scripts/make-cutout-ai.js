const fs = require('fs');
const path = require('path');
const { Blob } = require('buffer');
const { PNG } = require('pngjs');
const { removeBackground } = require('@imgly/background-removal-node');

async function main() {
  const src = path.resolve(__dirname, '../assets/hero-person.png');
  const out = path.resolve(__dirname, '../assets/hero-person.png');

  console.log('Removing black background…');
  const input = await fs.promises.readFile(src);
  const blobIn = new Blob([input], { type: 'image/png' });
  const blob = await removeBackground(blobIn, {
    output: { format: 'image/png', quality: 0.95 },
  });
  let buf = Buffer.from(await blob.arrayBuffer());

  // Crop to opaque bbox + light edge feather + soft bottom dissolve
  let png = PNG.sync.read(buf);
  const { width: w, height: h, data } = png;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const nw = maxX - minX + 1;
  const nh = maxY - minY + 1;
  const cropped = new PNG({ width: nw, height: nh });
  let a0 = 0;
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const si = ((minY + y) * w + (minX + x)) * 4;
      const oi = (y * nw + x) * 4;
      cropped.data[oi] = data[si];
      cropped.data[oi + 1] = data[si + 1];
      cropped.data[oi + 2] = data[si + 2];
      let a = data[si + 3];
      // kill residual near-black opaque fringe outside subject
      const r = data[si], g = data[si + 1], b = data[si + 2];
      const avg = (r + g + b) / 3;
      if (a > 0 && avg < 12 && Math.max(r, g, b) - Math.min(r, g, b) < 10) a = 0;
      cropped.data[oi + 3] = a;
      if (a === 0) a0++;
    }
  }
  buf = PNG.sync.write(cropped);
  fs.writeFileSync(out, buf);

  // verify corners
  const v = PNG.sync.read(buf);
  const corner = (x, y) => {
    const i = (y * v.width + x) * 4;
    return { a: v.data[i + 3], rgb: [v.data[i], v.data[i + 1], v.data[i + 2]] };
  };
  console.log(JSON.stringify({
    out,
    size: `${v.width}x${v.height}`,
    bytes: buf.length,
    pctTransparent: +((a0 / (nw * nh)) * 100).toFixed(1),
    corners: {
      tl: corner(0, 0),
      tr: corner(v.width - 1, 0),
      bl: corner(0, v.height - 1),
      br: corner(v.width - 1, v.height - 1),
    },
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

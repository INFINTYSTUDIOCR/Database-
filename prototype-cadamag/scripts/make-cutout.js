const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const src = path.resolve(__dirname, '../../assets/photos/hero-coaching.jpg');
const out = path.resolve(__dirname, '../assets/hero-person-cutout.png');

const raw = jpeg.decode(fs.readFileSync(src), { useTArray: true, formatAsRGBA: true });
const { width: w, height: h, data } = raw;

function idx(x, y) { return (y * w + x) * 4; }

function isSkin(r, g, b) {
  // protect face / hands
  return r > 90 && g > 50 && b > 40 && r > b && r > g - 10 && (r - b) > 15 && (r - g) < 80;
}
function isHair(r, g, b) {
  return r < 90 && g < 70 && b < 60 && Math.abs(r - g) < 25;
}
function isClothes(r, g, b) {
  // gray blazer / white shirt
  const avg = (r + g + b) / 3;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return spread < 35 && avg > 40 && avg < 220;
}
function isPerson(r, g, b) {
  return isSkin(r, g, b) || isHair(r, g, b) || isClothes(r, g, b);
}
function isBgColor(r, g, b, x, y) {
  if (isPerson(r, g, b)) return false;
  // warm orange plate (left studio light)
  if (r > 155 && (r - b) > 55 && b < 150 && g < r - 10) return true;
  // bright window
  if (r > 170 && g > 160 && b > 150 && Math.abs(r - g) < 40 && x > w * 0.55) return true;
  // dark purple/blue plate
  if (r < 85 && g < 95 && b < 125 && b >= r && x > w * 0.65) return true;
  // near-black edges
  if (r < 28 && g < 28 && b < 35) return true;
  return false;
}

// Protect central subject ellipse — never remove unless extreme edge bg
function inSubjectCore(x, y) {
  const cx = w * 0.42, cy = h * 0.32;
  const rx = w * 0.28, ry = h * 0.34;
  const nx = (x - cx) / rx, ny = (y - cy) / ry;
  return (nx * nx + ny * ny) < 1;
}

const bg = new Uint8Array(w * h);
const visited = new Uint8Array(w * h);
const qx = new Int32Array(w * h);
const qy = new Int32Array(w * h);
let qh = 0, qt = 0;

function trySeed(x, y) {
  const i = idx(x, y);
  const r = data[i], g = data[i + 1], b = data[i + 2];
  if (!isBgColor(r, g, b, x, y)) return;
  if (inSubjectCore(x, y)) return;
  const p = y * w + x;
  if (visited[p]) return;
  visited[p] = 1;
  bg[p] = 1;
  qx[qt] = x; qy[qt] = y; qt++;
}

for (let x = 0; x < w; x++) { trySeed(x, 0); trySeed(x, h - 1); }
for (let y = 0; y < h; y++) { trySeed(0, y); trySeed(w - 1, y); }
// extra seeds along left warm strip
for (let y = 0; y < h; y += 2) {
  for (let x = 0; x < Math.floor(w * 0.08); x += 2) trySeed(x, y);
}

const tol = 38;
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
while (qh < qt) {
  const x = qx[qh], y = qy[qh];
  qh++;
  const si = idx(x, y);
  const sr = data[si], sg = data[si + 1], sb = data[si + 2];
  for (const [dx, dy] of dirs) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
    const p = ny * w + nx;
    if (visited[p]) continue;
    if (inSubjectCore(nx, ny)) { visited[p] = 1; continue; }
    const i = idx(nx, ny);
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (isPerson(r, g, b)) { visited[p] = 1; continue; }
    const dr = r - sr, dg = g - sg, db = b - sb;
    const d = Math.sqrt(dr * dr + dg * dg + db * db);
    visited[p] = 1;
    if (d <= tol && isBgColor(r, g, b, nx, ny)) {
      bg[p] = 1;
      qx[qt] = nx; qy[qt] = ny; qt++;
    }
  }
}

const png = new PNG({ width: w, height: h });
let bgCount = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const p = y * w + x;
    const i = idx(x, y);
    const o = p * 4;
    png.data[o] = data[i];
    png.data[o + 1] = data[i + 1];
    png.data[o + 2] = data[i + 2];
    let a = 255;
    if (bg[p]) {
      a = 0;
      bgCount++;
    } else {
      let n = 0;
      if (x > 0 && bg[p - 1]) n++;
      if (x < w - 1 && bg[p + 1]) n++;
      if (y > 0 && bg[p - w]) n++;
      if (y < h - 1 && bg[p + w]) n++;
      if (x > 0 && y > 0 && bg[p - w - 1]) n++;
      if (x < w - 1 && y < h - 1 && bg[p + w + 1]) n++;
      if (n) a = Math.round(255 * Math.max(0, 1 - n / 5));
    }
    // soft torso dissolve into scene
    if (y > h * 0.74) {
      const bf = Math.max(0, 1 - (y - h * 0.74) / (h * 0.26));
      a = Math.round(a * bf);
    }
    // soft left residual plate wipe
    if (x < w * 0.1 && !inSubjectCore(x, y)) {
      a = Math.round(a * (x / (w * 0.1)));
    }
    png.data[o + 3] = Math.max(0, Math.min(255, a));
  }
}

fs.writeFileSync(out, PNG.sync.write(png));
console.log(JSON.stringify({
  w, h, bgCount, pct: +(bgCount / (w * h) * 100).toFixed(1),
  out, bytes: fs.statSync(out).size
}));

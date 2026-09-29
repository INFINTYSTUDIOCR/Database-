/**
 * Pass 3 — clear remaining known legacy hex in active Infinity UI/CSS/JS/SVG/config.
 * Skips backup/, kamuk/, gospanol/, and tooling scripts that store search patterns.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const SKIP = new Set(['backup', '.git', 'node_modules', 'kamuk', 'gospanol', '.cursor']);
const SKIP_FILES = /migrate-infinity-brand|inventory-brand-legacy|_inventory|BRAND-MIGRATION|ASSET_REQUIRES|retarget-diagnostico|build-diagnostico/;

const PAIRS = [
  ['#5B21B6', '#7B4DFF'],
  ['#5b21b6', '#7B4DFF'],
  ['#7C3AED', '#9B74FF'],
  ['#7c3aed', '#9B74FF'],
  ['#3B0E8C', '#5A2FE0'],
  ['#3b0e8c', '#5A2FE0'],
  ['#EDE9FE', 'rgba(123,77,255,0.16)'],
  ['#ede9fe', 'rgba(123,77,255,0.16)'],
  ['#F8F8FF', '#12161f'],
  ['#f8f8ff', '#12161f'],
  ['#F8F9FC', '#171C26'],
  ['#f8f9fc', '#171C26']
];

function walk(dir, out = []) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|css|js|json|svg|webmanifest)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const modified = [];
for (const f of walk(ROOT)) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  if (SKIP_FILES.test(rel)) continue;
  let t = fs.readFileSync(f, 'utf8');
  if (!/#5B21B6|#7C3AED|#3B0E8C|#EDE9FE|#F8F8FF|#5b21b6|#7c3aed|#3b0e8c|#ede9fe|#f8f8ff/i.test(t)) continue;
  let next = t;
  for (const [a, b] of PAIRS) next = next.split(a).join(b);
  if (next !== t) {
    fs.writeFileSync(f, next);
    modified.push(rel);
  }
}

// Space Grotesk leftover sweep
const fontMod = [];
for (const f of walk(ROOT)) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  if (SKIP_FILES.test(rel)) continue;
  let t = fs.readFileSync(f, 'utf8');
  if (!/Space Grotesk|Space\+Grotesk/i.test(t)) continue;
  let next = t
    .replace(/family=Space\+Grotesk:[^"'&]*/g, 'family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800')
    .replace(/Space\+Grotesk/g, 'Sora')
    .replace(/Space Grotesk/g, 'Sora');
  if (next !== t) {
    fs.writeFileSync(f, next);
    fontMod.push(rel);
  }
}

console.log('HEX_MODIFIED=' + modified.length);
console.log(modified.join('\n'));
console.log('FONT_MODIFIED=' + fontMod.length);
console.log(fontMod.join('\n'));
